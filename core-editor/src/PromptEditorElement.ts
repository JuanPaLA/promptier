import type { CommandId, EditorCommand } from './editor/commands/EditorCommand';
import type { EditorSelectionState } from './editor/commands/EditorSelectionState';
import type { EditorSession } from './editor/EditorSession';
import { availableCommandIds } from './engine/prosemirror/commands/commandRegistry';
import { createProseMirrorEditor } from './engine/prosemirror/proseMirrorEditor';
import { installEditorStyles } from './engine/prosemirror/styles/editorStyles';
import type { PromptContent } from './prompt/model/PromptContent';
import { parse, serialize } from './prompt/serialization';

const DEFAULT_TAG_NAME = 'prompt-editor';
const EDITOR_SURFACE_CLASS_NAME = 'prompt-editor-surface';
const ELEMENT_CONTRACT_MARK = Symbol.for('promptier.element.contract');
const ELEMENT_CONTRACT_VERSION = 1;
const VALUE_ATTRIBUTE = 'value';

/** The browser-facing contract implemented by the registered custom element. */
export interface PromptEditorElement extends HTMLElement {
  content: PromptContent;
  value: string;
  run(command: EditorCommand): void;
  availableCommands(): CommandId[];
  getSelectionState(): EditorSelectionState | null;
}

export function registerPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  // Importing the package is safe during SSR. The actual element class only
  // exists in a browser, when there is a registry to receive it.
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;

  const existing = customElements.get(tagName);
  if (existing) {
    if (Reflect.get(existing, ELEMENT_CONTRACT_MARK) === ELEMENT_CONTRACT_VERSION) return;
    throw new Error(
      `Cannot register <${tagName}>: that custom-element name is already in use.`,
    );
  }

  const constructor = createPromptEditorElementConstructor();
  Reflect.defineProperty(constructor, ELEMENT_CONTRACT_MARK, {
    value: ELEMENT_CONTRACT_VERSION,
  });
  customElements.define(tagName, constructor);
}

function createPromptEditorElementConstructor(): CustomElementConstructor {
  return class PromptEditorElementImplementation
    extends HTMLElement
    implements PromptEditorElement
  {
    static readonly observedAttributes = [VALUE_ATTRIBUTE];

    private readonly editorContainer: HTMLElement;
    private session: EditorSession | null = null;
    private pendingContent: PromptContent = { blocks: [] };
    private unsubscribe: (() => void) | null = null;
    private unsubscribeSelection: (() => void) | null = null;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      installEditorStyles(root);
      this.editorContainer = this.ownerDocument.createElement('div');
      this.editorContainer.className = EDITOR_SURFACE_CLASS_NAME;
      root.append(this.editorContainer);
    }

    protected createEditor(
      container: HTMLElement,
      initialContent: PromptContent,
    ): EditorSession {
      return createProseMirrorEditor(container, initialContent);
    }

    get content(): PromptContent {
      return this.session?.editor.getContent() ?? this.pendingContent;
    }

    set content(value: PromptContent) {
      this.pendingContent = value;
      this.session?.editor.setContent(value);
    }

    /** The document as prompt text for hosts that do not carry `PromptContent`. */
    get value(): string {
      return serialize(this.content);
    }

    set value(text: string) {
      this.content = parse(text);
    }

    attributeChangedCallback(name: string, _previous: string | null, next: string | null): void {
      // One-way, like `<input value>`: later edits are not reflected to it.
      if (name === VALUE_ATTRIBUTE && next !== null) this.value = next;
    }

    connectedCallback(): void {
      if (this.session) return;
      this.upgradeProperty('value');
      this.upgradeProperty('content');
      const session = this.createEditor(this.editorContainer, this.pendingContent);
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

    availableCommands(): CommandId[] {
      return availableCommandIds();
    }

    getSelectionState(): EditorSelectionState | null {
      return this.session?.editor.getSelectionState() ?? null;
    }

    /** Replays a property assigned before the browser upgraded this element. */
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
  };
}
