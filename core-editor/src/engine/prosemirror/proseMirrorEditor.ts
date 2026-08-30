import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState as ProseMirrorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { EditorChangeListener, PromptEditor, EditorStateChangeListener } from '../../editor/PromptEditor';
import type { EditorCommand } from '../../editor/commands/EditorCommand';
import type { EditorState } from '../../editor/commands/EditorState';
import type { PromptContent } from '../../prompt/model/PromptContent';
import { EditorCommandRegistry } from './commands/EditorCommandRegistry';
import { EditorStateReader } from './state/EditorStateReader';
import { FormatCommands } from './commands/FormatCommands';
import { NavigateCommands } from './commands/NavigateCommands';
import { blockInputRules, blockKeymaps, blockNodeViews } from './descriptors/blocks/blockDescriptorRegistry';
import { markDescriptors, markInputRules, markKeymaps } from './descriptors/marks/markDescriptorRegistry';
import { promptSchema } from './descriptors/promptSchema';
import { fromProseMirrorDoc, toProseMirrorDoc } from './mapping/documentMapper';
import { appendTrailingParagraph } from './plugins/appendTrailingParagraph';

export function createProseMirrorEditor(
  container: HTMLElement,
  initialContent: PromptContent,
): PromptEditor {
  const formatCommands = new FormatCommands(markDescriptors.map(({ format }) => format));
  const commandRegistry = new EditorCommandRegistry([formatCommands, new NavigateCommands()]);
  const stateReader = new EditorStateReader([formatCommands]);
  return new ProseMirrorEditor(
    container,
    initialContent,
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
    private readonly commands: EditorCommandRegistry,
    private readonly stateReader: EditorStateReader,
  ) {
    const state = ProseMirrorState.create({
      schema: promptSchema,
      doc: toProseMirrorDoc(initialContent, promptSchema),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }), // todo: should be defined as history commands?
        keymap(blockKeymaps(promptSchema)),
        keymap(markKeymaps(promptSchema)),
        keymap(baseKeymap),
        inputRules({ rules: [...blockInputRules(promptSchema), ...markInputRules(promptSchema)] }),
        appendTrailingParagraph(),
      ],
    });

    this.view = new EditorView(container, {
      state,
      nodeViews: blockNodeViews(),
      dispatchTransaction: (transaction: Transaction) => this.apply(transaction),
    });
  }

  getContent(): PromptContent {
    return fromProseMirrorDoc(this.view.state.doc);
  }

  setContent(content: PromptContent): void {
    const newDoc = toProseMirrorDoc(content, promptSchema);
    if (this.view.state.doc.eq(newDoc)) return;
    const newState = ProseMirrorState.create({
      schema: promptSchema,
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
      const content = fromProseMirrorDoc(newState.doc);
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
