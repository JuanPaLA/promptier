import { NodeSpec, Schema } from 'prosemirror-model';
import { blockDescriptors } from '././blocksDescriptors/descriptorRegistry';

function buildPromptSchema(): Schema {
  const blockNodes: Record<string, NodeSpec> = {};
  for (const descriptor of blockDescriptors) {
    blockNodes[descriptor.blockType] = descriptor.nodeSpec;
  }
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      ...blockNodes,
      text: { group: 'inline' },
    },
  });
}

export const promptSchema = buildPromptSchema();
