import {
  type CommandState,
  type EditorCommand,
  type NavigateTarget,
  outline,
  type OutlineEntry,
} from 'core-editor'

import type { PromptEditorSnapshot } from '../../lib/PromptEditorService'
import { blockPresentationRegistry } from '../blocks/blockPresentations';
import { formatPresentationRegistry } from '../formats/formatPresentations';

export class PromptEditorVM {
  private constructor(
    readonly prompt: string,
    readonly formatCommands: readonly CommandItemVM[],
    readonly blockCommands: readonly CommandItemVM[],
    readonly referenceCommands: readonly CommandItemVM[],
    readonly outlineItems: readonly OutlineItemVM[],
    readonly charsCount: number,
    readonly wordCount: number,
    private readonly editorCommandsById: ReadonlyMap<string, EditorCommand>,
    private readonly outlineTargetsById: ReadonlyMap<string, NavigateTarget>,
  ) {}

  static from(snapshot: PromptEditorSnapshot): PromptEditorVM {
    const [formatCommandItems, insertionCommandItems, editorCommandsById] =
        PromptEditorVM.buildCommandItems(snapshot.state?.commands ?? []);
    const [outlineItems, outlineTargetsById] =
        PromptEditorVM.buildOutlineItems(outline(snapshot.content));
    return new PromptEditorVM(
        snapshot.prompt,
        formatCommandItems,
        insertionCommandItems.filter((item) => item.group === 'block'),
        insertionCommandItems.filter((item) => item.group === 'reference'),
        outlineItems,
        snapshot.prompt.length,
        snapshot.prompt.split(" ").length,
        editorCommandsById,
        outlineTargetsById,
    );
  }

  commandFor(id: string): EditorCommand | undefined {
    return this.editorCommandsById.get(id);
  }

  outlineTargetFor(id: string): NavigateTarget | undefined {
    return this.outlineTargetsById.get(id);
  }

  private static buildCommandItems(
    states: readonly CommandState[],
  ): [readonly CommandItemVM[], readonly CommandItemVM[], Map<string, EditorCommand>] {
    const formatItems: CommandItemVM[] = [];
    const insertionItems: CommandItemVM[] = [];
    const commandsById = new Map<string, EditorCommand>();
    states.forEach((state) => {
      const item = CommandItemVM.from(state);
      if (!item) return;
      if (item.group === 'format') formatItems.push(item);
      else insertionItems.push(item);
      commandsById.set(item.id, state.command);
    });
    return [formatItems, insertionItems, commandsById];
  }

  private static buildOutlineItems(
    entries: readonly OutlineEntry[],
  ): [readonly OutlineItemVM[], Map<string, NavigateTarget>] {
    const targetsById = new Map<string, NavigateTarget>();
    const items = entries.map((entry) => {
      const item = OutlineItemVM.from(entry);
      targetsById.set(item.id, { kind: entry.kind, path: entry.path });
      return item;
    });
    return [items, targetsById];
  }
}

export class CommandItemVM {
  private constructor(
    readonly id: string,
    readonly group: 'format' | 'block' | 'reference',
    readonly label: string,
    readonly glyph: string,
    readonly disabled: boolean,
    readonly active: boolean,
  ) {}

  static from(state: CommandState): CommandItemVM | null {
    if (state.command.type === 'format') {
      const presentation = formatPresentationRegistry.get(state.command.format);
      return new CommandItemVM(
        `format.${state.command.format}`,
        'format',
        presentation.label,
        presentation.glyph,
        !state.enabled,
        state.active ?? false,
      );
    }
    if (state.command.type === 'block.insert') {
      const presentation = blockPresentationRegistry.get(state.command.block.blockType);
      return new CommandItemVM(
        `block.insert.${state.command.block.blockType}`,
        'block',
        presentation.label,
        presentation.glyph,
        !state.enabled,
        false,
      );
    }
    if (state.command.type === 'reference.insert') {
      return new CommandItemVM(
        `reference.insert.${state.command.text}`, 'reference', state.command.text,
        '↗', !state.enabled, false,
      );
    }
    return null;
  }
}

export class OutlineItemVM {
  private constructor(
    readonly id: string,
    readonly label: string,
    readonly depth: number,
    readonly kind: OutlineEntry['kind'],
  ) {}

  static from(entry: OutlineEntry): OutlineItemVM {
    return new OutlineItemVM(
      `${entry.kind}:${entry.path.join('.')}`,
      entry.title || `(untitled ${entry.kind})`,
      entry.depth,
      entry.kind,
    );
  }
}
