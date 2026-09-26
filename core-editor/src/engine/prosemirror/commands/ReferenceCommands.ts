import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { InsertReferenceCommand } from '../../../editor/commands/InsertReferenceCommand';
import { sectionReferences } from '../../../prompt/references/sectionReferences';
import { buildOutline } from '../../../prompt/structure/buildOutline';
import { canInsertMention, insertMention } from '../editing/mentionInsertion';
import type { PromptDocumentMapper } from '../mapping/PromptDocumentMapper';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

export class ReferenceCommands implements CommandHandler<InsertReferenceCommand>, CommandStateProvider {
  readonly type = 'reference.insert';

  constructor(private readonly mapper: PromptDocumentMapper) {}

  run(view: EditorView, command: InsertReferenceCommand): boolean {
    const content = this.mapper.fromDocument(view.state.doc);
    if (!canInsertMention(view.state) || sectionReferences(content).resolve(command.text)?.status !== 'resolved') return false;
    view.dispatch(insertMention(view.state, command.text, { code: false }).scrollIntoView());
    view.focus();
    return true;
  }

  commandStates(state: EditorState) {
    const content = this.mapper.fromDocument(state.doc);
    const resolver = sectionReferences(content);
    const tags = new Set(buildOutline(content).filter((entry) => entry.kind === 'section').map((entry) => `<${entry.id}>`));
    return [...tags].map((text) => ({
      command: { type: 'reference.insert', text } as const,
      enabled: canInsertMention(state) && resolver.resolve(text)?.status === 'resolved',
    }));
  }
}
