import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';
import { MarkDescriptor } from './MarkDescriptor';

const markSpec: MarkSpec = {
  toDOM: () => ['code', 0] as const,
  parseDOM: [{ tag: 'code' }],
};

export const codeMarkDescriptor: MarkDescriptor = {
  format: 'code',
  markSpec,
  keymap: (schema) => ({ 'Mod-e': toggleMark(schema.marks.code) }),
};
