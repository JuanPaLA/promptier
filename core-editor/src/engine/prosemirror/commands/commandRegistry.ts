import type { EditorState as ProseMirrorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'

import type { EditorCommand } from '../../../editor/commands/EditorCommand'
import type { EditorState } from '../../../editor/commands/EditorState'
import type { CommandDescriptor } from './CommandDescriptor'
import { formatCommand } from './formatCommand'
import { navigateCommand } from './navigateCommand'

export function runCommand(view: EditorView, command: EditorCommand): boolean {
  const descriptor = descriptorFor(command);
  return descriptor?.run(view, command) ?? false;
}

function availableCommands(): readonly EditorCommand[] {
  return commandDescriptors.flatMap(
    (descriptor) => descriptor.availableCommands() as readonly EditorCommand[],
  );
}

export function stateSnapshotFromEditorState(state: ProseMirrorState): EditorState {
  return {
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

function descriptorFor<C extends EditorCommand>(command: C): CommandDescriptor<C> | undefined {
  const descriptor = descriptorsByType.get(command.type);
  // The registry is keyed by the same discriminant as EditorCommand. This cast
  // is the one internal bridge between the runtime lookup and TypeScript's
  // generic command/descriptor relationship.
  return descriptor as CommandDescriptor<C> | undefined;
}

const commandDescriptors = [formatCommand, navigateCommand] as const;

const descriptorsByType = new Map(
  commandDescriptors.map((descriptor) => [descriptor.type, descriptor]),
);
