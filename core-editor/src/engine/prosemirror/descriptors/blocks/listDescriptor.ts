import { splitBlock } from 'prosemirror-commands';
import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec, ResolvedPos, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import type { Block } from '../../../../prompt/model/Block';
import type { BlockContent } from '../../../../prompt/model/BlockContent';
import { insertBlockAt, replaceRangeWithBlock } from '../../editing/blockTransactions';
import { blockContentFromNode, blockContentToNodes } from '../../mapping/blockContentMapper';
import type { BlockDescriptor } from './BlockDescriptor';

export const LIST_ITEM_NODE = 'listItem';

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
  return {
    blockType: config.blockType,
    nodeSpec: listNodeSpec(config),
    extraNodes: { [LIST_ITEM_NODE]: itemNodeSpec() },
    editorStyles: `
.${config.listClass} {
  margin: 0.5rem 0;
  padding-left: 1.6rem;
}
.${config.listClass} > li {
  margin: 0.15rem 0;
}
`,

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
        return replaceRangeWithBlock(state.tr, $start.before(), $start.after(), list);
      }),
    ],

    keymaps: (schema) => ({
      // Owned here rather than deferred to baseKeymap, so list behavior doesn't
      // depend on plugin ordering. Each list type guards on its own node, so the
      // composed Enter (see BlockRegistry.keymap) routes to the right handler.
      Enter: (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!empty || $from.parent.type !== schema.nodes[LIST_ITEM_NODE]) return false;
        if ($from.node(-1).type !== schema.nodes[config.blockType]) return false;

        if (!atEmptyTrailingItem($from)) return splitBlock(state, dispatch);
        dispatch?.(exitListIntoParagraph(state, $from, schema));
        return true;
      },
    }),
  };
}

function listNodeSpec<B extends ListBlock>(config: ListDescriptorConfig<B>): NodeSpec {
  return {
    group: 'block',
    content: `${LIST_ITEM_NODE}+`,
    toDOM: () => [config.listTag, { class: config.listClass }, 0] as const,
    parseDOM: [{ tag: config.listTag }],
  };
}

/**
 * A list line. Not in the `block` group, so it can only exist where a list's
 * content expression places it. Shared by every list type — a `listItem` is
 * valid inside any `<ol>`/`<ul>`. It has no domain block of its own; items are
 * inline values (see `OrderedListBlock`).
 */
function itemNodeSpec(): NodeSpec {
  return {
    content: 'text*',
    toDOM: () => ['li', 0] as const,
    parseDOM: [{ tag: 'li' }],
  };
}

/** True when the caret sits in the list's last item and that item is empty. */
function atEmptyTrailingItem($from: ResolvedPos): boolean {
  const list = $from.node(-1);
  return $from.parent.content.size === 0 && $from.index(-1) === list.childCount - 1;
}

/**
 * Leaves the list from its empty trailing item: a sole item takes the whole
 * list with it, otherwise the empty item is dropped and a paragraph lands after
 * the list.
 */
function exitListIntoParagraph(
  state: EditorState,
  $from: ResolvedPos,
  schema: Schema,
): Transaction {
  const paragraph = schema.nodes.paragraph.create();
  if ($from.node(-1).childCount === 1) {
    return replaceRangeWithBlock(state.tr, $from.before(-1), $from.after(-1), paragraph);
  }
  const withoutItem = state.tr.delete($from.before(), $from.after());
  return insertBlockAt(withoutItem, withoutItem.mapping.map($from.after(-1)), paragraph);
}
