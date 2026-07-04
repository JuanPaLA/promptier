import { NodeSpec } from 'prosemirror-model';
import { ParagraphBlock } from '../../../domain/blocks/paragraph';
import { ProseMirrorBlock } from './ProseMirrorBlock';

const nodeSpec: NodeSpec = {
  group: 'block',
  content: 'text*',
  toDOM: () => ['p', 0] as const,
  parseDOM: [{ tag: 'p' }],
};

export const paragraphProseMirrorBlock: ProseMirrorBlock<ParagraphBlock> = {
  blockType: 'paragraph',
  nodeSpec,
  toProseMirrorNode: (block, schema) =>
    schema.nodes.paragraph.create(null, block.text ? schema.text(block.text) : undefined),
  fromProseMirrorNode: (node) => ({ blockType: 'paragraph', text: node.textContent }),
};
