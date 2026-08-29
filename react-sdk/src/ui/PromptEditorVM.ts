import type { CommandState, OutlineEntry } from 'core-editor';

export interface PromptEditorVM {
  readonly commandItems: readonly CommandItemVM[];
  readonly outlineItems: readonly OutlineItemVM[];
}

export class CommandItemVM {
  private constructor(
    readonly id: string,
    readonly group: CommandGroup,
    readonly label: string,
    readonly glyph: string,
    readonly disabled: boolean,
    readonly active: boolean,
    readonly shortcut?: string,
  ) {}

  static from(state: CommandState): CommandItemVM | null {
    if (state.command.type !== 'format') return null;
    const common = {
      group: 'format' as const,
      disabled: !state.enabled,
      active: state.active,
    };
    switch (state.command.format) {
      case 'bold':
        return new CommandItemVM(
          'format.bold',
          common.group,
          'Bold',
          'B',
          common.disabled,
          common.active,
          'Ctrl+B',
        );
      case 'code':
        return new CommandItemVM(
          'format.code',
          common.group,
          'Inline code',
          '</>',
          common.disabled,
          common.active,
          'Ctrl+`',
        );
    }
  }
}

export type CommandGroup = 'format' | 'insert' | 'utility';

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
