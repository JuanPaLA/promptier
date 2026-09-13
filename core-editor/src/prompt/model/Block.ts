import type { CodeBlock } from './blocks/CodeBlock';
import type { HeadingBlock } from './blocks/HeadingBlock';
import type { OrderedListBlock } from './blocks/OrderedListBlock';
import type { ParagraphBlock } from './blocks/ParagraphBlock';
import type { QuoteBlock } from './blocks/QuoteBlock';
import type { SectionBlock } from './blocks/SectionBlock';
import type { UnorderedListBlock } from './blocks/UnorderedListBlock';

/**
 * Every block the document can hold. Plain, serializable — safe to JSON
 * round-trip. Discriminated on `blockType`, so consumers narrow with a
 * `switch` and the compiler checks exhaustiveness.
 */
export type Block =
  | ParagraphBlock
  | HeadingBlock
  | CodeBlock
  | OrderedListBlock
  | UnorderedListBlock
  | QuoteBlock
  | SectionBlock;

/** The tag alone, for keying registries and maps. Derived — never declared twice. */
export type BlockType = Block['blockType'];
