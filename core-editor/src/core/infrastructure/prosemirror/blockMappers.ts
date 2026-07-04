import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Block, BlockType } from '../../domain/Block';
import { HeadingBlock } from '../../domain/blocks/heading';
import { ParagraphBlock } from '../../domain/blocks/paragraph';
import { AnyBlock } from '../../domain/blocks/registry';
import { promptSchema } from './schema';

interface BlockProseMirrorMapper<B extends Block> {
  toProseMirrorNode(block: B): ProseMirrorNode;
  fromProseMirrorNode(node: ProseMirrorNode): B;
}

function toHeadingLevel(level: number): HeadingBlock['level'] {
  return level === 2 || level === 3 ? level : 1;
}

const paragraphMapper: BlockProseMirrorMapper<ParagraphBlock> = {
  toProseMirrorNode: (block) =>
    promptSchema.nodes.paragraph.create(null, block.text ? promptSchema.text(block.text) : undefined),
  fromProseMirrorNode: (node) => ({ blockType: 'paragraph', text: node.textContent }),
};

const headingMapper: BlockProseMirrorMapper<HeadingBlock> = {
  toProseMirrorNode: (block) =>
    promptSchema.nodes.heading.create(
      { level: block.level },
      block.text ? promptSchema.text(block.text) : undefined,
    ),
  fromProseMirrorNode: (node) => ({
    blockType: 'heading',
    level: toHeadingLevel(node.attrs.level),
    text: node.textContent,
  }),
};

type BlockProseMirrorRegistry = {
  [K in BlockType]: BlockProseMirrorMapper<Extract<AnyBlock, { blockType: K }>>;
};

const blockMappers: BlockProseMirrorRegistry = {
  paragraph: paragraphMapper,
  heading: headingMapper,
};

export function blockToProseMirrorNode(block: Block): ProseMirrorNode {
  const mapper = blockMappers[block.blockType] as BlockProseMirrorMapper<Block>;
  return mapper.toProseMirrorNode(block);
}

export function blockFromProseMirrorNode(node: ProseMirrorNode): Block {
  const mapper = (blockMappers[node.type.name as BlockType] ??
    blockMappers.paragraph) as BlockProseMirrorMapper<Block>;
  return mapper.fromProseMirrorNode(node);
}
