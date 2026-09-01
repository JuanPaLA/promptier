import { chainCommands } from 'prosemirror-commands';
import type { Command } from 'prosemirror-state';

/** Composes duplicate bindings in declaration order; false delegates to the next command. */
export function combineKeymaps(
  contributions: readonly Record<string, Command>[],
): Record<string, Command> {
  const commandsByKey = new Map<string, Command[]>();
  contributions.forEach((keymap) => {
    Object.entries(keymap).forEach(([key, command]) => {
      const commands = commandsByKey.get(key) ?? [];
      commands.push(command);
      commandsByKey.set(key, commands);
    });
  });

  return Object.fromEntries(
    [...commandsByKey].map(([key, commands]) => [
      key,
      commands.length === 1 ? commands[0] : chainCommands(...commands),
    ]),
  );
}
