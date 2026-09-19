import type { Block } from '../model/Block';
import type { PromptContent } from '../model/PromptContent';
import type { BlockParseCursor } from './codecs/BlockCodec';
import { blockCodecRegistry } from './codecs/blockCodecRegistry';
import { TemplateSyntax } from '../templates/TemplateSyntax';

export { parseInline } from './inlineCodec';

/**
 * Reads prompt text back into a document — the inverse of `serialize`.
 *
 * The grammar is closed: only what the block and mark registries can express is
 * recognized. Anything else degrades to literal text rather than being dropped,
 * so nothing a host stored ever disappears. See docs/format.md.
 */
export function parse(text: string): PromptContent {
  return { blocks: parseBlocks(splitLines(text)) };
}

function parseBlocks(lines: readonly string[]): Block[] {
  return new PromptTextParser(lines).readBlocks();
}

class PromptTextParser implements BlockParseCursor {
  private index = 0;

  constructor(private readonly lines: readonly string[]) {}

  readBlocks(): Block[] {
    return this.readBlocksUntil(() => false);
  }

  readBlocksUntil(isEnd: (line: string) => boolean): Block[] {
    const blocks: Block[] = [];

    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      if (isEnd(line)) break;
      if (line.trim().length === 0) {
        this.index += 1;
        continue;
      }

      blocks.push(this.readBlock());
    }

    return blocks;
  }

  line(offset = 0): string | undefined {
    return this.lines[this.index + offset];
  }

  advance(lineCount: number): void {
    this.index += lineCount;
  }

  isBlockBoundary(offset = 0): boolean {
    const line = this.line(offset);
    return line !== undefined && this.isBlockStart(line);
  }

  isBlockStart(line: string): boolean {
    return blockCodecRegistry.isBlockStart(line);
  }

  checkpoint(): number {
    return this.index;
  }

  restore(checkpoint: number): void {
    this.index = checkpoint;
  }

  private readBlock(): Block {
    return blockCodecRegistry.parse(this);
  }
}

function splitLines(text: string): string[] {
  return new TemplateSyntax().logicalLines(text.replace(/\r\n?/g, '\n'));
}
