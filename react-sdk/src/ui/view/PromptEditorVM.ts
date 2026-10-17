import {
  type CommandState,
  type EditorCommand,
  type NavigateTarget,
  outline,
  type OutlineEntry,
} from '@cachai/promptier-core-editor'

import type { PromptEditorSnapshot } from '../../lib/PromptEditorService'
import type { TokenEstimator } from '../../lib/TokenEstimator'
import { blockPresentationRegistry } from '../blocks/blockPresentations';
import { formatPresentationRegistry } from '../formats/formatPresentations';

export class PromptEditorVM {
  private constructor(
    readonly prompt: string,
    readonly formatCommands: readonly CommandItemVM[],
    readonly blockCommands: readonly CommandItemVM[],
    readonly referenceCommands: readonly CommandItemVM[],
    readonly variableCommands: readonly CommandItemVM[],
    readonly toolCommands: readonly CommandItemVM[],
    readonly outlineItems: readonly OutlineItemVM[],
    readonly charsCount: number,
    readonly wordCount: number,
    readonly tokenCount: number,
    private readonly editorCommandsById: ReadonlyMap<string, EditorCommand>,
    private readonly outlineTargetsById: ReadonlyMap<string, NavigateTarget>,
  ) {}

  static from(snapshot: PromptEditorSnapshot, tokenEstimator: TokenEstimator): PromptEditorVM {
    const [formatCommandItems, insertionCommandItems, editorCommandsById] =
        PromptEditorVM.buildCommandItems(snapshot.state?.commands ?? []);
    const [outlineItems, outlineTargetsById] =
        PromptEditorVM.buildOutlineItems(outline(snapshot.content));
    return new PromptEditorVM(
        snapshot.prompt,
        formatCommandItems,
        insertionCommandItems.filter((item) => item.group === 'block'),
        insertionCommandItems.filter((item) => item.group === 'reference'),
        insertionCommandItems.filter((item) => item.group === 'variable'),
        insertionCommandItems.filter((item) => item.group === 'tool'),
        outlineItems,
        snapshot.prompt.length,
        PromptEditorVM.countWords(snapshot.prompt),
        tokenEstimator.estimate(snapshot.prompt),
        editorCommandsById,
        outlineTargetsById,
    );
  }

  private static countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
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
    readonly group: 'format' | 'block' | 'reference' | 'variable' | 'tool',
    readonly label: string,
    readonly glyph: string,
    readonly disabled: boolean,
    readonly active: boolean,
    readonly description: string = '',
    readonly depth: number = 0,
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
    if (state.command.type === 'variable.insert') {
      const variable = state.variable;
      const type = variable?.types.join(' | ') || 'unspecified';
      return new CommandItemVM(
        `variable.insert.${state.command.path}`, 'variable', `${state.command.path} (${type})`,
        '{{ }}', !state.enabled, false,
        [variable?.title, variable?.description, variable?.required ? 'Required' : 'Optional'].filter(Boolean).join(' — '),
      );
    }
    if (state.command.type === 'tool.insert') {
      const { tool, parameter } = state.command;
      if (parameter === undefined) {
        return new CommandItemVM(`tool.insert.${tool}`, 'tool', tool, 'ƒ', !state.enabled, false, state.tool?.description);
      }
      const type = state.parameter?.types.join(' | ') || 'unspecified';
      const path = parameter.split('.');
      return new CommandItemVM(
        `tool.insert.${tool}.${parameter}`, 'tool', `${path[path.length - 1]} (${type})`,
        '·', !state.enabled, false,
        [state.parameter?.title, state.parameter?.description, state.parameter?.required ? 'Required' : 'Optional'].filter(Boolean).join(' — '),
        path.length,
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
