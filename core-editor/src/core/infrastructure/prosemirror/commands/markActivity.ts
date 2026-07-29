import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

export function isMarkActive(state: EditorState, type: MarkType): boolean {
  const { empty, from, to, $from } = state.selection;
  // Empty selection: the mark applies to what would be typed next, not a range.
  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks());
  }
  return state.doc.rangeHasMark(from, to, type);
}
