import type { BlockContent, TextSegment } from '../../domain/BlockContent';
import type { Format } from '../../domain/Format';
import { escapeInlineText, isEscapable, unescapeInlineText } from './textEscaping';

export function parseInline(text: string): BlockContent {
  const segments: TextSegment[] = [];
  let plain = '';
  let index = 0;

  function flush(): void {
    pushSegment(segments, { text: plain });
    plain = '';
  }

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

export function serializeInline(content: BlockContent): string {
  return content.map(segmentToText).join('');
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

/** Adjacent equally-formatted segments have one canonical representation. */
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

function segmentToText(segment: TextSegment): string {
  return FORMAT_ORDER.filter((format) => segment.formats?.includes(format)).reduce(
    (inner, format) => FORMAT_WRAP[format](inner),
    escapeInlineText(segment.text),
  );
}

/** Schema declaration order, which is the order ProseMirror reports marks in. */
const FORMAT_RANK: Record<Format, number> = { bold: 0, code: 1 };

/** Nesting order for a multi-format segment, innermost first: code inside bold. */
const FORMAT_ORDER: Format[] = ['code', 'bold'];

const FORMAT_WRAP: Record<Format, (inner: string) => string> = {
  bold: (inner) => `**${inner}**`,
  code: (inner) => `\`${inner}\``,
};
