import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { CommandId, EditorCommand } from '../../../editor/commands/EditorCommand';
import type {
  CommandState,
  EditorSelectionState,
} from '../../../editor/commands/EditorSelectionState';
import type { Format } from '../../../prompt/model/Format';
import { blockDescriptors } from '../descriptors/blocks/blockDescriptorRegistry';
import { markDescriptors } from '../descriptors/marks/markDescriptorRegistry';
import type { CommandDescriptor } from './CommandDescriptor';
import { isMarkActive } from './markActivity';

export function runCommand(view: EditorView, command: EditorCommand): void {
  descriptorsById.get(command.id)?.run(view);
}

/**
 * Every command this engine can run. A property of the engine, not of a live
 * document, so a host can build its menu before an editor exists and ask
 * `getSelectionState()` for what applies right now.
 */
export function availableCommandIds(): CommandId[] {
  return commandDescriptors.map((descriptor) => descriptor.id);
}

export function selectionStateFromEditorState(state: EditorState): EditorSelectionState {
  const commands = {} as Record<CommandId, CommandState>;
  for (const descriptor of commandDescriptors) {
    commands[descriptor.id] = {
      enabled: descriptor.isEnabled(state),
      active: descriptor.isActive(state),
    };
  }
  return {
    activeFormats: activeFormats(state),
    selectionEmpty: state.selection.empty,
    commands,
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

// Both descriptor families contribute: marks own the format commands, blocks
// own the structural ones (copy, delete, move, turn into). Adding a command is
// extending its descriptor — this file doesn't change.
const commandDescriptors: CommandDescriptor[] = [...markDescriptors, ...blockDescriptors].flatMap(
  (descriptor) => [...(descriptor.commands ?? [])],
);

const descriptorsById = new Map(
  commandDescriptors.map((descriptor) => [descriptor.id, descriptor]),
);
