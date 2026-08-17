import type { EditorCommand } from './EditorCommand'

export interface CommandState {
    readonly command: EditorCommand;
    enabled: boolean;
    active: boolean;
}