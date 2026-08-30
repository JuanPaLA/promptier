import type { EditorCommand } from './editor/commands/EditorCommand'
import type { EditorState } from './editor/commands/EditorState'
import type { PromptEditor } from './editor/PromptEditor'
import { createProseMirrorEditor, installEditorStyles } from './engine'
import type { PromptContent } from './prompt/model/PromptContent'
import { parse, serialize } from './prompt/serialization'

const DEFAULT_TAG_NAME = 'prompt-editor';
const EDITOR_SURFACE_CLASS_NAME = 'prompt-editor-surface';

export interface PromptEditorElement extends HTMLElement {
  content: PromptContent;
  value: string;
  run(command: EditorCommand): boolean;
  getState(): EditorState | null;
}

export function registerPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
  const existing = customElements.get(tagName);
  if (existing) {
    throw new Error(
      `Cannot register <${tagName}>: that custom-element name is already in use.`,
    );
  }
  const constructor = createPromptEditorElementConstructor();
  customElements.define(tagName, constructor);
}

function createPromptEditorElementConstructor(): CustomElementConstructor {
  return class PromptEditorElementImplementation
    extends HTMLElement
    implements PromptEditorElement
  {

    private readonly editorContainer: HTMLElement;
    private editor: PromptEditor | null = null;
    private pendingContent: PromptContent = { blocks: [] };
    private sessionSubscriptions: Array<() => void> = [];

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      installEditorStyles(root);
      this.editorContainer = this.ownerDocument.createElement('div');
      this.editorContainer.className = EDITOR_SURFACE_CLASS_NAME;
      root.append(this.editorContainer);
    }

    get content(): PromptContent {
      return this.editor?.getContent() ?? this.pendingContent;
    }

    set content(value: PromptContent) {
      this.pendingContent = value;
      this.editor?.setContent(value);
    }

    /** The document as prompt text for hosts that do not carry `PromptContent`. */
    get value(): string {
      return serialize(this.content);
    }

    set value(text: string) {
      this.content = parse(text);
    }

    connectedCallback(): void {
      if (this.editor) return;
      this.upgradeProperty('value');
      this.upgradeProperty('content');
      const session = createProseMirrorEditor(this.editorContainer, this.pendingContent);
      this.editor = session;
      this.sessionSubscriptions = [
        session.onChange((content) => {
          this.pendingContent = content;
          this.dispatchEvent(new CustomEvent<PromptContent>('change', { detail: content }));
        }),
        session.onStateChange((state) => {
          this.dispatchEvent(
            new CustomEvent<EditorState>('statechange', { detail: state }),
          );
        }),
      ];
    }

    run(command: EditorCommand): boolean {
      return this.editor?.run(command) ?? false;
    }

    getState(): EditorState | null {
      return this.editor?.getState() ?? null;
    }

    disconnectedCallback(): void {
      this.sessionSubscriptions.forEach((unsubscribe) => unsubscribe());
      this.sessionSubscriptions = [];
      this.editor?.destroy();
      this.editor = null;
    }

    /** Replays a property assigned before the browser upgraded this element. */
    private upgradeProperty(name: 'value' | 'content'): void {
      if (!Object.prototype.hasOwnProperty.call(this, name)) return;
      const properties = this as unknown as Record<string, unknown>;
      const pending = properties[name];
      delete properties[name];
      properties[name] = pending;
    }
  };
}
