import type { PromptContent } from '../prompt/model/PromptContent';
import type { EditorCommand } from './commands/EditorCommand';
import type { EditorStateSnapshot } from './commands/EditorStateSnapshot';

export type EditorChangeListener = (content: PromptContent) => void;
export type EditorStateChangeListener = (state: EditorStateSnapshot) => void;

export interface PromptEditor {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  run(command: EditorCommand): boolean;
  getState(): EditorStateSnapshot;
  onStateChange(listener: EditorStateChangeListener): () => void;
  destroy(): void;
}
