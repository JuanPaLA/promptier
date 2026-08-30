import type { Format } from '../../prompt/model/Format';
import type { CommandState } from './CommandState';

export interface EditorSelectionSnapshot {
  readonly activeFormats: readonly Format[];
  readonly empty: boolean;
}

export interface EditorStateSnapshot {
  readonly selection: EditorSelectionSnapshot;
  readonly commands: readonly CommandState[];
}
