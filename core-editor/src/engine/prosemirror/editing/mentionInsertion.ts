import { Fragment, Slice, type Node as ProseMirrorNode } from 'prosemirror-model';
import { TextSelection, type EditorState, type Selection, type Transaction } from 'prosemirror-state';
import { TemplateSyntax } from '../../../prompt/templates/TemplateSyntax';

/** Whether the selection sits in prose where a single inline mention can be written. */
export function canInsertMention(state: EditorState): boolean {
  const { selection, schema } = state;
  return selection instanceof TextSelection && selection.$from.sameParent(selection.$to)
    && selection.$from.parent.type.allowsMarkType(schema.marks.code)
    && !selection.$from.parent.type.spec.code
    && selection.$from.parent.type.name !== 'sectionTitle';
}

/**
 * Replaces the selection with `text` as a word of its own, separated from
 * neighbouring words and code spans. The code mark never carries over into
 * what is typed next.
 */
export function insertMention(state: EditorState, text: string, { code }: { code: boolean }): Transaction {
  const { schema, selection } = state;
  const codeMark = schema.marks.code;
  const marks = (state.storedMarks ?? selection.$from.marks()).filter((mark) => mark.type !== codeMark);
  const nodes = [schema.text(text, code ? codeMark.create().addToSet(marks) : marks)];
  if (needsSeparator(selection.$from.nodeBefore, 'before')) nodes.unshift(schema.text(' '));
  if (needsSeparator(selection.$to.nodeAfter, 'after')) nodes.push(schema.text(' '));
  return state.tr.replaceSelection(new Slice(Fragment.from(nodes), 0, 0)).removeStoredMark(codeMark);
}

/** Whether text inserted at the selection would land inside template source. */
export function selectionSplitsTemplateToken(selection: Selection): boolean {
  const start = selection.$from.parentOffset;
  const end = selection.$to.parentOffset;
  return new TemplateSyntax().tokens(selection.$from.parent.textContent).some((token) =>
    (token.start < start && (token.end > start || (!token.complete && token.end === start)))
    || (token.start < end && token.end > end));
}

function needsSeparator(node: ProseMirrorNode | null, side: 'before' | 'after'): boolean {
  if (!node?.isText) return false;
  if (node.marks.some((mark) => mark.type.name === 'code')) return true;
  return side === 'before' ? /\S$/.test(node.text!) : /^\S/.test(node.text!);
}
