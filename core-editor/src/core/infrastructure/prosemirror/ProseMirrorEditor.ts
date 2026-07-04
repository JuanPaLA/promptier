import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { EditorChangeListener, PromptEditor } from '../../app/ports/PromptEditor';
import { SystemPromptContent } from '../../domain/SystemPromptContent';
import { blockInputRules } from './blocks/registry';
import { fromProseMirrorDoc, toProseMirrorDoc } from './document';
import { promptSchema } from './schema';

export class ProseMirrorEditor implements PromptEditor {
  private view: EditorView | null = null;
  private readonly listeners = new Set<EditorChangeListener>();

  mount(container: HTMLElement, initialContent: SystemPromptContent): void {
    const state = EditorState.create({
      schema: promptSchema,
      doc: toProseMirrorDoc(initialContent),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
        keymap(baseKeymap),
        inputRules({ rules: blockInputRules(promptSchema) }),
      ],
    });

    this.view = new EditorView(container, {
      state,
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

  getContent(): SystemPromptContent {
    if (!this.view) throw new Error('Editor not mounted');
    return fromProseMirrorDoc(this.view.state.doc);
  }

  setContent(content: SystemPromptContent): void {
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
