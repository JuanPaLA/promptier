import type { BlockContent } from '../BlockContent';

/**
 * A bulleted list. Each entry in `items` is one line of inline content; the
 * bullet marker is a rendering concern, never stored.
 *
 * Shares the same value-item modelling as `OrderedListBlock` — see its design
 * note on why `BlockContent` is deliberately plural here rather than items
 * being first-class blocks.
 */
export interface UnorderedListBlock {
  readonly blockType: 'unorderedList';
  readonly items: BlockContent[];
}
