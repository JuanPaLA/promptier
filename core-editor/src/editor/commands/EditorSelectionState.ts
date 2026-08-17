import type { Format } from '../../prompt/model/Format';
import type { CommandState } from './CommandState';

export interface EditorSelectionState {
  activeFormats: Format[];
  selectionEmpty: boolean;
  commands: readonly CommandState[];
}
