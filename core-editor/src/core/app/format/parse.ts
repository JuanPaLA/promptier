import type { Block } from '../../domain/Block';
import type { BlockContent, TextSegment } from '../../domain/BlockContent';
import type { Format } from '../../domain/Format';
import type { PromptContent } from '../../domain/PromptContent';
import { sectionTitleFromTag } from './sectionTag';
import { isEscapable, unescapeBlockStart, unescapeInlineText } from './textEscaping';

/**
 * Reads prompt text back into a document — the inverse of `serialize`.
 *
 * The grammar is closed: only what the block and mark registries can express is
 * recognized. Anything else degrades to literal text rather than being dropped,
 * so nothing a host stored ever disappears. See docs/format.md.
 */
export function parse(text: string): PromptContent {
  return { blocks: parseBlocks(splitLines(text)) };
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').split('\n');
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    if (lines[index].trim().length === 0) {
      index += 1;
      continue;
    }

    const fence = FENCE_OPEN.exec(lines[index]);
    if (fence) {
      index = readFence(lines, index, fence[1], blocks);
      continue;
    }

    const tag = openTagName(lines[index]);
    const close = tag !== null ? findCloseTag(lines, index, tag) : -1;
    if (tag !== null && close !== -1) {
      blocks.push(readSection(lines, index, close, tag));
      index = close + 1;
      continue;
    }

    const heading = HEADING.exec(lines[index]);
    if (heading) {
      blocks.push({
        blockType: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        content: parseInline(heading[2]),
      });
      index += 1;
      continue;
    }

    if (UNORDERED_ITEM.test(lines[index])) {
      index = readList(lines, index, 'unorderedList', UNORDERED_ITEM, blocks);
      continue;
    }
    if (ORDERED_ITEM.test(lines[index])) {
      index = readList(lines, index, 'orderedList', ORDERED_ITEM, blocks);
      continue;
    }

    index = readParagraph(lines, index, blocks);
  }

  return blocks;
}

/** Consumes a fence and its literal body; an unterminated fence runs to the end. */
function readFence(lines: string[], start: number, language: string, blocks: Block[]): number {
  let index = start + 1;
  const body: string[] = [];
  while (index < lines.length && !FENCE_CLOSE.test(lines[index])) {
    body.push(lines[index]);
    index += 1;
  }
  blocks.push({
    blockType: 'codeBlock',
    ...(language.length > 0 ? { language } : {}),
    code: body.join('\n'),
  });
  return index < lines.length ? index + 1 : index;
}

function readSection(lines: string[], open: number, close: number, tag: string): Block {
  const inner = lines.slice(open + 1, close);
  const first = inner.findIndex((line) => line.trim().length > 0);
  const description = first === -1 ? null : DESCRIPTION.exec(inner[first]);
  return {
    blockType: 'section',
    title: sectionTitleFromTag(tag),
    ...(description ? { description: description[1] } : {}),
    children: parseBlocks(description ? inner.slice(first + 1) : inner),
  };
}

function readList(
  lines: string[],
  start: number,
  blockType: 'orderedList' | 'unorderedList',
  marker: RegExp,
  blocks: Block[],
): number {
  const items: BlockContent[] = [];
  let index = start;
  let item = marker.exec(lines[index]);
  while (item) {
    items.push(parseInline(item[1]));
    index += 1;
    item = index < lines.length ? marker.exec(lines[index]) : null;
  }
  blocks.push({ blockType, items } as Block);
  return index;
}

/** Consecutive plain lines are one paragraph — hard-wrapped input reflows. */
function readParagraph(lines: string[], start: number, blocks: Block[]): number {
  const run: string[] = [unescapeBlockStart(lines[start])];
  let index = start + 1;
  while (index < lines.length && lines[index].trim().length > 0 && !startsBlock(lines[index])) {
    run.push(lines[index]);
    index += 1;
  }
  blocks.push({ blockType: 'paragraph', content: parseInline(run.join(' ')) });
  return index;
}

function startsBlock(line: string): boolean {
  return (
    FENCE_OPEN.test(line) ||
    HEADING.test(line) ||
    UNORDERED_ITEM.test(line) ||
    ORDERED_ITEM.test(line) ||
    openTagName(line) !== null ||
    CLOSE_TAG.test(line)
  );
}

