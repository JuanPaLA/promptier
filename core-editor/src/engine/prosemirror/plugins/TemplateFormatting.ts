import { Fragment } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { TemplateInlineContent } from '../../../prompt/templates/TemplateInlineContent';
import { blockContentFromNode, blockContentToNodes } from '../mapping/blockContentMapper';

export class TemplateFormatting {
  readonly plugin = new Plugin({
    appendTransaction: (transactions, _, state) => {
      if (!transactions.some((transaction) => transaction.docChanged)) return null;
      const transaction = state.tr;
      state.doc.descendants((node, position) => {
        if (!node.isTextblock || node.type.spec.code || node.type.name === 'sectionTitle') return;
        const content = new TemplateInlineContent().normalize(blockContentFromNode(node));
        const normalized = Fragment.from(blockContentToNodes(content, state.schema));
        if (!normalized.eq(node.content)) {
          normalized.forEach((child, offset) => {
            const from = position + 1 + offset;
            const to = from + child.nodeSize;
            transaction.removeMark(from, to);
            child.marks.forEach((mark) => transaction.addMark(from, to, mark));
          });
        }
        return false;
      });
      return transaction.steps.length ? transaction : null;
    },
  });
}
