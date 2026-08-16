import type { Format } from '../../prompt/model/Format';
import type { CommandId } from './EditorCommand';

export interface CommandState {
  enabled: boolean;
  active: boolean;
}

export interface EditorSelectionState {
  activeFormats: Format[];
  selectionEmpty: boolean;
  commands: Record<CommandId, CommandState>;
}
