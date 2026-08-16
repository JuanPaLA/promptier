import type { Block } from '../../../domain/Block';

export interface BlockCodec<B extends Block> {
  readonly blockType: B['blockType'];
  interruptsParagraph(line: string): boolean;
  tryParse(cursor: BlockParseCursor): B | null;
  serialize(block: B, serializeBlocks: SerializeBlocks): string;
}

export interface BlockParseCursor {
  line(offset?: number): string | undefined;
  slice(fromOffset: number, toOffset: number): readonly string[];
  advance(lineCount: number): void;
  isBlockBoundary(offset?: number): boolean;
  parseBlocks(lines: readonly string[]): Block[];
}

export type SerializeBlocks = (blocks: readonly Block[]) => string;
