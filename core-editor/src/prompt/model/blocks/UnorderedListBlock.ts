import type { BlockContent } from '../BlockContent';

export interface UnorderedListBlock {
  readonly blockType: 'unorderedList';
  readonly items: BlockContent[];
}
