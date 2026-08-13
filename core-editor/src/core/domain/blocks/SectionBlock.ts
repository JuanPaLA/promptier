import type { Block } from '../Block';

/**
 * A titled, recursive container of blocks.
 *
 * Identity is derived, never stored: the title slugifies to the section's tag,
 * which is simultaneously its serialized XML tag, its outline anchor and its
 * id. Two sections whose titles slugify alike are indistinguishable — accepted
 * until cross-references need real identity, which will be a versioned
 * migration like any other.
 */
export interface SectionBlock {
  readonly blockType: 'section';
  readonly title: string;
  /** The section's intent, for maintainers. Serialized as a comment. */
  readonly description?: string;
  readonly children: Block[];
}
