import type { EditorCommand } from './EditorCommand';
import type { VariableDefinition } from '../../prompt/variables/VariableSchema';

export interface CommandState {
  readonly command: EditorCommand;
  readonly enabled: boolean;
  readonly active?: boolean;
  readonly variable?: VariableDefinition;
}
