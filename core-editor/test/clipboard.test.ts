import type { EditorView } from 'prosemirror-view';
import { EditorState as ProseMirrorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';

import { documentMapper, promptSchema } from '../src/engine/prosemirror/proseMirrorConfiguration';
import { PromptClipboardPlugin } from '../src/engine/prosemirror/plugins/PromptClipboardPlugin';
import type { PromptContent } from '../src/prompt/model/PromptContent';
import { serialize } from '../src/prompt/serialization/serialize';

describe('pasting plain text', () => {
  it('reads markdown headings as headings, not as paragraphs starting with "#"', () => {
    const source = '# Quién eres\n\nSos el agente de Aguas SRL (”Nataclor”).';

    expect(pastedInto(emptyDocument(), source)).toBe(source);
  });

  it('keeps an escaped marker as literal text', () => {
    const source = '\\# not a heading';

    expect(pastedInto(emptyDocument(), source)).toBe(source);
  });

  it('reads sections, lists and quotes', () => {
    const source = '<reglas>\nRegla **uno**\n\n- a\n- b\n\n> citado\n</reglas>';

    expect(pastedInto(emptyDocument(), source)).toBe(source);
  });

  it('restores a prompt copied with the copy button exactly', () => {
    const content: PromptContent = {
      blocks: [
        { blockType: 'heading', level: 1, content: [{ text: 'Quién eres' }] },
        { blockType: 'paragraph', content: [{ text: 'Hola ' }, { text: 'mundo', formats: ['bold'] }] },
        { blockType: 'orderedList', items: [[{ text: 'uno' }], [{ text: 'dos' }]] },
        { blockType: 'codeBlock', code: 'const a = 1;' },
      ],
    };

    expect(pastedInto(emptyDocument(), serialize(content))).toBe(serialize(content));
  });

  it('merges a single line into the paragraph at the cursor', () => {
    const state = stateWith({ blocks: [{ blockType: 'paragraph', content: [{ text: 'before after' }] }] }, 8);

    expect(pastedInto(state, 'pasted ')).toBe('before pasted after');
  });

  it('leaves section titles to the default paste', () => {
    const state = stateWith(
      { blocks: [{ blockType: 'section', title: 'reglas', children: [{ blockType: 'paragraph', content: [] }] }] },
      2,
    );

    expect(sliceFor(state, '# title')).toBeNull();
  });

  it('leaves whitespace-only text to the default paste', () => {
    expect(sliceFor(emptyDocument(), '  \n  ')).toBeNull();
  });
});

function emptyDocument(): ProseMirrorState {
  return stateWith({ blocks: [] }, 1);
}

function stateWith(content: PromptContent, cursor: number): ProseMirrorState {
  const state = ProseMirrorState.create({ schema: promptSchema, doc: documentMapper.toDocument(content) });
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, cursor)));
}

function sliceFor(state: ProseMirrorState, text: string) {
  const plugin = new PromptClipboardPlugin(documentMapper).plugin;
  const parse = plugin.props.clipboardTextParser!;
  return parse.call(plugin, text, state.selection.$from, false, {} as EditorView) ?? null;
}

function pastedInto(state: ProseMirrorState, text: string): string {
  const slice = sliceFor(state, text);
  const pasted = state.apply(state.tr.replaceSelection(slice!));
  return serialize(documentMapper.fromDocument(pasted.doc));
}
