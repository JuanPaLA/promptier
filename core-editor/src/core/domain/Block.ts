export type BlockType = 'paragraph' | 'heading' | 'section';

/** The data every block carries. Plain, serializable — safe to JSON round-trip. */
export interface Block {
  readonly blockType: BlockType;
}
