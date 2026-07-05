import { BlockContent } from './BlockContent';

export type BlockType = 'paragraph' | 'heading';

/** The data every block carries. Plain, serializable — safe to JSON round-trip. */
export interface Block {
  readonly blockType: BlockType;
  readonly content: BlockContent;
}

/** The behavior for a block type, kept beside the data rather than on it. */
export interface BlockDefinition<B extends Block = Block> {
  readonly blockType: B['blockType'];
  toMarkdown(block: B): string;
}
