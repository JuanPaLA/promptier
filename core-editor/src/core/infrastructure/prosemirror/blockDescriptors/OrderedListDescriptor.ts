import type { OrderedListBlock } from '../../../domain/blocks/OrderedListBlock';
import { createListDescriptor } from './listDescriptor';

export const orderedListDescriptor = createListDescriptor<OrderedListBlock>({
  blockType: 'orderedList',
  listTag: 'ol',
  listClass: 'prompt-ordered-list',
  inputRulePattern: /^1\.\s$/,
  inputRuleTrigger: (text) => text === '1.',
});
