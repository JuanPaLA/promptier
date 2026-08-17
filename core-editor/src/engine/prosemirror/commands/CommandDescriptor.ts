import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { EditorCommand } from '../../../editor/commands/EditorCommand';

export interface CommandDescriptor<C extends EditorCommand> {
  readonly type: C['type'];
  availableCommands(): readonly C[];
  run(view: EditorView, command: C): boolean;
  isEnabled(state: EditorState, command: C): boolean;
  isActive(state: EditorState, command: C): boolean;
}
