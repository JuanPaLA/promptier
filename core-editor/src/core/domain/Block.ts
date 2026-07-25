import type { HeadingBlock } from './blocks/HeadingBlock';
import type { OrderedListBlock } from './blocks/OrderedListBlock';
import type { ParagraphBlock } from './blocks/ParagraphBlock';
import type { SectionBlock } from './blocks/SectionBlock';

/**
 * Every block the document can hold. Plain, serializable — safe to JSON
 * round-trip. Discriminated on `blockType`, so consumers narrow with a
 * `switch` and the compiler checks exhaustiveness.
 */
export type Block = ParagraphBlock | HeadingBlock | OrderedListBlock | SectionBlock;

/** The tag alone, for keying registries and maps. Derived — never declared twice. */
export type BlockType = Block['blockType'];
