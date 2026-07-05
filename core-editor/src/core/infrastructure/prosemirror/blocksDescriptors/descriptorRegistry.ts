import { InputRule } from 'prosemirror-inputrules';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Block, BlockType } from '../../../domain/Block';
import { AnyBlock } from '../../../domain/blocks/blockRegistry';
import { headingProseMirrorBlock } from './HeadingDescriptor';
import { paragraphProseMirrorBlock } from './ParagraphDescriptor';
import { BlockDescriptor } from './BlockDescriptor';

type BlockProseMirrorRegistry = {
  [K in BlockType]: BlockDescriptor<Extract<AnyBlock, { blockType: K }>>;
};

const blockRegistry: BlockProseMirrorRegistry = {
  paragraph: paragraphProseMirrorBlock,
  heading: headingProseMirrorBlock,
};

/**
 * Ordered list of every block's descriptor. Order defines schema node order —
 * the first block-group node becomes the doc's default block, so paragraph
 * (declared first in the registry) stays the default.
 */
export const blockDescriptors = Object.values(blockRegistry);

export function blockToProseMirrorNode(block: Block, schema: Schema): ProseMirrorNode {
  const descriptor = blockRegistry[block.blockType] as BlockDescriptor<Block>;
  return descriptor.toProseMirrorNode(block, schema);
}

export function blockFromProseMirrorNode(node: ProseMirrorNode): Block {
  const descriptor = (blockRegistry[node.type.name as BlockType] ??
    blockRegistry.paragraph) as BlockDescriptor<Block>;
  return descriptor.fromProseMirrorNode(node);
}

export function blockInputRules(schema: Schema): InputRule[] {
  return blockDescriptors.flatMap((descriptor) => descriptor.inputRules?.(schema) ?? []);
}
