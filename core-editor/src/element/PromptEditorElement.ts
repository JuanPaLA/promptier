import type { EditorCommand } from '../core/app/commands/EditorCommand';
import type { EditorSelectionState } from '../core/app/commands/EditorSelectionState';
import { PROMPT_CONTENT_VERSION, type PromptContent } from '../core/domain/PromptContent';
import { createProseMirrorEditor } from '../core/infrastructure/prosemirror/proseMirrorEditor';
import { EditorSession } from '../core/app/EditorSession'

const DEFAULT_TAG_NAME = 'prompt-editor';
const HOST_CLASS_NAME = 'prompt-editor-host';

export class PromptEditorElement extends HTMLElement {
  private session: EditorSession | null = null;
  private pendingContent: PromptContent = { version: PROMPT_CONTENT_VERSION, blocks: [] };
  private unsubscribe: (() => void) | null = null;
  private unsubscribeSelection: (() => void) | null = null;

  /**
   * The engine seam. A custom element can't take constructor arguments (hosts
   * create it through the tag), so overriding this is how a subclass swaps the
   * implementation — for a fake in tests, or another editor engine.
   */
  protected createEditor(container: HTMLElement, initialContent: PromptContent): EditorSession {
    return createProseMirrorEditor(container, initialContent);
  }

  get content(): PromptContent {
    return this.session?.editor.getContent() ?? this.pendingContent;
  }

  set content(value: PromptContent) {
    this.pendingContent = value;
    this.session?.editor.setContent(value);
  }

  connectedCallback(): void {
    this.classList.add(HOST_CLASS_NAME);
    const session = this.createEditor(this, this.pendingContent);
    this.session = session;
    this.unsubscribe = session.editor.onChange((content) => {
      this.pendingContent = content;
      this.dispatchEvent(new CustomEvent<PromptContent>('change', { detail: content }));
    });
    this.unsubscribeSelection = session.editor.onSelectionChange((state) => {
      this.dispatchEvent(new CustomEvent<EditorSelectionState>('selectionchange', { detail: state }));
    });
  }

  run(command: EditorCommand): void {
    this.session?.editor.run(command);
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeSelection?.();
    this.unsubscribeSelection = null;
    this.session?.destroy();
    this.session = null;
  }
}

export function registerPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, PromptEditorElement);
  }
}
