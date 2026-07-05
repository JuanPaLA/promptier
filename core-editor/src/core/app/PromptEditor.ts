import { PromptContent } from '../domain/PromptContent';

export type EditorChangeListener = (content: PromptContent) => void;

export interface PromptEditor {
  getContent(): PromptContent;
  setContent(content: PromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
}
