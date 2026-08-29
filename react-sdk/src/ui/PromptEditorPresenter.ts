import { PresenterBase, type ChangeFunc } from '@nbottarini/react-presenter';
import {
  outline,
  type CommandState,
  type EditorCommand,
  type OutlineEntry,
} from 'core-editor';

import {
  PromptEditorService,
  type PromptEditorSnapshot,
  type Unsubscribe,
} from '../app/PromptEditorService';
import {
  CommandItemVM,
  OutlineItemVM,
  type PromptEditorVM,
} from './PromptEditorVM';

export interface PromptEditorPresenterProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
}

export class PromptEditorPresenter extends PresenterBase<
  PromptEditorVM,
  PromptEditorPresenterProps
> {
  private editorSubscription: Unsubscribe | null = null;
  private lastReportedPrompt = '';
  private editorCommandsById = new Map<string, EditorCommand>();
  private outlinePathById = new Map<string, readonly number[]>();

  constructor(onChange: ChangeFunc, private readonly editor: PromptEditorService) {
    super(onChange);
    this.propChanged('value', this.setPrompt);
  }

  protected initModel(): PromptEditorVM {
    return this.viewModelFrom(this.editor.getSnapshot());
  }

  start(): void {
    this.editorSubscription = this.editor.subscribe(this.handleEditorChange);
    this.setPrompt(this.props.value);
    this.refreshViewModel();
  }

  stop(): void {
    this.editorSubscription?.();
    this.editorSubscription = null;
  }

  runCommand = (id: string): void => {
    const command = this.editorCommandsById.get(id);
    if (command) this.editor.run(command);
  };

  selectOutlineItem = (id: string): void => {
    const path = this.outlinePathById.get(id);
    if (!path) return;
    this.editor.run({ type: 'navigate', target: { kind: 'section', path } });
  };

  private setPrompt = (prompt: string | undefined): void => {
    if (prompt === undefined || prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.editor.setPrompt(prompt);
  };

  private handleEditorChange = (): void => {
    const snapshot = this.editor.getSnapshot();
    this.updateModel(this.viewModelFrom(snapshot));
    this.reportPrompt(snapshot.prompt);
  };

  private refreshViewModel(): void {
    this.updateModel(this.viewModelFrom(this.editor.getSnapshot()));
  }

  private reportPrompt(prompt: string): void {
    if (prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.props.onChange?.(prompt);
  }

  private viewModelFrom(snapshot: PromptEditorSnapshot): PromptEditorVM {
    const [commandItems, commandsById] = buildCommandItems(
      snapshot.state?.commands ?? [],
    );
    const [outlineItems, pathsById] = buildOutlineItems(
      outline(snapshot.content),
    );
    this.editorCommandsById = commandsById;
    this.outlinePathById = pathsById;
    return {
      commandItems,
      outlineItems,
    };
  }
}

function buildCommandItems(
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

function buildOutlineItems(
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
