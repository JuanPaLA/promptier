import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { VariableCatalog } from '../src/prompt/variables/VariableCatalog';
import { VariableAnalysis } from '../src/prompt/variables/VariableAnalysis';
import type { VariableSchema } from '../src/prompt/variables/VariableSchema';
import { TemplateSyntax } from '../src/prompt/templates/TemplateSyntax';
import { VariableDecorations } from '../src/engine/prosemirror/plugins/VariableDecorations';
import { VariableCommands } from '../src/engine/prosemirror/commands/VariableCommands';
import { TemplateFormatting } from '../src/engine/prosemirror/plugins/TemplateFormatting';
import { documentMapper, promptSchema } from '../src/engine/prosemirror/proseMirrorConfiguration';
import { parse } from '../src/prompt/serialization/parse';
import { serialize } from '../src/prompt/serialization/serialize';
import { parseInline, serializeInline } from '../src/prompt/serialization/inlineCodec';

const schema: VariableSchema = {
  type: 'object', additionalProperties: false, required: ['cliente'],
  properties: {
    cliente: { type: 'object', additionalProperties: false, required: ['nombre_completo'], properties: {
      nombre_completo: { type: ['string', 'null'], description: 'Nombre del cliente' },
      vip: { type: 'boolean' },
    } },
    atributos: { type: 'object' },
    productos: { type: 'array', items: { type: 'object', properties: { nombre: { type: 'string' } } } },
  },
};

describe('variable catalog', () => {
  it('resolves nested paths and retains type, description and required metadata', () => {
    expect(new VariableCatalog(schema).resolve('cliente.nombre_completo')).toMatchObject({ status: 'recognized', definition: {
      types: ['string', 'null'], required: true, description: 'Nombre del cliente', insertable: true,
    } });
    expect(new VariableCatalog(schema).resolve('cliente.vip').definition?.required).toBe(false);
  });

  it('distinguishes missing information from a contradiction', () => {
    expect(new VariableCatalog().resolve('cliente.nombre').status).toBe('unverified');
    const catalog = new VariableCatalog(schema);
    expect(catalog.resolve('cliente.unknown').status).toBe('unknown');
    expect(catalog.resolve('cliente.vip.value').status).toBe('unknown');
    expect(catalog.resolve('atributos.anything').status).toBe('unverified');
    expect(catalog.resolve('productos.nombre').status).toBe('unknown');
    expect(catalog.resolve('toString').status).toBe('unknown');
  });

  it('respects typed additional properties without claiming they are declared', () => {
    const catalog = new VariableCatalog({ type: 'object', additionalProperties: { type: 'object', properties: { id: { type: 'number' } } } });
    expect(catalog.resolve('dynamic.id')).toMatchObject({ status: 'unverified', definition: { types: ['number'] } });
  });

  it('lists containers without inventing item paths or bracket syntax', () => {
    const definitions = new VariableCatalog(schema).definitions();
    expect(definitions.map((entry) => entry.path)).toEqual(['cliente', 'cliente.nombre_completo', 'cliente.vip', 'atributos', 'productos']);
    expect(definitions.filter((entry) => entry.insertable).map((entry) => entry.path)).toEqual(['cliente.nombre_completo', 'cliente.vip']);
    expect(new VariableCatalog({ properties: { 'a.b': { type: 'string' }, 'with space': { type: 'string' } } }).definitions()).toEqual([]);
  });
});

