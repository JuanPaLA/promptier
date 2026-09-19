import { Fragment, Slice, type Node as ProseMirrorNode } from 'prosemirror-model';
import { TextSelection, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { InsertReferenceCommand } from '../../../editor/commands/InsertReferenceCommand';
import { sectionReferences } from '../../../prompt/references/sectionReferences';
import { buildOutline } from '../../../prompt/structure/buildOutline';
import type { PromptDocumentMapper } from '../mapping/PromptDocumentMapper';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

export class ReferenceCommands implements CommandHandler<InsertReferenceCommand>, CommandStateProvider {
  readonly type = 'reference.insert';

  constructor(private readonly mapper: PromptDocumentMapper) {}

  run(view: EditorView, command: InsertReferenceCommand): boolean {
    const content = this.mapper.fromDocument(view.state.doc);
    if (!canInsert(view.state) || sectionReferences(content).resolve(command.text)?.status !== 'resolved') return false;
    const code = view.state.schema.marks.code;
    const { schema, selection } = view.state;
    const marks = (view.state.storedMarks ?? selection.$from.marks()).filter((mark) => mark.type !== code);
    const nodes = [schema.text(command.text, marks)];
    if (needsSeparator(selection.$from.nodeBefore, 'before')) nodes.unshift(schema.text(' '));
    if (needsSeparator(selection.$to.nodeAfter, 'after')) nodes.push(schema.text(' '));
    const transaction = view.state.tr.replaceSelection(new Slice(Fragment.from(nodes), 0, 0));
    transaction.removeStoredMark(code);
    view.dispatch(transaction.scrollIntoView());
    view.focus();
    return true;
  }

  commandStates(state: EditorState) {
    const content = this.mapper.fromDocument(state.doc);
    const resolver = sectionReferences(content);
    const tags = new Set(buildOutline(content).filter((entry) => entry.kind === 'section').map((entry) => `<${entry.id}>`));
    return [...tags].map((text) => ({
      command: { type: 'reference.insert', text } as const,
      enabled: canInsert(state) && resolver.resolve(text)?.status === 'resolved',
    }));
  }
}

function canInsert(state: EditorState): boolean {
  const { selection, schema } = state;
  return selection instanceof TextSelection && selection.$from.sameParent(selection.$to)
    && selection.$from.parent.type.allowsMarkType(schema.marks.code)
    && !selection.$from.parent.type.spec.code
    && selection.$from.parent.type.name !== 'sectionTitle';
}

function needsSeparator(node: ProseMirrorNode | null, side: 'before' | 'after'): boolean {
  if (!node?.isText) return false;
  if (node.marks.some((mark) => mark.type.name === 'code')) return true;
  return side === 'before' ? /\S$/.test(node.text!) : /^\S/.test(node.text!);
}
