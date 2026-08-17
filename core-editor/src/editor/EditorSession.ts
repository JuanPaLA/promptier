import type { PromptContent } from '../prompt/model/PromptContent';
import type { EditorCommand } from './commands/EditorCommand';
import type { EditorSelectionState } from './commands/EditorSelectionState';

export type EditorChangeListener = (content: PromptContent) => void;
export type SelectionChangeListener = (state: EditorSelectionState) => void;

export interface EditorSession {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  run(command: EditorCommand): boolean;
  getSelectionState(): EditorSelectionState;
  onSelectionChange(listener: SelectionChangeListener): () => void;
  destroy(): void;
}
