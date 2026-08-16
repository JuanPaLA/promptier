import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type {
  EditorChangeListener,
  PromptEditor,
  SelectionChangeListener,
} from '../../editor/PromptEditor';
import type { EditorCommand } from '../../editor/commands/EditorCommand';
import type { EditorSelectionState } from '../../editor/commands/EditorSelectionState';
import type { PromptContent } from '../../prompt/model/PromptContent';
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
import type { EditorSession } from '../../editor/EditorSession';

/**
 * Starts an editor in `container`. The class itself stays unexported so
 * `destroy` is reachable only through the session — no cast gets you there.
 */
export function createProseMirrorEditor(
  container: HTMLElement,
  initialContent: PromptContent,
): EditorSession {
  const editor = new ProseMirrorEditor(container, initialContent);
  return { editor, destroy: () => editor.destroy() };
}

class ProseMirrorEditor implements PromptEditor {
  private readonly view: EditorView;
  private readonly listeners = new Set<EditorChangeListener>();
  private readonly selectionListeners = new Set<SelectionChangeListener>();

  constructor(container: HTMLElement, initialContent: PromptContent) {
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
      // Reads `this.view`, which is assigned below — safe because nothing
      // dispatches while `new EditorView` runs: node views only build DOM and
      // plugins only act on events.
      dispatchTransaction: (transaction: Transaction) => this.apply(transaction),
    });
  }

  getContent(): PromptContent {
    return fromProseMirrorDoc(this.view.state.doc);
  }

  setContent(content: PromptContent): void {
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
    runCommand(this.view, command);
  }

  getSelectionState(): EditorSelectionState {
    return selectionStateFromEditorState(this.view.state);
  }

  onSelectionChange(listener: SelectionChangeListener): () => void {
    this.selectionListeners.add(listener);
    return () => this.selectionListeners.delete(listener);
  }

  destroy(): void {
    this.view.destroy();
    this.listeners.clear();
    this.selectionListeners.clear();
  }

  private apply(transaction: Transaction): void {
    const newState = this.view.state.apply(transaction);
    this.view.updateState(newState);
    if (transaction.docChanged) {
      const content = fromProseMirrorDoc(newState.doc);
      this.listeners.forEach((listener) => listener(content));
    }
    // Every transaction, not just docChanged: cursor moves change the snapshot.
    const selectionState = selectionStateFromEditorState(newState);
    this.selectionListeners.forEach((listener) => listener(selectionState));
  }
}
