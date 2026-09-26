import type { InsertReferenceCommand } from './InsertReferenceCommand';
import type { InsertVariableCommand } from './InsertVariableCommand';
import type { FormatCommand } from './FormatCommand';
import type { InsertBlockCommand } from './InsertBlockCommand';
import type { NavigateCommand } from './NavigateCommand';

export type EditorCommand =
    FormatCommand |
    InsertBlockCommand |
    NavigateCommand |
    InsertReferenceCommand |
    InsertVariableCommand
;
