import type { ParagraphBlock } from '../../../domain/blocks/ParagraphBlock';
import { parseInline, serializeInline } from '../inlineCodec';
import { escapeBlockStart, unescapeBlockStart } from '../textEscaping';
import type { BlockCodec } from './BlockCodec';

export const paragraphCodec: BlockCodec<ParagraphBlock> = {
  blockType: 'paragraph',
  interruptsParagraph: () => false,

  tryParse(cursor) {
    const firstLine = cursor.line();
    if (firstLine === undefined || firstLine.trim().length === 0) return null;

    const run = [unescapeBlockStart(firstLine)];
    let offset = 1;
    while (true) {
      const line = cursor.line(offset);
      if (line === undefined || line.trim().length === 0 || cursor.isBlockBoundary(offset)) break;
      run.push(line);
      offset += 1;
    }

    cursor.advance(offset);
    return { blockType: 'paragraph', content: parseInline(run.join(' ')) };
  },

  serialize(paragraph) {
    return escapeBlockStart(serializeInline(paragraph.content));
  },
};
