import { Plugin } from 'prosemirror-state';
import { caretInLastBlock, insertBlockAt } from '../editing/blockTransactions';

/**
 * Notion-style end-click: clicking the empty area below the last block drops
 * the cursor into a fresh empty paragraph at the document root.
 *
 * `event.target === view.dom` is the reliable signal that the click landed on
 * the editor's empty trailing region rather than on a rendered node. Inserting
 * at `doc.content.size` always produces a top-level block, so a document ending
 * in a section gets a sibling paragraph after it instead of trapping the caret
 * inside the section's last child (ProseMirror's default nearest-position).
 */
export function appendTrailingParagraph(): Plugin {
  return new Plugin({
    props: {
      handleClick(view, _pos, event) {
        if (event.target !== view.dom) return false;

        const { state, dispatch } = view;
        const last = state.doc.lastChild;

        // Already an empty trailing paragraph — just focus it, don't stack empties.
        if (last?.type.name === 'paragraph' && last.content.size === 0) {
          dispatch(caretInLastBlock(state.tr));
          return true;
        }

        const paragraph = state.schema.nodes.paragraph.create();
        dispatch(insertBlockAt(state.tr, state.doc.content.size, paragraph));
        return true;
      },
    },
  });
}
