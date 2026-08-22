import type { EditorCommand } from './EditorCommand'

export interface CommandState {
    readonly command: EditorCommand;
    readonly enabled: boolean;
    readonly active: boolean;
}
