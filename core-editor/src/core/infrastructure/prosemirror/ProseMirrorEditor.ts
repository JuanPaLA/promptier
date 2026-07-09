import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { EditorChangeListener, PromptEditor } from '../../app/PromptEditor';
import { PromptContent } from '../../domain/PromptContent';
import { blockInputRules, blockKeymaps, blockNodeViews } from './blocksDescriptors/blockDescriptorRegistry';
import { markInputRules, markKeymaps } from './marksDescriptors/markDescriptorRegistry';
import { fromProseMirrorDoc, toProseMirrorDoc } from './DocumentMapper';
import { ensureEditorStyles } from './editorStyles';
import { promptSchema } from './Schema';

export class ProseMirrorEditor implements PromptEditor {
  private view: EditorView | null = null;
  private readonly listeners = new Set<EditorChangeListener>();

  mount(container: HTMLElement, initialContent: PromptContent): void {
    ensureEditorStyles(container.ownerDocument);
    const state = EditorState.create({
      schema: promptSchema,
      doc: toProseMirrorDoc(initialContent),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
        keymap(blockKeymaps(promptSchema)),
        keymap(markKeymaps(promptSchema)),
        keymap(baseKeymap),
        inputRules({ rules: [...blockInputRules(promptSchema), ...markInputRules(promptSchema)] }),
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
      },
    });
  }

  getContent(): PromptContent {
    if (!this.view) throw new Error('Editor not mounted');
    return fromProseMirrorDoc(this.view.state.doc);
  }

  setContent(content: PromptContent): void {
    if (!this.view) throw new Error('Editor not mounted');
    const newDoc = toProseMirrorDoc(content);
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

  destroy(): void {
    this.view?.destroy();
    this.view = null;
    this.listeners.clear();
  }
}
