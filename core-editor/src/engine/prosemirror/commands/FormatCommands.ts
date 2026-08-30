import { toggleMark } from 'prosemirror-commands';
import type { EditorState as ProseMirrorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { CommandState } from '../../../editor/commands/CommandState';
import type { FormatCommand } from '../../../editor/commands/FormatCommand';
import type { Format } from '../../../prompt/model/Format';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

export class FormatCommands implements CommandHandler<FormatCommand>, CommandStateProvider {
  readonly type = 'format';

  constructor(private readonly formats: readonly Format[]) {}

  run(view: EditorView, command: FormatCommand): boolean {
    const mark = view.state.schema.marks[command.format];
    if (!mark) return false;
    const executed = toggleMark(mark)(view.state, view.dispatch);
    if (executed) view.focus();
    return executed;
  }

  commandStates(state: ProseMirrorState): readonly CommandState[] {
    return this.formats.map((format) => {
      const command: FormatCommand = { type: 'format', format };
      const mark = state.schema.marks[format];
      return {
        command,
        enabled: mark ? toggleMark(mark)(state) : false,
        active: mark ? this.isMarkActive(state, mark) : false,
      };
    });
  }

  private isMarkActive(state: EditorState, type: MarkType): boolean {
    const { empty, from, to, $from } = state.selection;
    if (empty) {
      return !!type.isInSet(state.storedMarks || $from.marks());
    }
    return state.doc.rangeHasMark(from, to, type);
  }
}

