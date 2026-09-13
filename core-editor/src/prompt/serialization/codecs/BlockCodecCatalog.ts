import type { Block } from '../../model/Block';
import type {
  BlockCodec,
  BlockCodecMap,
  BlockParseCursor,
} from './BlockCodec';

export class BlockCodecCatalog {
  private readonly codecs: readonly BlockCodec[];
  private readonly codecsByType = new Map<Block['blockType'], BlockCodec>();
  private readonly parsers: readonly BlockCodec[];

  constructor(codecsByType: BlockCodecMap) {
    this.codecs = Object.entries(codecsByType).map(([registeredType, codec]) => {
      if (codec.blockType !== registeredType) {
        throw new Error(
          `Block codec registered as "${registeredType}" declares "${codec.blockType}".`,
        );
      }
      this.codecsByType.set(codec.blockType, codec);
      return codec;
    });
    this.parsers = [...this.codecs].sort(compareParsingOrder);
  }

  all(): readonly BlockCodec[] {
    return this.codecs;
  }

  forBlock<B extends Block>(block: B): BlockCodec<B> {
    const codec = this.codecsByType.get(block.blockType);
    if (!codec) throw new Error(`No block codec is registered for "${block.blockType}".`);
    return codec as BlockCodec<B>;
  }

  parse(cursor: BlockParseCursor): Block {
    for (const codec of this.parsers) {
      const checkpoint = cursor.checkpoint();
      const block = codec.tryParse(cursor);
      if (block !== null) return block;
      cursor.restore(checkpoint);
    }
    throw new Error('No block codec consumed the current line');
  }

  isBlockStart(line: string): boolean {
    return this.codecs.some((codec) => codec.interruptsParagraph(line));
  }
}

function compareParsingOrder(left: BlockCodec, right: BlockCodec): number {
  return right.parsePriority - left.parsePriority || left.blockType.localeCompare(right.blockType);
}
