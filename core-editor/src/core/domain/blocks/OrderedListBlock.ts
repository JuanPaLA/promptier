import type { BlockContent } from '../BlockContent';

/**
 * A numbered list. Each entry in `items` is one line of inline content —
 * numbering is a rendering concern, never stored. Items are values, not blocks
 * with identity; see the decisions log for when to promote them.
 */
export interface OrderedListBlock {
  readonly blockType: 'orderedList';
  readonly items: BlockContent[];
}
