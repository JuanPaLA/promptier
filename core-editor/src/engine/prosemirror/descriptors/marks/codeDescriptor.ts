import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';
import { MarkDescriptor } from './MarkDescriptor';

export const codeDescriptor: MarkDescriptor = {
  format: 'code',
  markSpec: codeMarkSpec(),
  keymap: (schema) => ({ 'Mod-e': toggleMark(schema.marks.code) }),
};

function codeMarkSpec(): MarkSpec {
  return {
    toDOM: () => ['code', 0] as const,
    parseDOM: [{ tag: 'code' }],
  };
}
