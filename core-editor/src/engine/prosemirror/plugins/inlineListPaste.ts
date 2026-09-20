import { Plugin } from 'prosemirror-state';

/** Keeps clipboard text inline when its insertion point is a list item. */
export function inlineListPaste(): Plugin {
  return new Plugin({
    props: {
      handlePaste(view, event, slice) {
        const { selection } = view.state;
        if (!selection.$from.sameParent(selection.$to) || selection.$from.parent.type.name !== 'listItem') return false;

        const text = event.clipboardData?.getData('text/plain')
          || slice.content.textBetween(0, slice.content.size, '\n');
        if (!text) return false;

        view.dispatch(view.state.tr.insertText(text).scrollIntoView());
        return true;
      },
    },
  });
}