function openTagName(line: string): string | null {
  const match = OPEN_TAG.exec(line.trim());
  return match ? match[1] : null;
}

/**
 * The matching close for the tag opened at `open`, or -1 when it never closes
 * (in which case the line is just text). Same-named nesting is counted, and
 * fenced regions are skipped so a tag written inside a code block never closes
 * a section — that is the format's escape hatch.
 */
function findCloseTag(lines: string[], open: number, tag: string): number {
  let depth = 0;
  let index = open + 1;

  while (index < lines.length) {
    if (FENCE_OPEN.test(lines[index])) {
      index += 1;
      while (index < lines.length && !FENCE_CLOSE.test(lines[index])) index += 1;
      index += 1;
      continue;
    }
    const line = lines[index].trim();
    if (line === `<${tag}>`) depth += 1;
    else if (line === `</${tag}>`) {
      if (depth === 0) return index;
      depth -= 1;
    }
    index += 1;
  }
  return -1;
}

export function parseInline(text: string): BlockContent {
  const segments: TextSegment[] = [];
  let plain = '';
  let index = 0;

  const flush = (): void => {
    pushSegment(segments, { text: plain });
    plain = '';
  };

  while (index < text.length) {
    if (text[index] === '\\' && isEscapable(text[index + 1] ?? '')) {
      plain += text[index + 1];
      index += 2;
      continue;
    }

    if (text.startsWith('**', index)) {
      const end = findDelimiter(text, index + 2, '**');
      if (end !== -1) {
        flush();
        for (const segment of parseInline(text.slice(index + 2, end))) {
          pushSegment(segments, withFormat(segment, 'bold'));
        }
        index = end + 2;
        continue;
      }
    }

    if (text[index] === '`') {
      const end = findDelimiter(text, index + 1, '`');
      if (end !== -1) {
        flush();
        pushSegment(segments, {
          text: unescapeInlineText(text.slice(index + 1, end)),
          formats: ['code'],
        });
        index = end + 1;
        continue;
      }
    }

    plain += text[index];
    index += 1;
  }

  flush();
  return segments;
}

/** The next unescaped `delimiter` at or after `from`, or -1. */
function findDelimiter(text: string, from: number, delimiter: string): number {
  let index = from;
  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text.startsWith(delimiter, index)) return index;
    index += 1;
  }
  return -1;
}

/**
 * Appends, merging into the previous segment when the formats match. The
 * mapper emits one segment per ProseMirror text node and ProseMirror merges
 * adjacent equally-marked text, so the parser has to merge too or the round
 * trip would differ by segment boundaries alone.
 */
function pushSegment(segments: TextSegment[], segment: TextSegment): void {
  if (segment.text.length === 0) return;
  const last = segments[segments.length - 1];
  if (last && sameFormats(last.formats, segment.formats)) {
    segments[segments.length - 1] = { ...last, text: last.text + segment.text };
    return;
  }
  segments.push(segment);
}

function withFormat(segment: TextSegment, format: Format): TextSegment {
  const formats = [...new Set([...(segment.formats ?? []), format])].sort(
    (left, right) => FORMAT_RANK[left] - FORMAT_RANK[right],
  );
  return { text: segment.text, formats };
}

function sameFormats(left: Format[] | undefined, right: Format[] | undefined): boolean {
  const a = left ?? [];
  const b = right ?? [];
  return a.length === b.length && a.every((format, index) => format === b[index]);
}

/** Schema declaration order, which is the order ProseMirror reports marks in. */
const FORMAT_RANK: Record<Format, number> = { bold: 0, code: 1 };

const FENCE_OPEN = /^```(\w*)\s*$/;
const FENCE_CLOSE = /^```\s*$/;
const OPEN_TAG = /^<([a-zA-Z][\w-]*)>$/;
const CLOSE_TAG = /^<\/[a-zA-Z][\w-]*>$/;
const DESCRIPTION = /^<!--\s*description:\s*([\s\S]*?)\s*-->$/;
const HEADING = /^(#{1,3}) (.*)$/;
const UNORDERED_ITEM = /^- (.*)$/;
const ORDERED_ITEM = /^\d+\. (.*)$/;
