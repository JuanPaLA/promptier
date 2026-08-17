import { toggleMark } from 'prosemirror-commands';

import { markDescriptors } from '../descriptors/marks/markDescriptorRegistry';
import type { CommandDescriptor } from './CommandDescriptor';
import { isMarkActive } from './markActivity';
import type { FormatCommand } from '../../../editor/commands/FormatCommand';

export const formatCommand: CommandDescriptor<FormatCommand> = {
  type: 'format',
  availableCommands: () =>
    markDescriptors.map(({ format }) => ({ type: 'format', format })),
  run: (view, command) => {
    const mark = view.state.schema.marks[command.format];
    if (!mark) return false;
    const executed = toggleMark(mark)(view.state, view.dispatch);
    if (executed) view.focus();
    return executed;
  },
  // A PM command called without dispatch is a dry run: true if it would apply.
  isEnabled: (state, command) => {
    const mark = state.schema.marks[command.format];
    return mark ? toggleMark(mark)(state) : false;
  },
  isActive: (state, command) => {
    const mark = state.schema.marks[command.format];
    return mark ? isMarkActive(state, mark) : false;
  },
};
