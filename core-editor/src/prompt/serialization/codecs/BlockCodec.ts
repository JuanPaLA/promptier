import type { Block } from '../../model/Block';

export interface BlockCodec<B extends Block = Block> {
  readonly blockType: B['blockType'];
  readonly parsePriority: number;
  interruptsParagraph(line: string): boolean;
  tryParse(cursor: BlockParseCursor): B | null;
  serialize(block: B, context: BlockSerializeContext): string;
}

export interface BlockParseCursor {
  line(offset?: number): string | undefined;
  advance(lineCount: number): void;
  isBlockBoundary(offset?: number): boolean;
  isBlockStart(line: string): boolean;
  readBlocksUntil(isEnd: (line: string) => boolean): Block[];
  checkpoint(): number;
  restore(checkpoint: number): void;
}

export interface BlockSerializeContext {
  serializeBlocks(blocks: readonly Block[]): string;
  escapeBlockStart(line: string): string;
}

export type BlockCodecMap = {
  readonly [K in Block['blockType']]: BlockCodec<Extract<Block, { blockType: K }>>;
};
