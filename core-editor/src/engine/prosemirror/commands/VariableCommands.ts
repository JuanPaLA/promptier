import { TextSelection, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CommandState } from '../../../editor/commands/CommandState';
import type { InsertVariableCommand } from '../../../editor/commands/InsertVariableCommand';
import type { VariableCatalog } from '../../../prompt/variables/VariableCatalog';
import { selectionSplitsTemplateToken } from '../editing/mentionInsertion';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

export class VariableCommands implements CommandHandler<InsertVariableCommand>, CommandStateProvider {
  readonly type = 'variable.insert';

  constructor(private readonly catalog: () => VariableCatalog) {}

  run(view: EditorView, command: InsertVariableCommand): boolean {
    const variable = this.catalog().resolve(command.path);
    if (!this.canInsert(view.state) || variable.status !== 'recognized' || !variable.definition?.insertable) return false;
    const { state } = view;
    view.dispatch(state.tr.insertText(`{{ ${command.path} }}`).scrollIntoView());
    view.focus();
    return true;
  }

  commandStates(state: EditorState): readonly CommandState[] {
    return this.catalog().definitions().map((variable) => ({
      command: { type: 'variable.insert', path: variable.path },
      variable, enabled: variable.insertable && this.canInsert(state),
    }));
  }

  private canInsert(state: EditorState): boolean {
    const { selection } = state;
    return selection instanceof TextSelection && selection.$from.sameParent(selection.$to)
      && selection.$from.parent.type.name !== 'sectionTitle' && !selectionSplitsTemplateToken(selection);
  }
}
