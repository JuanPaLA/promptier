import { EditorState as ProseMirrorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';

import type { PromptContent } from '../src/prompt/model/PromptContent';
import { inlineFormatRegistry } from '../src/prompt/serialization/formats/inlineFormatCodecs';
import { FormatCommands } from '../src/engine/prosemirror/commands/FormatCommands';
import {
  documentMapper,
  markRegistry,
  promptSchema,
} from '../src/engine/prosemirror/proseMirrorConfiguration';

describe('format contributions', () => {
  it('registers the same formats for serialization and ProseMirror', () => {
    const serializedFormats = inlineFormatRegistry.all().map(({ format }) => format);

    expect(inlineFormatRegistry.canonicalize(serializedFormats)).toEqual(serializedFormats);
    expect(markRegistry.all().map(({ format }) => format)).toEqual(serializedFormats);
  });

  it('publishes a command for every registered mark', () => {
    const commands = new FormatCommands(markRegistry.all().map(({ format }) => format));
    const state = ProseMirrorState.create({ schema: promptSchema });

    expect(commands.commandStates(state).map(({ command }) => command)).toEqual(
      markRegistry.all().map(({ format }) => ({ type: 'format', format })),
    );
  });

  it('maps italic between the domain and ProseMirror', () => {
    const content: PromptContent = {
      blocks: [
        {
          blockType: 'paragraph',
          content: [{ text: 'emphasis', formats: ['italic'] }],
        },
      ],
    };

    expect(documentMapper.fromDocument(documentMapper.toDocument(content))).toEqual(content);
  });

  it('collects descriptor-owned editor styles', () => {
    expect(markRegistry.editorStyles().join('\n')).toContain('font-style: italic');
  });
});
