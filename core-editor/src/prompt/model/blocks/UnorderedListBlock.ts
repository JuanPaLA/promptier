import type { BlockContent } from '../BlockContent';

/**
 * A bulleted list. Each entry in `items` is one line of inline content; the
 * bullet marker is a rendering concern, never stored. Same value-item modelling
 * as `OrderedListBlock`.
 */
export interface UnorderedListBlock {
  readonly blockType: 'unorderedList';
  readonly items: BlockContent[];
}
