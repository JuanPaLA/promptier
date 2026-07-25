import type { BlockContent } from '../BlockContent';

/**
 * A numbered list. Each entry in `items` is one line of inline content —
 * numbering is a rendering concern, never stored.
 *
 * Design note: this is the first block where `BlockContent` plays a *plural*
 * role. Elsewhere a leaf block holds exactly one `BlockContent` (its inline
 * payload); here it doubles as "one addressable line among many." That is a
 * deliberate, scoped simplification — list items are modelled as values, not
 * as first-class blocks with identity. If items ever need stable ids,
 * cross-references, or nested/multi-block content, promote them to a
 * `ListItemBlock` (a container-style migration, versioned like the rest of
 * `PromptContent`). Until then, keep this the only place BlockContent is
 * plural, so the concept stays honest.
 */
export interface OrderedListBlock {
  readonly blockType: 'orderedList';
  readonly items: BlockContent[];
}
