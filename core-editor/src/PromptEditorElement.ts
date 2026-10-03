import type { EditorCommand } from './editor/commands/EditorCommand'
import type { EditorState } from './editor/commands/EditorState'
import type { PromptEditor } from './editor/PromptEditor'
import { createProseMirrorEditor, installEditorStyles } from './engine'
import type { PromptContent } from './prompt/model/PromptContent'
import { parse, serialize } from './prompt/serialization'
import type { VariableSchema } from './prompt/variables/VariableSchema';
import type { ToolDefinition } from './prompt/tools/ToolDefinition';

const DEFAULT_TAG_NAME = 'prompt-editor';
const EDITOR_SURFACE_CLASS_NAME = 'prompt-editor-surface';
const PROMPT_EDITOR_BRAND = Symbol.for('@cachai/promptier-core-editor/prompt-editor');

export interface PromptEditorElement extends HTMLElement {
  content: PromptContent;
  value: string;
  variableSchema: VariableSchema | undefined;
  variableValidation: boolean;
  tools: readonly ToolDefinition[];
  run(command: EditorCommand): boolean;
  getState(): EditorState | null;
}

export function registerPromptEditor(tagName: string = DEFAULT_TAG_NAME): void {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
  const existing = customElements.get(tagName);
  if (existing) {
    if (isPromptEditorConstructor(existing)) return;
    throw new Error(
      `Cannot register <${tagName}>: that custom-element name is already in use.`,
    );
  }
  const constructor = createPromptEditorElementConstructor();
  customElements.define(tagName, constructor);
}

/**
 * Recognized by brand, not identity: a bundler can load this module twice, and
 * each copy builds its own class.
 */
function isPromptEditorConstructor(constructor: CustomElementConstructor): boolean {
  return (constructor as unknown as Record<symbol, unknown>)[PROMPT_EDITOR_BRAND] === true;
}

function createPromptEditorElementConstructor(): CustomElementConstructor {
  return class PromptEditorElementImplementation
    extends HTMLElement
    implements PromptEditorElement
  {
    static readonly [PROMPT_EDITOR_BRAND] = true;

    private readonly editorContainer: HTMLElement;
    private editor: PromptEditor | null = null;
    private pendingContent: PromptContent = { blocks: [] };
    private pendingVariableSchema: VariableSchema | undefined;
    private pendingVariableValidation = false;
    private pendingTools: readonly ToolDefinition[] = [];
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

    get value(): string {
      return serialize(this.content);
    }

    set value(text: string) {
      this.content = parse(text);
    }

    get variableSchema(): VariableSchema | undefined {
      return this.pendingVariableSchema;
    }

    set variableSchema(schema: VariableSchema | undefined) {
      this.pendingVariableSchema = schema;
      this.editor?.setVariableSchema(schema);
    }

    get variableValidation(): boolean {
      return this.pendingVariableValidation;
    }

    set variableValidation(enabled: boolean) {
      this.pendingVariableValidation = enabled;
      this.editor?.setVariableValidation(enabled);
    }

    get tools(): readonly ToolDefinition[] {
      return this.pendingTools;
    }

    set tools(tools: readonly ToolDefinition[]) {
      this.pendingTools = tools;
      this.editor?.setTools(tools);
    }

    connectedCallback(): void {
      if (this.editor) return;
      this.upgradeProperty('value');
      this.upgradeProperty('content');
      this.upgradeProperty('variableSchema');
      this.upgradeProperty('variableValidation');
      this.upgradeProperty('tools');
      const session = createProseMirrorEditor(this.editorContainer, this.pendingContent);
      this.editor = session;
      session.setVariableSchema(this.pendingVariableSchema);
      session.setVariableValidation(this.pendingVariableValidation);
      session.setTools(this.pendingTools);
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
    private upgradeProperty(name: 'value' | 'content' | 'variableSchema' | 'variableValidation' | 'tools'): void {
      if (!Object.prototype.hasOwnProperty.call(this, name)) return;
      const properties = this as unknown as Record<string, unknown>;
      const pending = properties[name];
      delete properties[name];
      properties[name] = pending;
    }
  };
}
