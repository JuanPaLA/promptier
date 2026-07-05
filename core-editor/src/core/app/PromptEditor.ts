import { SystemPromptContent } from '../domain/SystemPromptContent';

export type EditorChangeListener = (content: SystemPromptContent) => void;

export interface PromptEditor {
  getContent(): SystemPromptContent;
  setContent(content: SystemPromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
}
