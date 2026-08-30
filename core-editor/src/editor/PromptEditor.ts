import type { PromptContent } from '../prompt/model/PromptContent';
import type { EditorCommand } from './commands/EditorCommand';
import type { EditorState } from './commands/EditorState';

export type EditorChangeListener = (content: PromptContent) => void;
export type EditorStateChangeListener = (state: EditorState) => void;

export interface PromptEditor {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  run(command: EditorCommand): boolean;
  getState(): EditorState;
  onStateChange(listener: EditorStateChangeListener): () => void;
  destroy(): void;
}
