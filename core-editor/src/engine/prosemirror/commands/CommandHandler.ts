import type { EditorView } from 'prosemirror-view';

import type { EditorCommand } from '../../../editor/commands/EditorCommand';

export interface CommandHandler<C extends EditorCommand = EditorCommand> {
  readonly type: C['type'];
  run(view: EditorView, command: C): boolean;
}
