import {
  registerPromptEditor,
  type CommandId,
  type EditorCommand,
  type EditorSelectionState,
  type PromptContent,
  type PromptEditorElement,
} from 'core-editor';
import type {
  PromptEditor,
  PromptListener,
  SelectionListener,
  Unsubscribe,
} from '../app/PromptEditor';

const EMPTY_CONTENT: PromptContent = { blocks: [] };

export class CustomElementPromptEditor implements PromptEditor {
  private element: PromptEditorElement | null = null;
  private pendingPrompt: string | null = null;
  private readonly promptListeners = new Set<PromptListener>();
  private readonly selectionListeners = new Set<SelectionListener>();

  mountOn = (element: PromptEditorElement | null): void => {
    if (this.element) this.stopListening(this.element);
    this.element = element;
    if (!element) return;

    registerPromptEditor();
    element.addEventListener('change', this.handleChange);
    element.addEventListener('selectionchange', this.handleSelectionChange);
    if (this.pendingPrompt !== null) {
      element.value = this.pendingPrompt;
      this.pendingPrompt = null;
      this.notifyPromptChanged();
    }
  };

  getPrompt(): string {
    return this.element?.value ?? this.pendingPrompt ?? '';
  }

  setPrompt(prompt: string): void {
    if (!this.element) {
      this.pendingPrompt = prompt;
      return;
    }
    this.element.value = prompt;
    this.notifyPromptChanged();
  }

  getContent(): PromptContent {
    return this.element?.content ?? EMPTY_CONTENT;
  }

  run(command: EditorCommand): void {
    this.element?.run(command);
  }

  availableCommands(): CommandId[] {
    return this.element?.availableCommands?.() ?? [];
  }

  selectionState(): EditorSelectionState | null {
    return this.element?.getSelectionState?.() ?? null;
  }

  onPromptChanged(listener: PromptListener): Unsubscribe {
    this.promptListeners.add(listener);
    return () => {
      this.promptListeners.delete(listener);
    };
  }

  onSelectionChanged(listener: SelectionListener): Unsubscribe {
    this.selectionListeners.add(listener);
    return () => {
      this.selectionListeners.delete(listener);
    };
  }

  private handleChange = (): void => {
    this.notifyPromptChanged();
  };

  private notifyPromptChanged(): void {
    const prompt = this.getPrompt();
    this.promptListeners.forEach((listener) => listener(prompt));
  }

  private handleSelectionChange = (event: Event): void => {
    const selection = (event as CustomEvent<EditorSelectionState>).detail;
    this.selectionListeners.forEach((listener) => listener(selection));
  };

  private stopListening(element: PromptEditorElement): void {
    element.removeEventListener('change', this.handleChange);
    element.removeEventListener('selectionchange', this.handleSelectionChange);
  }
}
