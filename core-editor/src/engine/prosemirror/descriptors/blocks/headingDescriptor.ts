import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import type { HeadingBlock } from '../../../../prompt/model/blocks/HeadingBlock';
import { blockContentFromNode, blockContentToNodes } from '../../mapping/blockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const headingDescriptor: BlockDescriptor<HeadingBlock> = {
  blockType: 'heading',
  nodeSpec: headingNodeSpec(),
  toProseMirrorNode: (block, schema) =>
    schema.nodes.heading.create({ level: block.level }, blockContentToNodes(block.content, schema)),
  fromProseMirrorNode: (node) => ({
    blockType: 'heading',
    level: toHeadingLevel(node.attrs.level),
    content: blockContentFromNode(node),
  }),
  inputRules: (schema) => [
    textblockTypeInputRule(/^#\s$/, schema.nodes.heading, { level: 1 }),
    textblockTypeInputRule(/^##\s$/, schema.nodes.heading, { level: 2 }),
    textblockTypeInputRule(/^###\s$/, schema.nodes.heading, { level: 3 }),
  ],
};

function headingNodeSpec(): NodeSpec {
  const tags = ['h1', 'h2', 'h3'] as const;
  return {
    group: 'block',
    content: 'text*',
    attrs: { level: { default: 1 } },
    defining: true,
    toDOM: (node) => [tags[node.attrs.level - 1], 0] as const,
    parseDOM: tags.map((tag, index) => ({ tag, attrs: { level: index + 1 } })),
  };
}

function toHeadingLevel(level: number): HeadingBlock['level'] {
  return level === 2 || level === 3 ? level : 1;
}
