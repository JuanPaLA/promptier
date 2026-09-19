import type { OrderedListBlock } from '../../model/blocks/OrderedListBlock';
import { createListCodec } from './listCodec';

export const orderedListCodec = createListCodec<OrderedListBlock>({
  blockType: 'orderedList',
  parsePriority: 60,
  marker: /^\d+\. ([\s\S]*)$/,
  itemPrefix: (index) => `${index + 1}. `,
});
