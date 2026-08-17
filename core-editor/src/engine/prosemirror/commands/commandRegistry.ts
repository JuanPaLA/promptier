import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { EditorCommand } from '../../../editor/commands/EditorCommand';
import type { EditorSelectionState } from '../../../editor/commands/EditorSelectionState';
import type { Format } from '../../../prompt/model/Format';
import { markDescriptors } from '../descriptors/marks/markDescriptorRegistry';
import type { CommandDescriptor } from './CommandDescriptor';
import { formatCommand } from './formatCommand';
import { isMarkActive } from './markActivity';

export function runCommand(view: EditorView, command: EditorCommand): boolean {
  const descriptor = descriptorFor(command);
  return descriptor?.run(view, command) ?? false;
}

/**
 * Every command this engine can run. A property of the engine, not of a live
 * document, so a host can build its menu before an editor exists and ask
 * `getSelectionState()` for what applies right now.
 */
export function availableCommands(): readonly EditorCommand[] {
  return commandDescriptors.flatMap((descriptor) => descriptor.availableCommands());
}

export function selectionStateFromEditorState(state: EditorState): EditorSelectionState {
  return {
    activeFormats: activeFormats(state),
    selectionEmpty: state.selection.empty,
    commands: availableCommands().map((command) => {
      const descriptor = descriptorFor(command);
      return {
        command,
        enabled: descriptor?.isEnabled(state, command) ?? false,
        active: descriptor?.isActive(state, command) ?? false,
      };
    }),
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

function descriptorFor<C extends EditorCommand>(command: C): CommandDescriptor<C> | undefined {
  const descriptor = descriptorsByType.get(command.type);
  // The registry is keyed by the same discriminant as EditorCommand. This cast
  // is the one internal bridge between the runtime lookup and TypeScript's
  // generic command/descriptor relationship.
  return descriptor as CommandDescriptor<C> | undefined;
}

const commandDescriptors = [formatCommand] as const;

const descriptorsByType = new Map(
  commandDescriptors.map((descriptor) => [descriptor.type, descriptor]),
);
