import { SystemPromptContent } from '../../domain/SystemPromptContent';

export type EditorChangeListener = (content: SystemPromptContent) => void;

export interface PromptEditor {
  mount(container: HTMLElement, initialContent: SystemPromptContent): void;
  getContent(): SystemPromptContent;
  setContent(content: SystemPromptContent): void;
  onChange(listener: EditorChangeListener): () => void;
  destroy(): void;
}
