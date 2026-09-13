import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { parse } from '../src/prompt/serialization/parse';
import { serialize } from '../src/prompt/serialization/serialize';
import { sectionReferences } from '../src/prompt/references/sectionReferences';
import { ReferenceCommands } from '../src/engine/prosemirror/commands/ReferenceCommands';
import { referenceDecorations } from '../src/engine/prosemirror/plugins/referenceDecorations';
import { documentMapper, promptSchema } from '../src/engine/prosemirror/proseMirrorConfiguration';

const section = '<dialog_format_rules>\nExplain clearly.\n</dialog_format_rules>';

describe('section references', () => {
  it('preserves exact opening tags in code and never creates another section', () => {
    const text = '`<dialog_format_rules>`\n\n' + section;
    const content = parse(text);
    expect(content.blocks.map((block) => block.blockType)).toEqual(['paragraph', 'section']);
    expect(serialize(content)).toBe(text);
    expect(parse(serialize(content))).toEqual(content);
    expect(serialize(parse('`<dialog\\_format\\_rules>`\n\n' + section))).toBe(text);
  });

  it('resolves forward and nested targets and distinguishes missing and duplicate tags', () => {
    const resolver = sectionReferences(parse('<outer>\n' + section + '\n</outer>'));
    expect(resolver.resolve('<dialog_format_rules>')).toMatchObject({ status: 'resolved', target: { path: [0, 0] } });
    expect(resolver.resolve('<missing>')).toMatchObject({ status: 'missing' });
    expect(resolver.resolve('ordinary code')).toBeNull();
    expect(resolver.resolve('tools.weather')).toBeNull();
    expect(resolver.resolve('use <dialog_format_rules>')).toBeNull();
    expect(sectionReferences(parse(section + '\n\n' + section)).resolve('<dialog_format_rules>')).toMatchObject({ status: 'ambiguous' });
  });

  it('decorates only full code spans and refreshes resolution after a document replacement', () => {
    const plugin = referenceDecorations((doc) => [sectionReferences(documentMapper.fromDocument(doc))]);
    const initial = '`<dialog_format_rules>` and <dialog_format_rules> and `ordinary`\n\n' + section;
    const state = EditorState.create({ doc: documentMapper.toDocument(parse(initial)), plugins: [plugin] });
    const marks = plugin.getState(state)!.find();
    expect(marks).toHaveLength(1);
    expect((marks[0].type as any).attrs.class).toContain('resolved');
    const replacement = documentMapper.toDocument(parse('`<dialog_format_rules>`'));
    const next = state.apply(state.tr.replaceWith(0, state.doc.content.size, replacement.content));
    expect((plugin.getState(next)!.find()[0].type as any).attrs.class).toContain('missing');
  });

  it('inserts at the selection without creating sections, clears code typing, and supports undo/redo', () => {
    let state = EditorState.create({ doc: documentMapper.toDocument(parse('Follow these rules.\n\n' + section)), plugins: [history()] });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 8)));
    const before = serialize(documentMapper.fromDocument(state.doc));
    const dispatch = (transaction: Transaction) => { state = state.apply(transaction); };
    const view = { get state() { return state; }, dispatch, focus() {} } as unknown as EditorView;
    const commands = new ReferenceCommands(documentMapper);
    expect(commands.run(view, { type: 'reference.insert', text: '<missing>' })).toBe(false);
    expect(commands.run(view, { type: 'reference.insert', text: '<dialog_format_rules>' })).toBe(true);
    expect(serialize(documentMapper.fromDocument(state.doc))).toContain('Follow `<dialog_format_rules>` these rules.');
    expect((state.storedMarks ?? state.selection.$from.marks()).some((mark) => mark.type.name === 'code')).toBe(false);
    expect(undo(state, dispatch)).toBe(true);
    expect(serialize(documentMapper.fromDocument(state.doc))).toBe(before);
    expect(redo(state, dispatch)).toBe(true);
    expect(documentMapper.fromDocument(state.doc).blocks.filter((block) => block.blockType === 'section')).toHaveLength(1);
  });

  it('keeps insertion beside existing code as a separate reference span', () => {
    let state = EditorState.create({ doc: documentMapper.toDocument(parse('`code`\n\n' + section)) });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 5)));
    const view = {
      get state() { return state; },
      dispatch(transaction: Transaction) { state = state.apply(transaction); },
      focus() {},
    } as unknown as EditorView;
    new ReferenceCommands(documentMapper).run(view, { type: 'reference.insert', text: '<dialog_format_rules>' });
    expect(serialize(documentMapper.fromDocument(state.doc))).toContain('`code` `<dialog_format_rules>`');
  });

  it('does not offer insertion in section titles or code blocks', () => {
    const commands = new ReferenceCommands(documentMapper);
    for (const text of [section, '```\ncode\n```\n\n' + section]) {
      let state = EditorState.create({ schema: promptSchema, doc: documentMapper.toDocument(parse(text)) });
      state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, text === section ? 2 : 1)));
      expect(commands.commandStates(state).every((command) => !command.enabled)).toBe(true);
    }
  });
});
