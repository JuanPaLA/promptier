import type { EditorCommand } from '../core/app/commands/EditorCommand';
import type { EditorSelectionState } from '../core/app/commands/EditorSelectionState';
import { parse } from '../core/app/format/parse';
import { serialize } from '../core/app/format/serialize';
import { PROMPT_CONTENT_VERSION, type PromptContent } from '../core/domain/PromptContent';
import { createProseMirrorEditor } from '../core/infrastructure/prosemirror/proseMirrorEditor';
import { EditorSession } from '../core/app/EditorSession'

const DEFAULT_TAG_NAME = 'prompt-editor';
const HOST_CLASS_NAME = 'prompt-editor-host';
const VALUE_ATTRIBUTE = 'value';

export class PromptEditorElement extends HTMLElement {
  static readonly observedAttributes = [VALUE_ATTRIBUTE];

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

  /**
   * The document as prompt text — the contract for hosts that don't want to
   * carry `PromptContent`. `value` and `content` are two views onto one
   * document, so the last write wins; both defer until the editor mounts.
   *
   * Initial-value semantics, like a textarea's initial content: set it once,
   * read it when saving. Binding it per keystroke would re-parse while the user
   * types and fight the caret. See docs/format.md.
   */
  get value(): string {
    return serialize(this.content);
  }

  set value(text: string) {
    this.content = parse(text);
  }

  attributeChangedCallback(name: string, _previous: string | null, next: string | null): void {
    // One-way, like `<input value>`: the attribute seeds the document, and
    // later edits are not written back to the DOM.
    if (name === VALUE_ATTRIBUTE && next !== null) this.value = next;
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
