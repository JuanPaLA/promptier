import { InputRule } from 'prosemirror-inputrules';
import { MarkSpec, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { Format } from '../../../domain/BlockContent';

/**
 * Everything the ProseMirror infrastructure needs from a single format: its
 * mark schema, and the editor plugins it contributes (toggle keymap today;
 * input rules later). The mirror of BlockDescriptor, for marks.
 *
 * `format` doubles as the ProseMirror mark name, keeping domain formats and
 * PM marks 1:1 — that's what lets InlineMapper cast `mark.type.name` to Format.
 */
export interface MarkDescriptor {
  readonly format: Format;
  readonly markSpec: MarkSpec;
  keymap?(schema: Schema): Record<string, Command>;
  inputRules?(schema: Schema): InputRule[];
}
