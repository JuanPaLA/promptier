import { NodeSpec } from 'prosemirror-model';
import type { ParagraphBlock } from '../../../../prompt/model/blocks/ParagraphBlock';
import { blockContentFromNode, blockContentToNodes } from '../../mapping/blockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const paragraphDescriptor: BlockDescriptor<ParagraphBlock> = {
  blockType: 'paragraph',
  nodeSpec: paragraphNodeSpec(),
  toProseMirrorNode: (block, schema) =>
    schema.nodes.paragraph.create(null, blockContentToNodes(block.content, schema)),
  fromProseMirrorNode: (node) => ({ blockType: 'paragraph', content: blockContentFromNode(node) }),
};

function paragraphNodeSpec(): NodeSpec {
  return {
    group: 'block',
    content: 'text*',
    toDOM: () => ['p', 0] as const,
    parseDOM: [{ tag: 'p' }],
  };
}
