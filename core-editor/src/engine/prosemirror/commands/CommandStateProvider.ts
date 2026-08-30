import type { EditorState as ProseMirrorState } from 'prosemirror-state';

import type { CommandState } from '../../../editor/commands/CommandState';

export interface CommandStateProvider {
  commandStates(state: ProseMirrorState): readonly CommandState[];
}
