import { NodeSpec } from 'prosemirror-model';
import type { ParagraphBlock } from '../../../domain/blocks/ParagraphBlock';
import { blockContentFromNode, blockContentToNodes } from '../BlockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

const nodeSpec: NodeSpec = {
  group: 'block',
  content: 'text*',
  toDOM: () => ['p', 0] as const,
  parseDOM: [{ tag: 'p' }],
};

export const paragraphDescriptor: BlockDescriptor<ParagraphBlock> = {
  blockType: 'paragraph',
  nodeSpec,
  toProseMirrorNode: (block, schema) =>
    schema.nodes.paragraph.create(null, blockContentToNodes(block.content, schema)),
  fromProseMirrorNode: (node) => ({ blockType: 'paragraph', content: blockContentFromNode(node) }),
};
