import type { UnorderedListBlock } from '../../model/blocks/UnorderedListBlock';
import { createListCodec } from './listCodec';

export const unorderedListCodec = createListCodec<UnorderedListBlock>({
  blockType: 'unorderedList',
  parsePriority: 70,
  marker: /^- (.*)$/,
  itemPrefix: () => '- ',
});
