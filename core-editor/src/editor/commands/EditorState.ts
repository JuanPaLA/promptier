import type { CommandState } from './CommandState'

export interface EditorState {
  readonly commands: readonly CommandState[];
}
