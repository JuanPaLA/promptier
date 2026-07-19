import { NodeSpec, Schema } from 'prosemirror-model';
import { blockDescriptors } from './blockDescriptors/blockDescriptorRegistry';
import { markSpecs } from './markDescriptors/markDescriptorRegistry';

function buildPromptSchema(): Schema {
  const blockNodes: Record<string, NodeSpec> = {};
  for (const descriptor of blockDescriptors) {
    blockNodes[descriptor.blockType] = descriptor.nodeSpec;
    Object.assign(blockNodes, descriptor.extraNodes);
  }
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      ...blockNodes,
      text: { group: 'inline' },
    },
    marks: markSpecs(),
  });
}

export const promptSchema = buildPromptSchema();
