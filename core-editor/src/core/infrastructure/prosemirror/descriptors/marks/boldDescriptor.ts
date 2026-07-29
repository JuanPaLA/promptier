import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';
import { toggleFormatCommand } from '../../commands/toggleFormatCommand';
import { MarkDescriptor } from './MarkDescriptor';

export const boldDescriptor: MarkDescriptor = {
  format: 'bold',
  markSpec: boldMarkSpec(),
  commands: [toggleFormatCommand('format.bold', 'bold')],
  keymap: (schema) => ({ 'Mod-b': toggleMark(schema.marks.bold) }),
};

function boldMarkSpec(): MarkSpec {
  return {
    toDOM: () => ['strong', 0] as const,
    parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
  };
}
