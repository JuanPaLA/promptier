import type { OrderedListBlock } from '../../../domain/blocks/OrderedListBlock';
import { createListCodec } from './listCodec';

export const orderedListCodec = createListCodec<OrderedListBlock>({
  blockType: 'orderedList',
  marker: /^\d+\. (.*)$/,
  itemPrefix: (index) => `${index + 1}. `,
});
