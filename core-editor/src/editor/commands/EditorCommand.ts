import type { Format } from '../../prompt/model/Format';

export interface FormatCommand {
  readonly type: 'format';
  readonly format: Format;
}

export type EditorCommand = FormatCommand;
