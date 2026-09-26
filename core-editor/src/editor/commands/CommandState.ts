import type { EditorCommand } from './EditorCommand';
import type { VariableDefinition } from '../../prompt/variables/VariableSchema';
import type { ToolDefinition, ToolParameter } from '../../prompt/tools/ToolDefinition';

export interface CommandState {
  readonly command: EditorCommand;
  readonly enabled: boolean;
  readonly active?: boolean;
  readonly variable?: VariableDefinition;
  readonly tool?: ToolDefinition;
  readonly parameter?: ToolParameter;
}
