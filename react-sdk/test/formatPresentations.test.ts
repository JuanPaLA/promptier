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

describe('reference presentations', () => {
  it('keeps references in their picker and retains command enablement', () => {
    const command = { type: 'reference.insert', text: '<rules>' } as const;
    const model = PromptEditorVM.from({
      prompt: '', content: { blocks: [] },
      state: { commands: [{ command, enabled: false }] },
    });
    expect(model.blockCommands).toEqual([]);
    expect(model.formatCommands).toEqual([]);
    expect(model.referenceCommands).toEqual([expect.objectContaining({ label: '<rules>', disabled: true })]);
    expect(model.commandFor(model.referenceCommands[0].id)).toEqual(command);
  });
});

describe('variable presentations', () => {
  it('keeps variable commands and metadata in a separate picker', () => {
    const command = { type: 'variable.insert', path: 'cliente.nombre' } as const;
    const model = PromptEditorVM.from({ prompt: '', content: { blocks: [] }, state: { commands: [{
      command, enabled: true,
      variable: { path: command.path, types: ['string'], required: false, insertable: true, description: 'Nombre del cliente' },
    }] } });
    expect(model.variableCommands).toEqual([expect.objectContaining({ label: 'cliente.nombre (string)', description: 'Nombre del cliente — Optional', disabled: false })]);
    expect(model.referenceCommands).toEqual([]);
    expect(model.commandFor(model.variableCommands[0].id)).toEqual(command);
  });
});

describe('tool presentations', () => {
  it('lists tools and their parameters in their own picker', () => {
    const tool = { name: 'get_weather', description: 'Current weather' };
    const parameter = { tool: 'get_weather', path: 'location', types: ['string'] as const, required: true, description: 'City name' };
    const model = PromptEditorVM.from({ prompt: '', content: { blocks: [] }, state: { commands: [
      { command: { type: 'tool.insert', tool: 'get_weather' }, enabled: true, tool },
      { command: { type: 'tool.insert', tool: 'get_weather', parameter: 'location' }, enabled: false, tool, parameter },
    ] } });
    expect(model.toolCommands).toEqual([
      expect.objectContaining({ id: 'tool.insert.get_weather', label: 'get_weather', description: 'Current weather', disabled: false, depth: 0 }),
      expect.objectContaining({ id: 'tool.insert.get_weather.location', label: 'location (string)', description: 'City name — Required', disabled: true, depth: 1 }),
    ]);
    expect(model.referenceCommands).toEqual([]);
    expect(model.variableCommands).toEqual([]);
    expect(model.commandFor('tool.insert.get_weather.location')).toEqual({ type: 'tool.insert', tool: 'get_weather', parameter: 'location' });
  });
});
