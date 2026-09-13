import type { InputRule } from 'prosemirror-inputrules';
import type { Schema } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';
import type { NodeViewConstructor } from 'prosemirror-view';

import type { Block, BlockType } from '../../../../prompt/model/Block';
import { combineKeymaps } from '../combineKeymaps';
import type { BlockDescriptor } from './BlockDescriptor';

export type BlockDescriptorMap = {
  [K in BlockType]: BlockDescriptor<Extract<Block, { blockType: K }>>;
};

export class BlockRegistry {
  private readonly descriptors: readonly BlockDescriptor[];
  private readonly descriptorsByType = new Map<BlockType, BlockDescriptor>();

  constructor(descriptorsByType: BlockDescriptorMap) {
    this.descriptors = Object.entries(descriptorsByType).map(([registeredType, descriptor]) => {
      if (descriptor.blockType !== registeredType) {
        throw new Error(
          `Block descriptor registered as "${registeredType}" declares "${descriptor.blockType}".`,
        );
      }
      this.descriptorsByType.set(descriptor.blockType, descriptor);
      return descriptor;
    });
  }

  all(): readonly BlockDescriptor[] {
    return this.descriptors;
  }

  get(blockType: BlockType): BlockDescriptor {
    const descriptor = this.descriptorsByType.get(blockType);
    if (!descriptor) throw new Error(`No block descriptor is registered for "${blockType}".`);
    return descriptor;
  }

  has(blockType: string): blockType is BlockType {
    return this.descriptorsByType.has(blockType as BlockType);
  }

  defaultBlocks(): readonly Block[] {
    return this.descriptors.flatMap((descriptor) =>
      descriptor.createDefaultBlock ? [descriptor.createDefaultBlock()] : [],
    );
  }

  editorStyles(): readonly string[] {
    return this.descriptors.flatMap((descriptor) =>
      descriptor.editorStyles ? [descriptor.editorStyles] : [],
    );
  }

  inputRules(schema: Schema): readonly InputRule[] {
    return this.descriptors.flatMap((descriptor) => descriptor.inputRules?.(schema) ?? []);
  }

  keymap(schema: Schema): Record<string, Command> {
    return combineKeymaps(
      this.descriptors.map((descriptor) => descriptor.keymaps?.(schema) ?? {}),
    );
  }

  nodeViews(): Record<string, NodeViewConstructor> {
    return Object.fromEntries(
      this.descriptors.flatMap((descriptor) =>
        descriptor.nodeView ? [[descriptor.blockType, descriptor.nodeView] as const] : [],
      ),
    );
  }
}
