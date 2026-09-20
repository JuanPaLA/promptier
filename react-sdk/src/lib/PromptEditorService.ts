import {
  registerPromptEditor,
  type EditorCommand,
  type EditorState,
  type PromptContent,
  type PromptEditorElement,
  type VariableSchema,
} from 'core-editor';

type PromptEditorListener = () => void;
export type Unsubscribe = () => void;

export interface PromptEditorSnapshot {
  readonly prompt: string;
  readonly content: PromptContent;
  readonly state: EditorState | null;
}

/** Adapts the Custom Element lifecycle and events for the SDK presenter. */
export class PromptEditorService {
  private element: PromptEditorElement | null = null;
  private pendingPrompt: string | null = null;
  private variableSchema: VariableSchema | undefined;
  private variableValidation = false;
  private variableContext: unknown;
  private snapshot: PromptEditorSnapshot = EMPTY_SNAPSHOT;
  private readonly listeners = new Set<PromptEditorListener>();

  attach = (host: HTMLElement | null): void => {
    if (this.element) this.stopListening(this.element);
    if (!host) {
      this.element = null;
      this.snapshot = { ...this.snapshot, state: null };
      this.notifyListeners();
      return;
    }

    registerPromptEditor();
    const element = host as PromptEditorElement;
    this.element = element;
    element.addEventListener('change', this.handleEditorChange);
    element.addEventListener('statechange', this.handleEditorChange);
    element.variableSchema = this.variableSchema;
    element.variableValidation = this.variableValidation;
    element.variableContext = this.variableContext;
    if (this.pendingPrompt !== null) {
      element.value = this.pendingPrompt;
      this.pendingPrompt = null;
    }
    // The element connects before React assigns its ref, so its initial events
    // have already happened. Pull that state after attaching.
    this.publishSnapshot();
  };

  setPrompt(prompt: string): void {
    if (!this.element) this.pendingPrompt = prompt;
    else this.element.value = prompt;
    this.publishSnapshot();
  }

  run(command: EditorCommand): boolean {
    return this.element?.run(command) ?? false;
  }

  setVariableSchema(schema: VariableSchema | undefined): void {
    this.variableSchema = schema;
    if (this.element) this.element.variableSchema = schema;
    this.publishSnapshot();
  }

  setVariableValidation(enabled: boolean): void {
    this.variableValidation = enabled;
    if (this.element) this.element.variableValidation = enabled;
  }

  setVariableContext(context: unknown): void {
    this.variableContext = context;
    if (this.element) this.element.variableContext = context;
  }

  getSnapshot(): PromptEditorSnapshot {
    return this.snapshot;
  }

  subscribe(listener: PromptEditorListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleEditorChange = (): void => {
    this.publishSnapshot();
  };

  private stopListening(element: PromptEditorElement): void {
    element.removeEventListener('change', this.handleEditorChange);
    element.removeEventListener('statechange', this.handleEditorChange);
  }

  private publishSnapshot(): void {
    this.snapshot = {
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
const EMPTY_SNAPSHOT: PromptEditorSnapshot = {
  prompt: '',
  content: EMPTY_CONTENT,
  state: null,
};
