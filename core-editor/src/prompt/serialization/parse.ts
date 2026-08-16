import type { Block } from '../model/Block';
import type { PromptContent } from '../model/PromptContent';
import type { BlockParseCursor } from './codecs/BlockCodec';
import { blockCodecs } from './codecs/blockCodecRegistry';

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
    const blocks: Block[] = [];

    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
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

  slice(fromOffset: number, toOffset: number): readonly string[] {
    return this.lines.slice(this.index + fromOffset, this.index + toOffset);
  }

  advance(lineCount: number): void {
    this.index += lineCount;
  }

  isBlockBoundary(offset = 0): boolean {
    const line = this.line(offset);
    return line !== undefined && blockCodecs.some((codec) => codec.interruptsParagraph(line));
  }

  parseBlocks(lines: readonly string[]): Block[] {
    return parseBlocks(lines);
  }

  private readBlock(): Block {
    for (const codec of blockCodecs) {
      const block = codec.tryParse(this);
      if (block !== null) return block;
    }
    throw new Error('No block codec consumed the current line');
  }
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').split('\n');
}
