import { chainCommands } from 'prosemirror-commands';
import { InputRule } from 'prosemirror-inputrules';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { NodeViewConstructor } from 'prosemirror-view';
import type { Block, BlockType } from '../../../domain/Block';
import { headingDescriptor } from './HeadingDescriptor';
import { orderedListDescriptor } from './OrderedListDescriptor';
import { paragraphDescriptor } from './ParagraphDescriptor';
import { sectionDescriptor } from './SectionDescriptor';
import { unorderedListDescriptor } from './UnorderedListDescriptor';
import { BlockDescriptor } from './BlockDescriptor';

type BlockDescriptorRegistry = {
  [K in BlockType]: BlockDescriptor<Extract<Block, { blockType: K }>>;
};

const blockRegistry: BlockDescriptorRegistry = {
  paragraph: paragraphDescriptor,
  heading: headingDescriptor,
  orderedList: orderedListDescriptor,
  unorderedList: unorderedListDescriptor,
  section: sectionDescriptor,
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
  // Multiple descriptors may bind the same key (e.g. section and orderedList
  // both handle Enter). Compose them into one command per key — each descriptor
  // guards on its own context and returns false to defer — instead of letting
  // Object.assign silently drop all but the last.
  const byKey: Record<string, Command[]> = {};
  for (const descriptor of blockDescriptors) {
    for (const [key, command] of Object.entries(descriptor.keymaps?.(schema) ?? {})) {
      (byKey[key] ??= []).push(command);
    }
  }
  const keymaps: Record<string, Command> = {};
  for (const [key, commands] of Object.entries(byKey)) {
    keymaps[key] = commands.length === 1 ? commands[0] : chainCommands(...commands);
  }
  return keymaps;
}

export function blockNodeViews(): Record<string, NodeViewConstructor> {
  const views: Record<string, NodeViewConstructor> = {};
  for (const descriptor of blockDescriptors) {
    if (descriptor.nodeView) views[descriptor.blockType] = descriptor.nodeView;
  }
  return views;
}
