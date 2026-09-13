import type { SectionBlock } from '../../model/blocks/SectionBlock';
import { sectionTagName, sectionTitleFromTag } from '../sectionTag';
import type { BlockCodec } from './BlockCodec';

export const sectionCodec: BlockCodec<SectionBlock> = {
  blockType: 'section',
  parsePriority: 90,
  interruptsParagraph: (line) => openTagName(line) !== null || CLOSE_TAG.test(line),

  tryParse(cursor): SectionBlock | null {
    const tag = openTagName(cursor.line());
    if (tag === null) return null;

    const closeTag = `</${tag}>`;
    cursor.advance(1);
    const children = cursor.readBlocksUntil((line) => line.trim() === closeTag);
    if (cursor.line()?.trim() !== closeTag) return null;
    cursor.advance(1);
    return {
      blockType: 'section',
      title: sectionTitleFromTag(tag),
      children,
    };
  },

  serialize(section, context) {
    const tag = sectionTagName(section.title);
    const body = context.serializeBlocks(section.children);
    return `<${tag}>\n${body}${body.length > 0 ? '\n' : ''}</${tag}>`;
  },
};

function openTagName(line: string | undefined): string | null {
  if (line === undefined) return null;
  const match = OPEN_TAG.exec(line.trim());
  return match ? match[1] : null;
}

const OPEN_TAG = /^<([a-zA-Z][\w-]*)>$/;
const CLOSE_TAG = /^<\/[a-zA-Z][\w-]*>$/;
