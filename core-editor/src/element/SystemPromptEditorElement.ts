import { PROMPT_CONTENT_VERSION, type PromptContent } from '../core/domain/PromptContent';
import { ProseMirrorEditor } from '../core/infrastructure/prosemirror/ProseMirrorEditor';

const DEFAULT_TAG_NAME = 'system-prompt-editor';
const HOST_CLASS_NAME = 'system-prompt-editor-host';

export class SystemPromptEditorElement extends HTMLElement {
  private readonly editor: ProseMirrorEditor = new ProseMirrorEditor();
  private pendingContent: PromptContent = { version: PROMPT_CONTENT_VERSION, blocks: [] };
  private unsubscribe: (() => void) | null = null;
  private mounted: boolean = false;

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
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.editor.destroy();
    this.mounted = false;
  }
}

export function registerSystemPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SystemPromptEditorElement);
  }
}
