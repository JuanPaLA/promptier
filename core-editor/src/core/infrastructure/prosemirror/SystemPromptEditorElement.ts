import { emptySystemPromptContent, SystemPromptContent } from '../../domain/SystemPromptContent';
import { ProseMirrorEditor } from './ProseMirrorEditor';

const DEFAULT_TAG_NAME = 'system-prompt-editor';

export class SystemPromptEditorElement extends HTMLElement {
  private readonly editor = new ProseMirrorEditor();
  private pendingContent: SystemPromptContent = emptySystemPromptContent();
  private unsubscribe: (() => void) | null = null;
  private mounted = false;

  get content(): SystemPromptContent {
    return this.mounted ? this.editor.getContent() : this.pendingContent;
  }

  set content(value: SystemPromptContent) {
    this.pendingContent = value;
    if (this.mounted) {
      this.editor.setContent(value);
    }
  }

  connectedCallback(): void {
    this.editor.mount(this, this.pendingContent);
    this.mounted = true;
    this.unsubscribe = this.editor.onChange((content) => {
      this.pendingContent = content;
      this.dispatchEvent(new CustomEvent<SystemPromptContent>('change', { detail: content }));
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
