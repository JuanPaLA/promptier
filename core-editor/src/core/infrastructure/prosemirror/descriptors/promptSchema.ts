import { NodeSpec, Schema } from 'prosemirror-model';
import { blockDescriptors } from './blocks/blockDescriptorRegistry';
import { markSpecs } from './marks/markDescriptorRegistry';

/** The editor's grammar, assembled from every descriptor's spec. */
export const promptSchema = buildPromptSchema();

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
