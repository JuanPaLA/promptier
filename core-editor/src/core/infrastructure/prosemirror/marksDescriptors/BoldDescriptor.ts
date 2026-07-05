import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';
import { MarkDescriptor } from './MarkDescriptor';

const markSpec: MarkSpec = {
  toDOM: () => ['strong', 0] as const,
  parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
};

export const boldMarkDescriptor: MarkDescriptor = {
  format: 'bold',
  markSpec,
  keymap: (schema) => ({ 'Mod-b': toggleMark(schema.marks.bold) }),
};
