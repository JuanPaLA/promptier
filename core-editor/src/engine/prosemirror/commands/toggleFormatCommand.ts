import { toggleMark } from 'prosemirror-commands';

import type { CommandId } from '../../../editor/commands/EditorCommand';
import type { Format } from '../../../prompt/model/Format';
import type { CommandDescriptor } from './CommandDescriptor';
import { isMarkActive } from './markActivity';

export function toggleFormatCommand(id: CommandId, format: Format): CommandDescriptor {
  return {
    id,
    run: (view) => {
      toggleMark(view.state.schema.marks[format])(view.state, view.dispatch);
      view.focus();
    },
    // A PM command called without dispatch is a dry run: true if it would apply.
    isEnabled: (state) => toggleMark(state.schema.marks[format])(state),
    isActive: (state) => isMarkActive(state, state.schema.marks[format]),
  };
}
