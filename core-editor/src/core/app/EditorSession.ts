import { PromptEditor } from './PromptEditor'

export interface EditorSession {
    editor: PromptEditor;
    destroy(): void;
}