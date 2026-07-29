import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { EditorCommand } from '../../../app/commands/EditorCommand';
import type {
  CommandState,
  EditorSelectionState,
} from '../../../app/commands/EditorSelectionState';
import type { Format } from '../../../domain/Format';
import { markDescriptors } from '../descriptors/marks/markDescriptorRegistry';
import type { CommandDescriptor } from './CommandDescriptor';
import { isMarkActive } from './markActivity';

export function runCommand(view: EditorView, command: EditorCommand): void {
  descriptorsById.get(command.id)?.run(view);
}

export function selectionStateFromEditorState(state: EditorState): EditorSelectionState {
  const commands = {} as Record<string, CommandState>;
  for (const descriptor of commandDescriptors) {
    commands[descriptor.id] = {
      enabled: descriptor.isEnabled(state),
      active: descriptor.isActive(state),
    };
  }
  return {
    activeFormats: activeFormats(state),
    selectionEmpty: state.selection.empty,
    commands: commands as EditorSelectionState['commands'],
  };
}

function activeFormats(state: EditorState): Format[] {
  return markDescriptors
    .filter((descriptor) => {
      const type = state.schema.marks[descriptor.format];
      return type ? isMarkActive(state, type) : false;
    })
    .map((descriptor) => descriptor.format);
}

// Only mark descriptors contribute commands today; block-level commands (copy,
// delete, move, turn into) will need collecting from blockDescriptors too.
const commandDescriptors: CommandDescriptor[] = markDescriptors.flatMap((descriptor) => [
  ...(descriptor.commands ?? []),
]);

const descriptorsById = new Map(
  commandDescriptors.map((descriptor) => [descriptor.id, descriptor]),
);
