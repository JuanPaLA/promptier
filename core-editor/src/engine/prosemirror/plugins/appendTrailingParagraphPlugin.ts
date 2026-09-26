import { Plugin } from 'prosemirror-state';
import { caretInLastBlock, insertBlockAt } from '../editing/blockTransactions';

export function appendTrailingParagraphPlugin(): Plugin {
  return new Plugin({
    props: {
      handleClick(view, _pos, event) {
        if (event.target !== view.dom) return false;

        const { state, dispatch } = view;
        const last = state.doc.lastChild;

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
