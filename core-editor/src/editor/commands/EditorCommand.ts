import type { FormatCommand } from './FormatCommand';
import type { InsertBlockCommand } from './InsertBlockCommand';
import type { NavigateCommand } from './NavigateCommand';

export type EditorCommand = FormatCommand | InsertBlockCommand | NavigateCommand;
