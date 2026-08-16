import type { BlockContent } from '../BlockContent';

export interface OrderedListBlock {
  readonly blockType: 'orderedList';
  readonly items: BlockContent[];
}
