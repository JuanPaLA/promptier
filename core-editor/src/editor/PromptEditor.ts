import { PromptContent } from '../prompt/model/PromptContent'
import { EditorCommand } from './commands/EditorCommand'
import { EditorSelectionState } from './commands/EditorSelectionState'

export type EditorChangeListener = (content: PromptContent) => void;
export type SelectionChangeListener = (state: EditorSelectionState) => void;

export interface PromptEditor {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  run(command: EditorCommand): boolean;
  getSelectionState(): EditorSelectionState;
  onSelectionChange(listener: SelectionChangeListener): () => void;
}
