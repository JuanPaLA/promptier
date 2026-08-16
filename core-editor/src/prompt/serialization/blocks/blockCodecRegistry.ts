import type { Block, BlockType } from '../../model/Block';
import type { BlockCodec } from './BlockCodec';
import { codeBlockCodec } from './codeBlockCodec';
import { headingCodec } from './headingCodec';
import { orderedListCodec } from './orderedListCodec';
import { paragraphCodec } from './paragraphCodec';
import { sectionCodec } from './sectionCodec';
import { unorderedListCodec } from './unorderedListCodec';

type CodecFor<K extends BlockType> = BlockCodec<Extract<Block, { blockType: K }>>;
type BlockCodecRegistry = { [K in BlockType]: CodecFor<K> };
type AnyBlockCodec = { [K in BlockType]: CodecFor<K> }[BlockType];

const registry: BlockCodecRegistry = {
  paragraph: paragraphCodec,
  heading: headingCodec,
  codeBlock: codeBlockCodec,
  orderedList: orderedListCodec,
  unorderedList: unorderedListCodec,
  section: sectionCodec,
};

/** Parsing precedence. Paragraph is the fallback and must remain last. */
export const blockCodecs: readonly AnyBlockCodec[] = [
  codeBlockCodec,
  sectionCodec,
  headingCodec,
  unorderedListCodec,
  orderedListCodec,
  paragraphCodec,
];

export function codecFor<B extends Block>(block: B): BlockCodec<B> {
  return registry[block.blockType] as BlockCodec<B>;
}
