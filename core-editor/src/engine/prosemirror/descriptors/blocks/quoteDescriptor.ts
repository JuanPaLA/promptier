import { InputRule } from 'prosemirror-inputrules';
import type { NodeSpec } from 'prosemirror-model';
import type { QuoteBlock } from '../../../../prompt/model/blocks/QuoteBlock';
import { replaceRangeWithBlock } from '../../editing/blockTransactions';
import { blockContentFromNode, blockContentToNodes } from '../../mapping/blockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const quoteDescriptor: BlockDescriptor<QuoteBlock> = {
  blockType: 'quote',
  nodeSpec: quoteNodeSpec(),
  createDefaultBlock: () => ({ blockType: 'quote', content: [] }),
  editorStyles: `
.prompt-quote {
  margin: 0.5rem 0;
  padding: 0.25rem 0 0.25rem 0.75rem;
  border-left: 3px solid #d0d7de;
  color: #57606a;
  white-space: pre-wrap;
}
`,

  toProseMirrorNode: (block, schema) =>
    schema.nodes.quote.create(null, blockContentToNodes(block.content, schema)),

  fromProseMirrorNode: (node) => ({
    blockType: 'quote',
    content: blockContentFromNode(node),
  }),

  inputRules: (schema) => [
    new InputRule(/^>\s$/, (state, _match, start) => {
      const $start = state.doc.resolve(start);
      if ($start.parent.type !== schema.nodes.paragraph) return null;
      if ($start.parent.textContent !== '>') return null;
      return replaceRangeWithBlock(
        state.tr,
        $start.before(),
        $start.after(),
        schema.nodes.quote.create(),
      );
    }),
  ],

  keymaps: (schema) => ({
    'Shift-Enter': (state, dispatch) => {
      const { $from, $to } = state.selection;
      if ($from.parent.type !== schema.nodes.quote || !$from.sameParent($to)) return false;
      dispatch?.(state.tr.insertText('\n').scrollIntoView());
      return true;
    },
  }),
};

function quoteNodeSpec(): NodeSpec {
  return {
    group: 'block',
    content: 'text*',
    whitespace: 'pre',
    defining: true,
    toDOM: () => ['blockquote', { class: 'prompt-quote' }, 0] as const,
    parseDOM: [{ tag: 'blockquote' }],
  };
}
