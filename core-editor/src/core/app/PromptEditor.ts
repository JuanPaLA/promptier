import { PromptContent } from '../domain/PromptContent';
import { EditorCommand } from './commands/EditorCommand';
import { EditorSelectionState } from './commands/EditorSelectionState';

export type EditorChangeListener = (content: PromptContent) => void;
export type SelectionChangeListener = (state: EditorSelectionState) => void;

/** Reading, writing and driving a prompt document. Platform-free. */
export interface PromptEditor {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  run(command: EditorCommand): void;
  getSelectionState(): EditorSelectionState;
  onSelectionChange(listener: SelectionChangeListener): () => void;
}

/**
 * A PromptEditor that also owns a DOM lifecycle. Split from `PromptEditor` so
 * `HTMLElement` reaches only the consumers that mount one — the packaging
 * layer. Anything that merely reads or drives a document depends on the base
 * port and stays platform-free.
 */
export interface MountablePromptEditor extends PromptEditor {
  mount(container: HTMLElement, initialContent: PromptContent): void;
  destroy(): void;
}
