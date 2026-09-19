import type { HeadingBlock } from '../../model/blocks/HeadingBlock';
import { parseInline, serializeInline } from '../inlineCodec';
import type { BlockCodec } from './BlockCodec';

export const headingCodec: BlockCodec<HeadingBlock> = {
  blockType: 'heading',
  parsePriority: 80,
  interruptsParagraph: (line) => HEADING.test(line),

  tryParse(cursor) {
    const line = cursor.line();
    if (line === undefined) return null;
    const heading = HEADING.exec(line);
    if (heading === null) return null;

    cursor.advance(1);
    return {
      blockType: 'heading',
      level: heading[1].length as HeadingBlock['level'],
      content: parseInline(heading[2]),
    };
  },

  serialize(heading) {
    return `${'#'.repeat(heading.level)} ${serializeInline(heading.content)}`;
  },
};

const HEADING = /^(#{1,3}) ([\s\S]*)$/;
