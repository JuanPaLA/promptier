import { inputRules } from 'prosemirror-inputrules';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState as ProseMirrorState } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
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

  it.each([
    ['bold', '**bold*', '*'],
    ['italic', '_italic', '_'],
    ['code', '`code', '`'],
  ] as const)('applies %s when its serialized delimiters are typed', (format, before, typed) => {
    const result = typeTextWithInputRules(plainDocument(before), typed);

    expect(result.handled).toBe(true);
    expect(documentMapper.fromDocument(result.state.doc)).toEqual({
      blocks: [
        {
          blockType: 'paragraph',
          content: [{ text: format, formats: [format] }],
        },
      ],
    });
  });

  it('preserves an existing inner format when typed delimiters add an outer format', () => {
    const document = promptSchema.nodes.doc.create(null, [
      promptSchema.nodes.paragraph.create(null, [
        promptSchema.text('**'),
        promptSchema.text('nested', [promptSchema.marks.italic.create()]),
        promptSchema.text('*'),
      ]),
    ]);

    const result = typeTextWithInputRules(document, '*');

    expect(result.handled).toBe(true);
    expect(documentMapper.fromDocument(result.state.doc)).toEqual({
      blocks: [
        {
          blockType: 'paragraph',
          content: [{ text: 'nested', formats: ['bold', 'italic'] }],
        },
      ],
    });
  });

  it('keeps escaped delimiters literal', () => {
    const result = typeTextWithInputRules(plainDocument('\\_literal'), '_');

    expect(result.handled).toBe(false);
    expect(result.state.doc.textContent).toBe('\\_literal');
  });
});

function typeTextWithInputRules(
  document: ProseMirrorNode,
  text: string,
): { handled: boolean; state: ProseMirrorState } {
  const plugin = inputRules({ rules: markRegistry.inputRules(promptSchema) });
  const cursor = document.content.size - 1;
  let state = ProseMirrorState.create({
    schema: promptSchema,
    doc: document,
    selection: TextSelection.create(document, cursor),
    plugins: [plugin],
  });
  const view = {
    get state() {
      return state;
    },
    composing: false,
    dispatch(transaction: Transaction) {
      state = state.apply(transaction);
    },
  } as unknown as EditorView;
  const handleTextInput = plugin.props.handleTextInput;
  const handled =
    handleTextInput?.call(
      plugin,
      view,
      cursor,
      cursor,
      text,
      () => state.tr.insertText(text, cursor, cursor),
    ) ?? false;

  return { handled, state };
}

function plainDocument(text: string): ProseMirrorNode {
  return promptSchema.nodes.doc.create(null, [
    promptSchema.nodes.paragraph.create(null, promptSchema.text(text)),
  ]);
}
