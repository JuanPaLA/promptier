import type { UnorderedListBlock } from '../../../../domain/blocks/UnorderedListBlock';
import { createListDescriptor } from './listDescriptor';

export const unorderedListDescriptor = createListDescriptor<UnorderedListBlock>({
  blockType: 'unorderedList',
  listTag: 'ul',
  listClass: 'prompt-unordered-list',
  inputRulePattern: /^[-*]\s$/,
  inputRuleTrigger: (text) => text === '-' || text === '*',
});
