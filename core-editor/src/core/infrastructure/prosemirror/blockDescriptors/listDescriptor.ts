import { splitBlock } from 'prosemirror-commands';
import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { Block } from '../../../domain/Block';
import type { BlockContent } from '../../../domain/BlockContent';
import { blockContentFromNode, blockContentToNodes } from '../BlockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const LIST_ITEM_NODE = 'listItem';

/**
 * A list line. Not in the `block` group, so it can only exist where a list's
 * content expression places it. Shared by every list type (ordered/unordered) —
 * a `listItem` is valid inside any `<ol>`/`<ul>`. It has no domain block of its
 * own; items are inline values (see `OrderedListBlock`'s design note).
 */
const itemNodeSpec: NodeSpec = {
  content: 'text*',
  toDOM: () => ['li', 0] as const,
  parseDOM: [{ tag: 'li' }],
};

/** A list block: a container of inline item lines (ordered or unordered). */
type ListBlock = Block & { readonly items: BlockContent[] };

export interface ListDescriptorConfig<B extends ListBlock> {
  readonly blockType: B['blockType'];
  readonly listTag: 'ol' | 'ul';
  readonly listClass: string;
  /** Pattern matched at the start of an empty paragraph (e.g. `/^1\.\s$/`). */
  readonly inputRulePattern: RegExp;
  /** Guards the rule against the paragraph text before the trigger space. */
  readonly inputRuleTrigger: (parentText: string) => boolean;
}

/**
 * Builds a list block descriptor. Ordered and unordered lists differ only in
 * node tag, input rule, and marker; everything structural — the shared
 * `listItem` node, both mappings, empty-list backfill, and the Enter
 * split/exit behavior — lives here once.
 */
export function createListDescriptor<B extends ListBlock>(
  config: ListDescriptorConfig<B>,
): BlockDescriptor<B> {
  const nodeSpec: NodeSpec = {
    group: 'block',
    content: `${LIST_ITEM_NODE}+`,
    toDOM: () => [config.listTag, { class: config.listClass }, 0] as const,
    parseDOM: [{ tag: config.listTag }],
  };

  return {
    blockType: config.blockType,
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
      return schema.nodes[config.blockType].create(null, items);
    },

    fromProseMirrorNode: (node) => {
      const items: BlockContent[] = [];
      node.forEach((child) => {
        if (child.type.name === LIST_ITEM_NODE) items.push(blockContentFromNode(child));
      });
      return { blockType: config.blockType, items } as B;
    },

    inputRules: (schema) => [
      // Typing the marker + space on an otherwise empty paragraph makes a list.
      new InputRule(config.inputRulePattern, (state, _match, start) => {
        const $start = state.doc.resolve(start);
        if ($start.parent.type !== schema.nodes.paragraph) return null;
        if (!config.inputRuleTrigger($start.parent.textContent)) return null;
        const list = schema.nodes[config.blockType].create(null, [
          schema.nodes[LIST_ITEM_NODE].create(),
        ]);
        const tr = state.tr.replaceRangeWith($start.before(), $start.after(), list);
        // +2: into the list, then into its first item.
        return tr.setSelection(TextSelection.create(tr.doc, $start.before() + 2));
      }),
    ],

    keymaps: (schema) => ({
      // Enter on an empty last item exits the list into a paragraph; any other
      // Enter inside an item splits it into a new item. Owned here (not deferred
      // to baseKeymap) so list behavior doesn't depend on plugin ordering. Each
      // list type guards on its own node so the composed Enter (see
      // blockKeymaps) routes to the right handler.
      Enter: (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!empty || $from.parent.type !== schema.nodes[LIST_ITEM_NODE]) return false;

        const list = $from.node(-1);
        if (list.type !== schema.nodes[config.blockType]) return false;

        const emptyLastItem =
          $from.parent.content.size === 0 && $from.index(-1) === list.childCount - 1;
        if (!emptyLastItem) return splitBlock(state, dispatch);

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
}
