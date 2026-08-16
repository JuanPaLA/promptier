import type { CommandId, EditorCommand } from './editor/commands/EditorCommand';
import type { EditorSelectionState } from './editor/commands/EditorSelectionState';
import { EditorSession } from './editor/EditorSession'
import { availableCommandIds } from './engine/prosemirror/commands/commandRegistry';
import { createProseMirrorEditor } from './engine/prosemirror/proseMirrorEditor';
import type { PromptContent } from './prompt/model/PromptContent';
import { parse, serialize } from './prompt/serialization';

const DEFAULT_TAG_NAME = 'prompt-editor';
const HOST_CLASS_NAME = 'prompt-editor-host';
const VALUE_ATTRIBUTE = 'value';

export class PromptEditorElement extends HTMLElement {
  static readonly observedAttributes = [VALUE_ATTRIBUTE];

  private session: EditorSession | null = null;
  private pendingContent: PromptContent = { blocks: [] };
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
    this.upgradeProperty('value');
    this.upgradeProperty('content');
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

  /**
   * The engine's command catalogue. Answerable without an editor — the set of
   * commands is a property of the engine, not of a live document — so a host
   * builds its menu once and asks `getSelectionState()` for what applies now.
   */
  availableCommands(): CommandId[] {
    return availableCommandIds();
  }

  /**
   * Command and format state for the current selection, pushed as
   * `selectionchange` on every transaction. `null` before the editor mounts —
   * there is no selection to describe yet, and callers already reach commands
   * through an optional chain, so nothing branches on it.
   */
  getSelectionState(): EditorSelectionState | null {
    return this.session?.editor.getSelectionState() ?? null;
  }

  /**
   * A host can set `.value` before this definition loads — a deferred
   * `<script>`, or React committing the node before the SDK registers the tag.
   * That write lands as an *own* property which would shadow the accessor for
   * the element's whole life, so replay it through the prototype on upgrade.
   */
  private upgradeProperty(name: 'value' | 'content'): void {
    if (!Object.prototype.hasOwnProperty.call(this, name)) return;
    const properties = this as unknown as Record<string, unknown>;
    const pending = properties[name];
    delete properties[name];
    properties[name] = pending;
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
