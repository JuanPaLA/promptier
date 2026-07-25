import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { OrderedListBlock } from '../../../domain/blocks/OrderedListBlock';
import { blockContentFromNode, blockContentToNodes } from '../BlockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const LIST_ITEM_NODE = 'listItem';

/**
 * A list line. Not in the `block` group, so it can only exist where the list's
 * content expression places it: as a child of `orderedList`. Plain inline text
 * — it has no domain block of its own (see `OrderedListBlock`'s design note).
 */
const itemNodeSpec: NodeSpec = {
  content: 'text*',
  toDOM: () => ['li', 0] as const,
  parseDOM: [{ tag: 'li' }],
};

const nodeSpec: NodeSpec = {
  group: 'block',
  content: `${LIST_ITEM_NODE}+`,
  toDOM: () => ['ol', { class: 'prompt-ordered-list' }, 0] as const,
  parseDOM: [{ tag: 'ol' }],
};

export const orderedListDescriptor: BlockDescriptor<OrderedListBlock> = {
  blockType: 'orderedList',
  nodeSpec,
  extraNodes: { [LIST_ITEM_NODE]: itemNodeSpec },

  toProseMirrorNode: (block, schema) => {
    // Grammar requires `listItem+`; backfill one empty item for an empty list.
    const items =
      block.items.length > 0
        ? block.items.map((item) =>
            schema.nodes[LIST_ITEM_NODE].create(null, blockContentToNodes(item, schema)),
          )
        : [schema.nodes[LIST_ITEM_NODE].create()];
    return schema.nodes.orderedList.create(null, items);
  },

  fromProseMirrorNode: (node) => {
    const items: OrderedListBlock['items'] = [];
    node.forEach((child) => {
      if (child.type.name === LIST_ITEM_NODE) items.push(blockContentFromNode(child));
    });
    return { blockType: 'orderedList', items };
  },

  inputRules: (schema) => [
    // Typing "1. " on an otherwise empty paragraph turns it into an ordered list.
    new InputRule(/^1\.\s$/, (state, _match, start) => {
      const $start = state.doc.resolve(start);
      if ($start.parent.type !== schema.nodes.paragraph) return null;
      if ($start.parent.textContent !== '1.') return null;
      const list = schema.nodes.orderedList.create(null, [schema.nodes[LIST_ITEM_NODE].create()]);
      const tr = state.tr.replaceRangeWith($start.before(), $start.after(), list);
      // +2: into the list, then into its first item.
      return tr.setSelection(TextSelection.create(tr.doc, $start.before() + 2));
    }),
  ],

  keymaps: (schema) => ({
    // Enter on an empty last item exits the list into a paragraph. A non-empty
    // item returns false and falls through to baseKeymap's splitBlock, which
    // (since orderedList only admits listItem children) splits into a new item.
    Enter: (state, dispatch) => {
      const { $from, empty } = state.selection;
      if (!empty || $from.parent.type !== schema.nodes[LIST_ITEM_NODE]) return false;
      if ($from.parent.content.size !== 0) return false;

      const list = $from.node(-1);
      if (list.type !== schema.nodes.orderedList) return false;
      if ($from.index(-1) !== list.childCount - 1) return false;

      if (dispatch) {
        const paragraph = schema.nodes.paragraph.create();
        if (list.childCount === 1) {
          // Sole item: replace the whole list with a paragraph.
          const from = $from.before(-1);
          const to = $from.after(-1);
          const tr = state.tr.replaceRangeWith(from, to, paragraph);
          dispatch(tr.setSelection(TextSelection.create(tr.doc, from + 1)).scrollIntoView());
        } else {
          // Drop the trailing empty item, then add a paragraph after the list.
          const tr = state.tr.delete($from.before(), $from.after());
          const insertAt = tr.mapping.map($from.after(-1));
          tr.insert(insertAt, paragraph);
          dispatch(tr.setSelection(TextSelection.create(tr.doc, insertAt + 1)).scrollIntoView());
        }
      }
      return true;
    },
  }),
};
