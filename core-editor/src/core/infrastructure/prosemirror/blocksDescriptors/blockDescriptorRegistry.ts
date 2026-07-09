import { InputRule } from 'prosemirror-inputrules';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { NodeViewConstructor } from 'prosemirror-view';
import { Block, BlockType } from '../../../domain/Block';
import { AnyBlock } from '../../../domain/blocks/blockRegistry';
import { headingProseMirrorBlock } from './HeadingDescriptor';
import { paragraphProseMirrorBlock } from './ParagraphDescriptor';
import { sectionProseMirrorBlock } from './SectionDescriptor';
import { BlockDescriptor } from './BlockDescriptor';

type BlockProseMirrorRegistry = {
  [K in BlockType]: BlockDescriptor<Extract<AnyBlock, { blockType: K }>>;
};

const blockRegistry: BlockProseMirrorRegistry = {
  paragraph: paragraphProseMirrorBlock,
  heading: headingProseMirrorBlock,
  section: sectionProseMirrorBlock,
};

/**
 * Ordered list of every block's descriptor. Order defines schema node order —
 * the first block-group node becomes the doc's default block, so paragraph
 * (declared first in the registry) stays the default.
 */
export const blockDescriptors = Object.values(blockRegistry);

export function blockToProseMirrorNode(block: Block, schema: Schema): ProseMirrorNode {
  const descriptor = blockRegistry[block.blockType] as BlockDescriptor<Block>;
  return descriptor.toProseMirrorNode(block, schema, (child) =>
    blockToProseMirrorNode(child, schema),
  );
}

export function blockFromProseMirrorNode(node: ProseMirrorNode): Block {
  const descriptor = (blockRegistry[node.type.name as BlockType] ??
    blockRegistry.paragraph) as BlockDescriptor<Block>;
  return descriptor.fromProseMirrorNode(node, blockFromProseMirrorNode);
}

export function blockInputRules(schema: Schema): InputRule[] {
  return blockDescriptors.flatMap((descriptor) => descriptor.inputRules?.(schema) ?? []);
}

export function blockKeymaps(schema: Schema): Record<string, Command> {
  return Object.assign(
    {},
    ...blockDescriptors.map((descriptor) => descriptor.keymaps?.(schema) ?? {}),
  );
}

export function blockNodeViews(): Record<string, NodeViewConstructor> {
  const views: Record<string, NodeViewConstructor> = {};
  for (const descriptor of blockDescriptors) {
    if (descriptor.nodeView) views[descriptor.blockType] = descriptor.nodeView;
  }
  return views;
}
