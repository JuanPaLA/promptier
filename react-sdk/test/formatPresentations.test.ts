import { describe, expect, it } from 'vitest';

import { PromptEditorVM } from '../src/ui/view/PromptEditorVM';

describe('format presentations', () => {
  it('projects italic command state without format-specific view-model logic', () => {
    const viewModel = PromptEditorVM.from({
      prompt: '',
      content: { blocks: [] },
      state: {
        commands: [
          {
            command: { type: 'format', format: 'italic' },
            enabled: true,
            active: true,
          },
        ],
      },
    });

    expect(viewModel.formatCommands).toEqual([
      expect.objectContaining({
        id: 'format.italic',
        label: 'Italic',
        glyph: 'I',
        disabled: false,
        active: true,
      }),
    ]);
    expect(viewModel.commandFor('format.italic')).toEqual({
      type: 'format',
      format: 'italic',
    });
  });

  it('uses stable identifiers for every format presentation', () => {
    const viewModel = PromptEditorVM.from({
      prompt: '',
      content: { blocks: [] },
      state: {
        commands: [
          { command: { type: 'format', format: 'bold' }, enabled: true },
          { command: { type: 'format', format: 'italic' }, enabled: true },
          { command: { type: 'format', format: 'code' }, enabled: true },
        ],
      },
    });

    expect(viewModel.formatCommands.map(({ id }) => id)).toEqual([
      'format.bold',
      'format.italic',
      'format.code',
    ]);
  });
});

describe('block presentations', () => {
  it('projects descriptor-provided insertion commands without block-specific logic', () => {
    const viewModel = PromptEditorVM.from({
      prompt: '',
      content: { blocks: [] },
      state: {
        commands: [
          {
            command: {
              type: 'block.insert',
              block: { blockType: 'quote', content: [] },
            },
            enabled: true,
          },
        ],
      },
    });

    expect(viewModel.blockCommands).toEqual([
      expect.objectContaining({
        id: 'block.insert.quote',
        group: 'block',
        label: 'Quote',
        glyph: '“',
        disabled: false,
        active: false,
      }),
    ]);
    expect(viewModel.commandFor('block.insert.quote')).toEqual({
      type: 'block.insert',
      block: { blockType: 'quote', content: [] },
    });
  });
});
