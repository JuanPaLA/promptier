import {
  registerPromptEditor,
  type EditorCommand,
  type EditorStateSnapshot,
  type PromptContent,
  type PromptEditorElement,
} from 'core-editor';

export type PromptEditorListener = () => void;
export type Unsubscribe = () => void;

export interface PromptEditorSnapshot {
  readonly ready: boolean;
  readonly prompt: string;
  readonly content: PromptContent;
  readonly state: EditorStateSnapshot | null;
}

/** Owns the Custom Element lifecycle and exposes it as an observable store. */
export class PromptEditorController {
  private element: PromptEditorElement | null = null;
  private pendingPrompt: string | null;
  private snapshot: PromptEditorSnapshot;
  private readonly listeners = new Set<PromptEditorListener>();

  constructor(initialPrompt?: string) {
    this.pendingPrompt = initialPrompt ?? null;
    this.snapshot = {
      ready: false,
      prompt: initialPrompt ?? '',
      content: EMPTY_CONTENT,
      state: null,
    };
  }

  attach = (host: HTMLElement | null): void => {
    if (this.element) this.stopListening(this.element);
    const previousSnapshot = this.snapshot;
    if (!host) {
      this.element = null;
      this.snapshot = { ...previousSnapshot, ready: false, state: null };
      this.notifyListeners();
      return;
    }

    registerPromptEditor();
    const element = host as PromptEditorElement;
    this.element = element;
    element.addEventListener('change', this.handleChange);
    element.addEventListener('statechange', this.handleStateChange);
    if (this.pendingPrompt !== null) {
      element.value = this.pendingPrompt;
      this.pendingPrompt = null;
    }
    // connectedCallback runs before a React ref is attached, so pull the
    // initial state instead of waiting for another editor transaction.
    this.publishSnapshot();
  };

  setPrompt(prompt: string): void {
    if (!this.element) {
      this.pendingPrompt = prompt;
      this.publishSnapshot();
      return;
    }
    this.element.value = prompt;
    this.publishSnapshot();
  }

  run(command: EditorCommand): boolean {
    return this.element?.run(command) ?? false;
  }

  getSnapshot = (): PromptEditorSnapshot => this.snapshot;

  subscribe = (listener: PromptEditorListener): Unsubscribe => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private handleChange = (): void => {
    this.publishSnapshot();
  };

  private handleStateChange = (): void => {
    this.publishSnapshot();
  };

  private stopListening(element: PromptEditorElement): void {
    element.removeEventListener('change', this.handleChange);
    element.removeEventListener('statechange', this.handleStateChange);
  }

  private publishSnapshot(): void {
    this.snapshot = {
      ready: this.element !== null,
      prompt: this.element?.value ?? this.pendingPrompt ?? this.snapshot.prompt,
      content: this.element?.content ?? EMPTY_CONTENT,
      state: this.element?.getState() ?? null,
    };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

const EMPTY_CONTENT: PromptContent = { blocks: [] };
