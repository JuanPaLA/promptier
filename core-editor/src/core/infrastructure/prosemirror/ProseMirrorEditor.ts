import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type {
  EditorChangeListener,
  MountablePromptEditor,
  SelectionChangeListener,
} from '../../app/PromptEditor';
import type { EditorCommand } from '../../app/commands/EditorCommand';
import type { EditorSelectionState } from '../../app/commands/EditorSelectionState';
import type { PromptContent } from '../../domain/PromptContent';
import { runCommand, selectionStateFromEditorState } from './commands/commandRegistry';
import {
  blockInputRules,
  blockKeymaps,
  blockNodeViews,
} from './descriptors/blocks/blockDescriptorRegistry';
import { markInputRules, markKeymaps } from './descriptors/marks/markDescriptorRegistry';
import { promptSchema } from './descriptors/promptSchema';
import { fromProseMirrorDoc, toProseMirrorDoc } from './mapping/documentMapper';
import { appendTrailingParagraph } from './plugins/appendTrailingParagraph';
import { ensureEditorStyles } from './styles/editorStyles';

export class ProseMirrorEditor implements MountablePromptEditor {
  private view: EditorView | null = null;
  private readonly listeners = new Set<EditorChangeListener>();
  private readonly selectionListeners = new Set<SelectionChangeListener>();

  mount(container: HTMLElement, initialContent: PromptContent): void {
    ensureEditorStyles(container.ownerDocument);
    const state = EditorState.create({
      schema: promptSchema,
      doc: toProseMirrorDoc(initialContent, promptSchema),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
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
      dispatchTransaction: (transaction: Transaction) => {
        if (!this.view) return;
        const newState = this.view.state.apply(transaction);
        this.view.updateState(newState);
        if (transaction.docChanged) {
          const content = fromProseMirrorDoc(newState.doc);
          this.listeners.forEach((listener) => listener(content));
        }
        // Every transaction, not just docChanged: cursor moves change the snapshot.
        const selectionState = selectionStateFromEditorState(newState);
        this.selectionListeners.forEach((listener) => listener(selectionState));
      },
    });
  }

  getContent(): PromptContent {
    if (!this.view) throw new Error('Editor not mounted');
    return fromProseMirrorDoc(this.view.state.doc);
  }

  setContent(content: PromptContent): void {
    if (!this.view) throw new Error('Editor not mounted');
    const newDoc = toProseMirrorDoc(content, promptSchema);
    if (this.view.state.doc.eq(newDoc)) return;
    const newState = EditorState.create({
      schema: promptSchema,
      doc: newDoc,
      plugins: this.view.state.plugins,
    });
    this.view.updateState(newState);
  }

  onChange(listener: EditorChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  run(command: EditorCommand): void {
    if (!this.view) throw new Error('Editor not mounted');
    runCommand(this.view, command);
  }

  getSelectionState(): EditorSelectionState {
    if (!this.view) throw new Error('Editor not mounted');
    return selectionStateFromEditorState(this.view.state);
  }

  onSelectionChange(listener: SelectionChangeListener): () => void {
    this.selectionListeners.add(listener);
    return () => this.selectionListeners.delete(listener);
  }

  destroy(): void {
    this.view?.destroy();
    this.view = null;
    this.listeners.clear();
    this.selectionListeners.clear();
  }
}
