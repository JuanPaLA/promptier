import { sectionReferences } from '../../prompt/references/sectionReferences';
import { ReferenceCommands } from './commands/ReferenceCommands';
import { referenceDecorations } from './plugins/referenceDecorations';
import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Schema } from 'prosemirror-model';
import { EditorState as ProseMirrorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type {
  EditorChangeListener,
  EditorStateChangeListener,
  PromptEditor,
} from '../../editor/PromptEditor';
import type { EditorCommand } from '../../editor/commands/EditorCommand';
import type { EditorState } from '../../editor/commands/EditorState';
import type { PromptContent } from '../../prompt/model/PromptContent';
import { BlockCommands } from './commands/BlockCommands';
import { EditorCommandRegistry } from './commands/EditorCommandRegistry';
import { FormatCommands } from './commands/FormatCommands';
import { NavigateCommands } from './commands/NavigateCommands';
import type { BlockRegistry } from './descriptors/blocks/BlockRegistry';
import type { MarkRegistry } from './descriptors/marks/MarkRegistry';
import type { PromptDocumentMapper } from './mapping/PromptDocumentMapper';
import { appendTrailingParagraph } from './plugins/appendTrailingParagraph';
import {
  blockRegistry,
  documentMapper,
  markRegistry,
  promptSchema,
} from './proseMirrorConfiguration';
import { EditorStateReader } from './state/EditorStateReader';

export function createProseMirrorEditor(
  container: HTMLElement,
  initialContent: PromptContent,
): PromptEditor {
  const formatCommands = new FormatCommands(markRegistry.all().map(({ format }) => format));
  const blockCommands = new BlockCommands(blockRegistry, documentMapper);
  const referenceCommands = new ReferenceCommands(documentMapper);
  const commandRegistry = new EditorCommandRegistry([
    formatCommands,
    blockCommands,
    new NavigateCommands(),
    referenceCommands,
  ]);
  const stateReader = new EditorStateReader([formatCommands, blockCommands, referenceCommands]);

  return new ProseMirrorEditor(
    container,
    initialContent,
    promptSchema,
    documentMapper,
    blockRegistry,
    markRegistry,
    commandRegistry,
    stateReader,
  );
}

class ProseMirrorEditor implements PromptEditor {
  private readonly view: EditorView;
  private readonly listeners = new Set<EditorChangeListener>();
  private readonly stateListeners = new Set<EditorStateChangeListener>();

  constructor(
    container: HTMLElement,
    initialContent: PromptContent,
    private readonly schema: Schema,
    private readonly documentMapper: PromptDocumentMapper,
    private readonly blocks: BlockRegistry,
    private readonly marks: MarkRegistry,
    private readonly commands: EditorCommandRegistry,
    private readonly stateReader: EditorStateReader,
  ) {
    const state = ProseMirrorState.create({
      schema: this.schema,
      doc: this.documentMapper.toDocument(initialContent),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }), // todo: should be defined as history commands?
        keymap(this.blocks.keymap(this.schema)),
        keymap(this.marks.keymap(this.schema)),
        keymap(baseKeymap),
        inputRules({
          rules: [...this.blocks.inputRules(this.schema), ...this.marks.inputRules(this.schema)],
        }),
        appendTrailingParagraph(),
        referenceDecorations((doc) => [sectionReferences(this.documentMapper.fromDocument(doc))]),
      ],
    });

    this.view = new EditorView(container, {
      state,
      nodeViews: this.blocks.nodeViews(),
      dispatchTransaction: (transaction: Transaction) => this.apply(transaction),
    });
  }

  getContent(): PromptContent {
    return this.documentMapper.fromDocument(this.view.state.doc);
  }

  setContent(content: PromptContent): void {
    const newDoc = this.documentMapper.toDocument(content);
    if (this.view.state.doc.eq(newDoc)) return;
    const newState = ProseMirrorState.create({
      schema: this.schema,
      doc: newDoc,
      plugins: this.view.state.plugins,
    });
    this.view.updateState(newState);
    this.notifyStateChanged();
  }

  onChange(listener: EditorChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  run(command: EditorCommand): boolean {
    return this.commands.run(this.view, command);
  }

  getState(): EditorState {
    return this.stateReader.read(this.view.state);
  }

  onStateChange(listener: EditorStateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  destroy(): void {
    this.view.destroy();
    this.listeners.clear();
    this.stateListeners.clear();
  }

  private apply(transaction: Transaction): void {
    const newState = this.view.state.apply(transaction);
    this.view.updateState(newState);
    if (transaction.docChanged) {
      const content = this.documentMapper.fromDocument(newState.doc);
      this.listeners.forEach((listener) => listener(content));
    }
    // Every transaction, not just docChanged: cursor and history changes affect UI state.
    this.notifyStateChanged();
  }

  private notifyStateChanged(): void {
    const state = this.stateReader.read(this.view.state);
    this.stateListeners.forEach((listener) => listener(state));
  }
}