describe('template syntax and variable analysis', () => {
  it('recognizes only complete simple paths and preserves offsets', () => {
    const text = 'Hi {{cliente.nombre_completo}} {{ missing }} {{ x | default("}}") }} {{ arr[0] }} {{ unfinished';
    const mentions = new VariableAnalysis(new VariableCatalog(schema)).mentions(text);
    expect(mentions.map((mention) => [mention.path, mention.status])).toEqual([['cliente.nombre_completo', 'recognized'], ['missing', 'unknown']]);
    expect(text.slice(mentions[0].start, mentions[0].end)).toBe('{{cliente.nombre_completo}}');
    expect(new TemplateSyntax().tokens(text)).toHaveLength(5);
  });

  it('does not report local variables as unknown and ignores comments and verbatim', () => {
    const text = '{# {{ missing }} #}{% for item in productos %}{{ item.nombre }}{% endfor %}{% verbatim %}{{ missing }}{% endverbatim %}';
    expect(new VariableAnalysis(new VariableCatalog(schema)).mentions(text).map((mention) => [mention.path, mention.status])).toEqual([['item.nombre', 'unverified']]);
  });

  it('does not mistake Pebble literals for context variables', () => {
    expect(new VariableAnalysis(new VariableCatalog(schema)).mentions('{{ true }} {{ false }} {{ null }} {{ none }} {{ 42 }}')).toEqual([]);
  });

  it.each([
    'Hello {{ cliente.nombre_completo }}.',
    '{{  cliente.nombre_completo  }}',
    '{{ value | default("**fallback** _text_ `code` \\\\ path }}") }}',
    '{{ {"key": {"nested": "value"}} }}',
    '{# **keep**\n\n<example>\n{{ example }} #}',
    '{% verbatim %}\n# literal heading\n\n<example>\n{{ literal_name }}\n</example>\n{% endverbatim %}',
    '{% if cliente.vip %}\nHello {{ cliente.nombre_completo }}.\n{% endif %}',
    '{{ "first\n\nsecond" }}',
    'Still typing {{ nombre_con_guiones_',
    '> Hello {{ cliente.nombre_completo }}\n> {% if cliente.vip %}\n> VIP\n> {% endif %}',
    '# {{ "first\nsecond" }}',
    '- {{ "first\nsecond" }}',
    '```\n{{ cliente.nombre_completo }}\n```',
    '```\n{{ unfinished\n```',
  ])('preserves template text through parse/serialize: %s', (text) => {
    expect(serialize(parse(text))).toBe(text);
    expect(parse(serialize(parse(text)))).toEqual(parse(text));
  });

  it('supports surrounding formatting without escaping expression contents', () => {
    const text = '**{{ cliente.nombre_completo }}** and _{{ x | default("a_b") }}_';
    expect(serializeInline(parseInline(text))).toBe(text);
  });

  it('does not insert markdown delimiters inside template source across formatting boundaries', () => {
    const content = [{ text: '{{ cliente.' }, { text: 'nombre_completo', formats: ['bold' as const] }, { text: ' }}' }];
    expect(serializeInline(content)).toBe('{{ cliente.nombre_completo }}');
  });
});

