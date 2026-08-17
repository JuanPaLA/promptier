import type { Format } from '../../prompt/model/Format';
import type { EditorCommand } from './EditorCommand';

export interface CommandState {
  readonly command: EditorCommand;
  enabled: boolean;
  active: boolean;
}

export interface EditorSelectionState {
  activeFormats: Format[];
  selectionEmpty: boolean;
  commands: readonly CommandState[];
}
