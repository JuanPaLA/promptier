import type { QuoteBlock } from '../../model/blocks/QuoteBlock';
import { parseInline, serializeInline } from '../inlineCodec';
import type { BlockCodec } from './BlockCodec';

export const quoteCodec: BlockCodec<QuoteBlock> = {
  blockType: 'quote',
  parsePriority: 50,
  interruptsParagraph: (line) => QUOTE.test(line),

  tryParse(cursor) {
    const firstLine = cursor.line();
    if (firstLine === undefined || !QUOTE.test(firstLine)) return null;

    const lines: string[] = [];
    let offset = 0;
    let quote = QUOTE.exec(firstLine);
    while (quote !== null) {
      lines.push(quote[1]);
      offset += 1;
      const line = cursor.line(offset);
      quote = line === undefined ? null : QUOTE.exec(line);
    }

    cursor.advance(offset);
    return { blockType: 'quote', content: parseInline(lines.join(' ')) };
  },

  serialize(quote) {
    return `> ${serializeInline(quote.content)}`;
  },
};

const QUOTE = /^> (.*)$/;
