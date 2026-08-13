import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import type { CodeBlock } from '../../../../domain/blocks/CodeBlock';
import { insertBlockAt, replaceRangeWithBlock } from '../../editing/blockTransactions';
import type { BlockDescriptor } from './BlockDescriptor';

export const codeBlockDescriptor: BlockDescriptor<CodeBlock> = {
  blockType: 'codeBlock',
  nodeSpec: codeBlockNodeSpec(),

  toProseMirrorNode: (block, schema) =>
    schema.nodes.codeBlock.create(
      { language: block.language ?? '' },
      block.code.length > 0 ? [schema.text(block.code)] : [],
    ),

  fromProseMirrorNode: (node) => {
    const language = node.attrs.language as string;
    return {
      blockType: 'codeBlock',
      ...(language.length > 0 ? { language } : {}),
      code: node.textContent,
    };
  },

  inputRules: (schema) => [
    // ```lang + space on an otherwise empty paragraph opens a fence.
    new InputRule(/^```(\w*)\s$/, (state, match, start) => {
      const $start = state.doc.resolve(start);
      if ($start.parent.type !== schema.nodes.paragraph) return null;
      const codeBlock = schema.nodes.codeBlock.create({ language: match[1] ?? '' });
      return replaceRangeWithBlock(state.tr, $start.before(), $start.after(), codeBlock);
    }),
  ],

  keymaps: (schema) => ({
    // `code: true` routes Enter to baseKeymap's newlineInCode, so leaving the
    // fence needs its own binding. Inserting rather than only moving the caret
    // covers the case where the block is the document's last child.
    'Mod-Enter': (state, dispatch) => {
      const { $from } = state.selection;
      if ($from.parent.type !== schema.nodes.codeBlock) return false;
      dispatch?.(insertBlockAt(state.tr, $from.after(), schema.nodes.paragraph.create()));
      return true;
    },
  }),
};

function codeBlockNodeSpec(): NodeSpec {
  return {
    group: 'block',
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    whitespace: 'pre',
    attrs: { language: { default: '' } },
    toDOM: (node) => [
      'pre',
      { class: 'prompt-code-block', 'data-language': node.attrs.language },
      ['code', 0],
    ],
    parseDOM: [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs: (dom) => ({
          language: (dom as HTMLElement).getAttribute('data-language') ?? '',
        }),
      },
    ],
  };
}
