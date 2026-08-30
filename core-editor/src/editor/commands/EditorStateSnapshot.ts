import type { CommandState } from './CommandState'

export interface EditorStateSnapshot {
  readonly commands: readonly CommandState[];
}
