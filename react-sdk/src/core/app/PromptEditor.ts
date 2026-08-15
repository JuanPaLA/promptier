import type {
  CommandId,
  EditorCommand,
  EditorSelectionState,
  PromptContent,
} from 'core-editor';

export type Unsubscribe = () => void;
export type PromptListener = (prompt: string) => void;
export type SelectionListener = (selection: EditorSelectionState) => void;

export interface PromptEditor {
  getPrompt(): string;
  setPrompt(prompt: string): void;
  getContent(): PromptContent;
  run(command: EditorCommand): void;
  availableCommands(): CommandId[];
  selectionState(): EditorSelectionState | null;
  onPromptChanged(listener: PromptListener): Unsubscribe;
  onSelectionChanged(listener: SelectionListener): Unsubscribe;
}
