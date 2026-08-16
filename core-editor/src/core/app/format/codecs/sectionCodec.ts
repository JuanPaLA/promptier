import type { SectionBlock } from '../../../domain/blocks/SectionBlock';
import { sectionTagName, sectionTitleFromTag } from '../sectionTag';
import type { BlockCodec, BlockParseCursor } from './BlockCodec';

export const sectionCodec: BlockCodec<SectionBlock> = {
  blockType: 'section',
  interruptsParagraph: (line) => openTagName(line) !== null || CLOSE_TAG.test(line),

  tryParse(cursor): SectionBlock | null {
    const tag = openTagName(cursor.line());
    if (tag === null) return null;

    const closeOffset = findCloseOffset(cursor, tag);
    if (closeOffset === -1) return null;

    const inner = cursor.slice(1, closeOffset);
    const firstContent = inner.findIndex((line) => line.trim().length > 0);
    const description = firstContent === -1 ? null : DESCRIPTION.exec(inner[firstContent]);
    const children = cursor.parseBlocks(description ? inner.slice(firstContent + 1) : inner);

    cursor.advance(closeOffset + 1);
    return {
      blockType: 'section',
      title: sectionTitleFromTag(tag),
      ...(description ? { description: description[1] } : {}),
      children,
    };
  },

  serialize(section, serializeBlocks) {
    const tag = sectionTagName(section.title);
    const parts: string[] = [];
    if (section.description !== undefined) {
      parts.push(`<!-- description: ${section.description} -->`);
    }
    const body = serializeBlocks(section.children);
    if (body.length > 0) parts.push(body);
    return `<${tag}>\n${parts.join('\n\n')}${parts.length > 0 ? '\n' : ''}</${tag}>`;
  },
};

function openTagName(line: string | undefined): string | null {
  if (line === undefined) return null;
  const match = OPEN_TAG.exec(line.trim());
  return match ? match[1] : null;
}

/** Finds the balanced close relative to the cursor, skipping fenced regions. */
function findCloseOffset(cursor: BlockParseCursor, tag: string): number {
  let depth = 0;
  let offset = 1;

  while (cursor.line(offset) !== undefined) {
    if (FENCE_OPEN.test(cursor.line(offset)!)) {
      offset += 1;
      while (cursor.line(offset) !== undefined && !FENCE_CLOSE.test(cursor.line(offset)!)) {
        offset += 1;
      }
      offset += 1;
      continue;
    }

    const line = cursor.line(offset)!.trim();
    if (line === `<${tag}>`) depth += 1;
    else if (line === `</${tag}>`) {
      if (depth === 0) return offset;
      depth -= 1;
    }
    offset += 1;
  }

  return -1;
}

const FENCE_OPEN = /^```(\w*)\s*$/;
const FENCE_CLOSE = /^```\s*$/;
const OPEN_TAG = /^<([a-zA-Z][\w-]*)>$/;
const CLOSE_TAG = /^<\/[a-zA-Z][\w-]*>$/;
const DESCRIPTION = /^<!--\s*description:\s*([\s\S]*?)\s*-->$/;
