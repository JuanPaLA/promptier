import { NodeSpec, Schema } from 'prosemirror-model';
import type { BlockRegistry } from './blocks/BlockRegistry';
import type { MarkRegistry } from './marks/MarkRegistry';

/** Builds the editor grammar from one explicit set of block and mark contributions. */
export function createPromptSchema(
  blocks: BlockRegistry,
  marks: MarkRegistry,
): Schema {
  const blockNodes: Record<string, NodeSpec> = {};
  for (const descriptor of blocks.all()) {
    blockNodes[descriptor.blockType] = descriptor.nodeSpec;
    Object.assign(blockNodes, descriptor.extraNodes);
  }
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      ...blockNodes,
      text: { group: 'inline' },
    },
    marks: marks.specs(),
  });
}
