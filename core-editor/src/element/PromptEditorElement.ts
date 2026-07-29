import type { MountablePromptEditor } from '../core/app/PromptEditor';
import type { EditorCommand } from '../core/app/commands/EditorCommand';
import type { EditorSelectionState } from '../core/app/commands/EditorSelectionState';
import { PROMPT_CONTENT_VERSION, type PromptContent } from '../core/domain/PromptContent';
import { ProseMirrorEditor } from '../core/infrastructure/prosemirror/ProseMirrorEditor';

const DEFAULT_TAG_NAME = 'prompt-editor';
const HOST_CLASS_NAME = 'prompt-editor-host';

export class PromptEditorElement extends HTMLElement {
  private readonly editor: MountablePromptEditor = this.createEditor();
  private pendingContent: PromptContent = { version: PROMPT_CONTENT_VERSION, blocks: [] };
  private unsubscribe: (() => void) | null = null;
  private unsubscribeSelection: (() => void) | null = null;
  private mounted: boolean = false;

  /**
   * The engine seam. A custom element can't take constructor arguments (hosts
   * create it through the tag), so overriding this is how a subclass swaps the
   * implementation — for a fake in tests, or another editor engine.
   */
  protected createEditor(): MountablePromptEditor {
    return new ProseMirrorEditor();
  }

  get content(): PromptContent {
    return this.mounted ? this.editor.getContent() : this.pendingContent;
  }

  set content(value: PromptContent) {
    this.pendingContent = value;
    if (this.mounted) {
      this.editor.setContent(value);
    }
  }

  connectedCallback(): void {
    this.classList.add(HOST_CLASS_NAME);
    this.editor.mount(this, this.pendingContent);
    this.mounted = true;
    this.unsubscribe = this.editor.onChange((content) => {
      this.pendingContent = content;
      this.dispatchEvent(new CustomEvent<PromptContent>('change', { detail: content }));
    });
    this.unsubscribeSelection = this.editor.onSelectionChange((state) => {
      this.dispatchEvent(new CustomEvent<EditorSelectionState>('selectionchange', { detail: state }));
    });
  }

  run(command: EditorCommand): void {
    if (this.mounted) {
      this.editor.run(command);
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeSelection?.();
    this.unsubscribeSelection = null;
    this.editor.destroy();
    this.mounted = false;
  }
}

export function registerPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, PromptEditorElement);
  }
}
