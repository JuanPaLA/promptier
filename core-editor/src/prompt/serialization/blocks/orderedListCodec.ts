import type { OrderedListBlock } from '../../model/blocks/OrderedListBlock';
import { createListCodec } from './listCodec';

export const orderedListCodec = createListCodec<OrderedListBlock>({
  blockType: 'orderedList',
  marker: /^\d+\. (.*)$/,
  itemPrefix: (index) => `${index + 1}. `,
});
