import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { CommandId } from '../../../app/commands/EditorCommand';

export interface CommandDescriptor {
  readonly id: CommandId;
  run(view: EditorView): void;
  isEnabled(state: EditorState): boolean;
  isActive(state: EditorState): boolean;
}
