import { BlockContent } from './BlockContent';

export type BlockType = 'paragraph' | 'heading';

/** The data every block carries. Plain, serializable — safe to JSON round-trip. */
export interface Block {
  readonly blockType: BlockType;
  readonly content: BlockContent;
}
