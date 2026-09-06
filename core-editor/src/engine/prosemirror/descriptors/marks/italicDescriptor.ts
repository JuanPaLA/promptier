import { toggleMark } from 'prosemirror-commands';
import type { MarkSpec } from 'prosemirror-model';
import type { MarkDescriptor } from './MarkDescriptor';

export const italicDescriptor: MarkDescriptor<'italic'> = {
  format: 'italic',
  markSpec: italicMarkSpec(),
  editorStyles: '.ProseMirror em { font-style: italic; }',
  keymap: (schema) => ({ 'Mod-i': toggleMark(schema.marks.italic) }),
};

function italicMarkSpec(): MarkSpec {
  return {
    toDOM: () => ['em', 0] as const,
    parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
  };
}
