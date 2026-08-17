import { InputRule } from 'prosemirror-inputrules';
import { MarkSpec, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';

import type { Format } from '../../../../prompt/model/Format';

/**
 * Everything the ProseMirror infrastructure needs from a single format — the
 * mirror of BlockDescriptor, for marks.
 *
 * `format` doubles as the ProseMirror mark name, keeping domain formats and PM
 * marks 1:1 — that's what lets blockContentMapper read `mark.type.name` as a
 * Format.
 */
export interface MarkDescriptor {
  readonly format: Format;
  readonly markSpec: MarkSpec;
  keymap?(schema: Schema): Record<string, Command>;
  inputRules?(schema: Schema): InputRule[];
}
