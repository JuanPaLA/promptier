import type { Block } from '../../model/Block';
import type { BlockContent } from '../../model/BlockContent';
import { parseInline, serializeInline } from '../inlineCodec';
import type { BlockCodec } from './BlockCodec';

type ListBlock = Extract<Block, { blockType: 'orderedList' | 'unorderedList' }>;

export interface ListCodecConfig<B extends ListBlock> {
  readonly blockType: B['blockType'];
  readonly parsePriority: number;
  readonly marker: RegExp;
  itemPrefix(index: number): string;
}

export function createListCodec<B extends ListBlock>(
  config: ListCodecConfig<B>,
): BlockCodec<B> {
  return {
    blockType: config.blockType,
    parsePriority: config.parsePriority,
    interruptsParagraph: (line) => config.marker.test(line),

    tryParse(cursor) {
      const firstLine = cursor.line();
      if (firstLine === undefined || !config.marker.test(firstLine)) return null;

      const items: BlockContent[] = [];
      let offset = 0;
      let item = config.marker.exec(firstLine);
      while (item !== null) {
        items.push(parseInline(item[1]));
        offset += 1;
        const line = cursor.line(offset);
        item = line === undefined ? null : config.marker.exec(line);
      }

      cursor.advance(offset);
      return { blockType: config.blockType, items } as B;
    },

    serialize(list) {
      return list.items
        .map((item, index) => `${config.itemPrefix(index)}${serializeInline(item)}`)
        .join('\n');
    },
  };
}
