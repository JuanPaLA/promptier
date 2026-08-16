import type { UnorderedListBlock } from '../../../domain/blocks/UnorderedListBlock';
import { createListCodec } from './listCodec';

export const unorderedListCodec = createListCodec<UnorderedListBlock>({
  blockType: 'unorderedList',
  marker: /^- (.*)$/,
  itemPrefix: () => '- ',
});
