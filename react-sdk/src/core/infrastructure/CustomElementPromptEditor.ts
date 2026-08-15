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

/**
 * The editor as a `<prompt-editor>` element in this document. Every DOM concern
 * the SDK has lives here — registering the tag, the element's events, and
 * answering sensibly before a node exists — so that nothing above this file
 * knows there is a DOM at all.
 */
export class CustomElementPromptEditor implements PromptEditor {
  private element: PromptEditorElement | null = null;
  private pendingPrompt: string | null = null;
  private readonly promptListeners = new Set<PromptListener>();
  private readonly selectionListeners = new Set<SelectionListener>();

  /**
   * The view's ref callback, deliberately **not** on the port: mounting is this
   * implementation's business, and a port carrying it would force every
   * presenter to know it is talking to a DOM node.
   *
   * Registering here rather than at module scope is what keeps the package
   * importable under SSR — receiving a node already implies a browser. An arrow
   * field so its identity is stable across renders; a ref callback that changes
   * each render is called with `null` and re-called on every pass.
   */
  mountOn = (element: PromptEditorElement | null): void => {
    if (this.element) this.stopListening(this.element);
    this.element = element;
    if (!element) return;

    registerPromptEditor();
    element.addEventListener('change', this.handleChange);
    element.addEventListener('selectionchange', this.handleSelectionChange);
    if (this.pendingPrompt !== null) {
      // Safe even if the element has not upgraded yet: the write lands as an own
      // property and PromptEditorElement replays it on connect.
      element.value = this.pendingPrompt;
      this.pendingPrompt = null;
      this.notifyPromptChanged();
    }
  };

  getPrompt(): string {
    return this.element?.value ?? this.pendingPrompt ?? '';
  }

  /**
   * Notifying here is the point: the element emits `change` only for edits the
   * *user* made, so a host writing the prompt would leave every sibling panel —
   * an outline, a token count — showing the previous document. `onPromptChanged`
   * means the prompt changed, not that someone typed.
   */
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

  // The optional calls cover the window between React inserting the node and
  // the element upgrading: an un-upgraded node is a bare HTMLElement with none
  // of these methods.
  availableCommands(): CommandId[] {
    return this.element?.availableCommands?.() ?? [];
  }

  /** `null` until there is an editor with a selection to describe. */
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

  /**
   * Carries what the editor actually holds, not the string that was written in:
   * the document re-serializes, so a host's input can come back normalized.
   */
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
