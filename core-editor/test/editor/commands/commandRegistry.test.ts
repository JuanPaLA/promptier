import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';

import { stateSnapshotFromEditorState } from '../../../src/engine/prosemirror/commands/commandRegistry';
import { promptSchema } from '../../../src/engine/prosemirror/descriptors/promptSchema';
import { toProseMirrorDoc } from '../../../src/engine/prosemirror/mapping/documentMapper';

describe('editor command state', () => {
  it('reports every catalogue command in the initial snapshot', () => {
    const doc = toProseMirrorDoc({ blocks: [] }, promptSchema);
    const state = EditorState.create({ schema: promptSchema, doc });

    expect(stateSnapshotFromEditorState(state)).toEqual({
      selection: { activeFormats: [], empty: true },
      commands: [
        {
          command: { type: 'format', format: 'bold' },
          enabled: true,
          active: false,
        },
        {
          command: { type: 'format', format: 'code' },
          enabled: true,
          active: false,
        },
      ],
    });
  });
});
