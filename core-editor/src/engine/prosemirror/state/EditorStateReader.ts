import type { EditorState as ProseMirrorState } from 'prosemirror-state';

import type { EditorState } from '../../../editor/commands/EditorState';
import type { CommandStateProvider } from '../commands/CommandStateProvider';

export class EditorStateReader {
  constructor(private readonly providers: readonly CommandStateProvider[]) {}

  read(state: ProseMirrorState): EditorState {
    return {
      commands: this.providers.flatMap((provider) => provider.commandStates(state)),
    };
  }
}
