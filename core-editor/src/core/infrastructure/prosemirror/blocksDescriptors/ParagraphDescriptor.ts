import { NodeSpec } from 'prosemirror-model';
import { ParagraphBlock } from '../../../domain/blocks/ParagraphBlock';
import { richTextFromNode, richTextToNodes } from '../BlockContentMapper';
import { BlockDescriptor } from './BlockDescriptor';

const nodeSpec: NodeSpec = {
  group: 'block',
  content: 'text*',
  toDOM: () => ['p', 0] as const,
  parseDOM: [{ tag: 'p' }],
};

export const paragraphProseMirrorBlock: BlockDescriptor<ParagraphBlock> = {
  blockType: 'paragraph',
  nodeSpec,
  toProseMirrorNode: (block, schema) =>
    schema.nodes.paragraph.create(null, richTextToNodes(block.content, schema)),
  fromProseMirrorNode: (node) => ({ blockType: 'paragraph', content: richTextFromNode(node) }),
};
