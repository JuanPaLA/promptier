import { type CommandState, type EditorCommand, outline, type OutlineEntry } from 'core-editor'

import type { PromptEditorSnapshot } from '../../lib/PromptEditorService'

export class PromptEditorVM {
  private constructor(
    readonly prompt: string,
    readonly formatCommands: readonly CommandItemVM[],
    readonly outlineItems: readonly OutlineItemVM[],
    readonly charsCount: number,
    readonly wordCount: number,
    private readonly editorCommandsById: ReadonlyMap<string, EditorCommand>,
    private readonly outlinePathsById: ReadonlyMap<string, readonly number[]>,
  ) {}

  static from(snapshot: PromptEditorSnapshot): PromptEditorVM {
    const [commandItems, editorCommandsById] =
        PromptEditorVM.buildCommandItems(snapshot.state?.commands ?? []);
    const [outlineItems, outlinePathsById] =
        PromptEditorVM.buildOutlineItems(outline(snapshot.content));
    return new PromptEditorVM(
        snapshot.prompt,
        commandItems,
        outlineItems,
        snapshot.prompt.length,
        snapshot.prompt.split(" ").length,
        editorCommandsById,
        outlinePathsById,
    );
  }

  commandFor(id: string): EditorCommand | undefined {
    return this.editorCommandsById.get(id);
  }

  outlinePathFor(id: string): readonly number[] | undefined {
    return this.outlinePathsById.get(id);
  }

  private static buildCommandItems(
    states: readonly CommandState[],
  ): [readonly CommandItemVM[], Map<string, EditorCommand>] {
    const items: CommandItemVM[] = [];
    const commandsById = new Map<string, EditorCommand>();
    states.forEach((state) => {
      const item = CommandItemVM.from(state);
      if (!item) return;
      items.push(item);
      commandsById.set(item.id, state.command);
    });
    return [items, commandsById];
  }

  private static buildOutlineItems(
    entries: readonly OutlineEntry[],
  ): [readonly OutlineItemVM[], Map<string, readonly number[]>] {
    const pathsById = new Map<string, readonly number[]>();
    const items = entries.map((entry) => {
      const item = OutlineItemVM.from(entry);
      pathsById.set(item.id, entry.path);
      return item;
    });
    return [items, pathsById];
  }
}

export class CommandItemVM {
  private constructor(
    readonly id: string,
    readonly label: string,
    readonly glyph: string,
    readonly disabled: boolean,
    readonly active: boolean,
  ) {}

  static from(state: CommandState): CommandItemVM | null {
    if (state.command.type !== 'format') return null;
    const common = {
      disabled: !state.enabled,
      active: state.active ?? false,
    };
    switch (state.command.format) {
      case 'bold':
        return new CommandItemVM(
          `[${state.command.type}].${state.command.format}`,
          'Bold',
          'B',
          common.disabled,
          common.active,
        );
      case 'code':
        return new CommandItemVM(
          'format.code',
          'Inline code',
          '</>',
          common.disabled,
          common.active,
        );
    }
  }
}

export class OutlineItemVM {
  private constructor(
    readonly id: string,
    readonly label: string,
    readonly depth: number,
  ) {}

  static from(entry: OutlineEntry): OutlineItemVM {
    return new OutlineItemVM(
      `section:${entry.path.join('.')}`,
      entry.title || '(untitled section)',
      entry.depth,
    );
  }
}