describe('variable editor integration', () => {
  it('updates schema decorations without document changes, selection changes or undo entries', () => {
    const variables = new VariableDecorations();
    const harness = new EditorHarness('Hello {{ cliente.nombre_completo }}.', variables);
    const original = harness.state.doc;
    const selection = harness.state.selection;
    expect(harness.statuses()).toEqual(['unverified']);
    variables.setSchema(harness.view, schema);
    expect(harness.statuses()).toEqual(['recognized']);
    variables.setSchema(harness.view, { type: 'object', additionalProperties: false });
    expect(harness.statuses()).toEqual(['unknown']);
    variables.setSchema(harness.view, undefined);
    expect(harness.statuses()).toEqual(['unverified']);
    expect(harness.state.doc.eq(original)).toBe(true);
    expect(harness.state.selection.eq(selection)).toBe(true);
    expect(harness.changed).toBe(0);
    expect(undo(harness.state, harness.view.dispatch)).toBe(false);
  });

  it('inserts at the selection and supports undo and redo', () => {
    const variables = new VariableDecorations();
    const harness = new EditorHarness('Hello friend.', variables);
    variables.setSchema(harness.view, schema);
    harness.select(7, 13);
    const commands = new VariableCommands(() => variables.catalog);
    expect(commands.run(harness.view, { type: 'variable.insert', path: 'missing' })).toBe(false);
    expect(commands.run(harness.view, { type: 'variable.insert', path: 'productos' })).toBe(false);
    expect(commands.run(harness.view, { type: 'variable.insert', path: 'cliente.nombre_completo' })).toBe(true);
    expect(harness.prompt()).toBe('Hello {{ cliente.nombre_completo }}.');
    expect(undo(harness.state, harness.view.dispatch)).toBe(true);
    expect(harness.prompt()).toBe('Hello friend.');
    expect(redo(harness.state, harness.view.dispatch)).toBe(true);
    expect(harness.prompt()).toBe('Hello {{ cliente.nombre_completo }}.');
  });

  it('does not insert inside an expression or section title', () => {
    const variables = new VariableDecorations();
    const harness = new EditorHarness('{{ cliente.vip }}\n\n<section>\nText\n</section>', variables);
    variables.setSchema(harness.view, schema);
    const commands = new VariableCommands(() => variables.catalog);
    harness.select(4);
    expect(commands.commandStates(harness.state).every((entry) => !entry.enabled)).toBe(true);
    harness.select(harness.state.doc.firstChild!.nodeSize + 2);
    expect(commands.commandStates(harness.state).every((entry) => !entry.enabled)).toBe(true);
  });

  it('recognizes variables in code, keeps comments literal across blocks and remains conservative around directives', () => {
    const variables = new VariableDecorations();
    const harness = new EditorHarness('```\n{{ cliente.vip }}\n```\n\n{% for item in productos %}\n\n{{ item.nombre }}\n\n{% endfor %}', variables);
    variables.setSchema(harness.view, schema);
    expect(harness.statuses()).toEqual(['unverified', 'unverified']);
  });

  it('keeps template source intact when formatting part of a name, without moving selection', () => {
    const harness = new EditorHarness('{{ cliente.nombre_completo }}', new VariableDecorations());
    harness.select(12, 27);
    const selection = harness.state.selection;
    harness.view.dispatch(harness.state.tr.addMark(12, 27, promptSchema.marks.bold.create()));
    expect(harness.prompt()).toBe('{{ cliente.nombre_completo }}');
    expect(harness.state.selection.eq(selection)).toBe(true);
    expect(harness.state.doc.rangeHasMark(1, 29, promptSchema.marks.bold)).toBe(false);
  });

  it('keeps schemas independent between instances', () => {
    const first = new VariableDecorations();
    const second = new VariableDecorations();
    const a = new EditorHarness('{{ cliente.vip }}', first);
    const b = new EditorHarness('{{ cliente.vip }}', second);
    first.setSchema(a.view, schema);
    expect(a.statuses()).toEqual(['recognized']);
    expect(b.statuses()).toEqual(['unverified']);
  });
});

class EditorHarness {
  state: EditorState;
  readonly view: EditorView;
  changed = 0;

  constructor(text: string, private readonly variables: VariableDecorations) {
    this.state = EditorState.create({ schema: promptSchema, doc: documentMapper.toDocument(parse(text)), plugins: [history(), variables.plugin, new TemplateFormatting().plugin] });
    const harness = this;
    this.view = {
      get state() { return harness.state; },
      dispatch(transaction: Transaction) { harness.changed += Number(transaction.docChanged); harness.state = harness.state.apply(transaction); },
      focus() {},
    } as unknown as EditorView;
  }

  select(from: number, to = from): void { this.view.dispatch(this.state.tr.setSelection(TextSelection.create(this.state.doc, from, to))); }

  prompt(): string { return serialize(documentMapper.fromDocument(this.state.doc)); }

  statuses(): string[] {
    return this.variables.plugin.getState(this.state)!.find().map((decoration) => (decoration as any).type.attrs.class.split('promptier-variable-')[1]);
  }
}
