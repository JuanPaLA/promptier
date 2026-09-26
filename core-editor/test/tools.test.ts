import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { history, undo } from 'prosemirror-history';
import { ToolCatalog } from '../src/prompt/tools/ToolCatalog';
import type { ToolDefinition } from '../src/prompt/tools/ToolDefinition';
import { toolReferences } from '../src/prompt/references/toolReferences';
import { ReferenceDecorationsPlugin } from '../src/engine/prosemirror/plugins/ReferenceDecorationsPlugin';
import { ToolCommands } from '../src/engine/prosemirror/commands/ToolCommands';
import { documentMapper, promptSchema } from '../src/engine/prosemirror/proseMirrorConfiguration';
import { parse } from '../src/prompt/serialization/parse';
import { serialize } from '../src/prompt/serialization/serialize';

const tools: ToolDefinition[] = [
  { name: 'get_weather', description: 'Current weather for a city', parameters: {
    type: 'object', required: ['location'], additionalProperties: { type: 'string' },
    properties: {
      location: { type: 'string', description: 'City name' },
      units: { type: 'string' },
      options: { type: 'object', properties: { detailed: { type: 'boolean' } } },
      days: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' } } } },
    },
  } },
  { name: 'search_places', parameters: { type: 'object', properties: { location: { type: 'string' }, query: { type: 'string' } } } },
  { name: 'ping' },
];

describe('tool catalog', () => {
  const catalog = new ToolCatalog(tools);

  it('names tools by their exact name, with or without an empty call', () => {
    expect(catalog.resolve('get_weather')).toMatchObject({ kind: 'tool', tool: { name: 'get_weather' } });
    expect(catalog.resolve('get_weather()')).toMatchObject({ kind: 'tool', tool: { name: 'get_weather' } });
    expect(catalog.resolve('ping')).toMatchObject({ kind: 'tool', tool: { name: 'ping' } });
    expect(catalog.resolve('get_weather(location)')).toBeNull();
    expect(catalog.resolve('Get_weather')).toBeNull();
    expect(catalog.resolve('weather')).toBeNull();
  });

  it('names parameters qualified by their tool, including nested object paths', () => {
    expect(catalog.resolve('get_weather.location')).toMatchObject({ kind: 'parameter', parameters: [
      { tool: 'get_weather', path: 'location', types: ['string'], required: true, description: 'City name' },
    ] });
    expect(catalog.resolve('get_weather.options.detailed')).toMatchObject({ kind: 'parameter', parameters: [{ path: 'options.detailed' }] });
    expect(catalog.resolve('get_weather.query')).toBeNull();
  });

  it('names bare parameters after every tool that declares them', () => {
    expect(catalog.resolve('query')).toMatchObject({ kind: 'parameter', parameters: [{ tool: 'search_places' }] });
    expect(catalog.resolve('location')).toMatchObject({ kind: 'parameter', parameters: [{ tool: 'get_weather' }, { tool: 'search_places' }] });
    expect(catalog.resolve('options.detailed')).toMatchObject({ kind: 'parameter', parameters: [{ tool: 'get_weather' }] });
    expect(catalog.resolve('location()')).toBeNull();
  });

  it('only names explicitly declared parameters', () => {
    expect(catalog.resolve('get_weather.anything')).toBeNull();
    expect(catalog.resolve('get_weather.days.date')).toBeNull();
    expect(catalog.resolve('days.date')).toBeNull();
  });

  it('keeps the first of several tools sharing a name', () => {
    const duplicated = new ToolCatalog([{ name: 'ping', description: 'first' }, { name: 'ping', description: 'second' }]);
    expect(duplicated.tools()).toEqual([{ name: 'ping', description: 'first' }]);
  });
});

describe('tool references', () => {
  const resolver = toolReferences(new ToolCatalog(tools));

  it('describes a tool by its signature and description', () => {
    expect(resolver.resolve('get_weather()')).toEqual({
      kind: 'tool', text: 'get_weather()', status: 'resolved',
      detail: 'get_weather(location: string, units?: string, options?: object, days?: array) — Current weather for a city',
    });
    expect(resolver.resolve('ping')?.detail).toBe('ping()');
  });

  it('describes a parameter once per tool that declares it', () => {
    expect(resolver.resolve('location')).toMatchObject({
      kind: 'parameter', status: 'resolved',
      detail: 'get_weather.location: string (required) — City name\nsearch_places.location: string (optional)',
    });
  });

  it('leaves anything the catalog does not declare unresolved', () => {
    expect(resolver.resolve('<rules>')).toBeNull();
    expect(resolver.resolve('unknown_tool')).toBeNull();
  });
});

describe('tool reference decorations', () => {
  const text = 'Call `get_weather` with `location`. `unknown_tool` `get_weather()` `search_places.query`'
    + '\n\nPlain get_weather stays text.\n\n```\nget_weather\n```\n\nSee <rules>.\n\n<rules>\nText\n</rules>';

  it('decorates only whole code spans the catalog resolves, as non-navigable references', () => {
    const harness = new EditorHarness(text);
    expect(harness.decorations().map(({ reference, kind }) => [reference, kind])).toEqual([
      ['get_weather', 'tool'], ['location', 'parameter'], ['get_weather()', 'tool'], ['search_places.query', 'parameter'], ['<rules>', 'section'],
    ]);
    const [tool] = harness.decorations();
    expect(tool.attrs.title).toContain('get_weather(location: string');
    expect(tool.attrs.role).toBeUndefined();
  });

  it('refreshes when the tools change, without document changes or undo entries', () => {
    const harness = new EditorHarness(text, []);
    const original = harness.state.doc;
    expect(harness.decorations().map(({ kind }) => kind)).toEqual(['section']);
    harness.references.setTools(harness.view, tools);
    expect(harness.decorations()).toHaveLength(5);
    harness.references.setTools(harness.view, [{ name: 'unknown_tool' }]);
    expect(harness.decorations().map(({ reference }) => reference)).toEqual(['unknown_tool', '<rules>']);
    expect(harness.state.doc.eq(original)).toBe(true);
    expect(harness.changed).toBe(0);
    expect(undo(harness.state, harness.view.dispatch)).toBe(false);
  });
});

describe('tool insertion', () => {
  it('inserts a tool as its own code span and stops code formatting afterwards', () => {
    const harness = new EditorHarness('Call here.');
    harness.select(6);
    expect(harness.commands.run(harness.view, { type: 'tool.insert', tool: 'get_weather' })).toBe(true);
    expect(harness.prompt()).toBe('Call `get_weather` here.');
    expect((harness.state.storedMarks ?? harness.state.selection.$from.marks()).some((mark) => mark.type.name === 'code')).toBe(false);
    expect(undo(harness.state, harness.view.dispatch)).toBe(true);
    expect(harness.prompt()).toBe('Call here.');
  });

  it('inserts the shortest text naming exactly the chosen parameter', () => {
    const harness = new EditorHarness('Use ');
    harness.select(5);
    harness.commands.run(harness.view, { type: 'tool.insert', tool: 'search_places', parameter: 'query' });
    harness.commands.run(harness.view, { type: 'tool.insert', tool: 'search_places', parameter: 'location' });
    expect(harness.prompt()).toBe('Use `query` `search_places.location`');
  });

  it('refuses tools and parameters the catalog does not declare', () => {
    const harness = new EditorHarness('Call here.');
    harness.select(6);
    expect(harness.commands.run(harness.view, { type: 'tool.insert', tool: 'unknown_tool' })).toBe(false);
    expect(harness.commands.run(harness.view, { type: 'tool.insert', tool: 'get_weather', parameter: 'query' })).toBe(false);
    expect(harness.commands.run(harness.view, { type: 'tool.insert', tool: 'get_weather', parameter: 'days.date' })).toBe(false);
    expect(harness.prompt()).toBe('Call here.');
  });

  it('offers every tool followed by its parameters, with their metadata', () => {
    const harness = new EditorHarness('Call here.');
    harness.select(6);
    const states = harness.commands.commandStates(harness.state);
    expect(states.map(({ command }) => command)).toEqual([
      { type: 'tool.insert', tool: 'get_weather' },
      { type: 'tool.insert', tool: 'get_weather', parameter: 'location' },
      { type: 'tool.insert', tool: 'get_weather', parameter: 'units' },
      { type: 'tool.insert', tool: 'get_weather', parameter: 'options' },
      { type: 'tool.insert', tool: 'get_weather', parameter: 'options.detailed' },
      { type: 'tool.insert', tool: 'get_weather', parameter: 'days' },
      { type: 'tool.insert', tool: 'search_places' },
      { type: 'tool.insert', tool: 'search_places', parameter: 'location' },
      { type: 'tool.insert', tool: 'search_places', parameter: 'query' },
      { type: 'tool.insert', tool: 'ping' },
    ]);
    expect(states[1]).toMatchObject({ enabled: true, tool: { name: 'get_weather' }, parameter: { path: 'location', required: true } });
  });

  it.each([
    ['section titles', '<rules>\nText\n</rules>', 2],
    ['code blocks', '```\ncode\n```', 1],
    ['template expressions', 'Hi {{ cliente }}', 7],
  ])('is unavailable in %s', (_, text, position) => {
    const harness = new EditorHarness(text);
    harness.select(position);
    expect(harness.commands.commandStates(harness.state).every(({ enabled }) => !enabled)).toBe(true);
    expect(harness.commands.run(harness.view, { type: 'tool.insert', tool: 'ping' })).toBe(false);
  });
});

class EditorHarness {
  state: EditorState;
  readonly view: EditorView;
  readonly references = new ReferenceDecorationsPlugin(documentMapper);
  readonly commands = new ToolCommands(() => this.references.tools);
  changed = 0;

  constructor(text: string, initialTools: readonly ToolDefinition[] = tools) {
    this.state = EditorState.create({ schema: promptSchema, doc: documentMapper.toDocument(parse(text)), plugins: [history(), this.references.plugin] });
    const harness = this;
    this.view = {
      get state() { return harness.state; },
      dispatch(transaction: Transaction) { harness.changed += Number(transaction.docChanged); harness.state = harness.state.apply(transaction); },
      focus() {},
    } as unknown as EditorView;
    this.references.setTools(this.view, initialTools);
  }

  select(from: number, to = from): void { this.view.dispatch(this.state.tr.setSelection(TextSelection.create(this.state.doc, from, to))); }

  prompt(): string { return serialize(documentMapper.fromDocument(this.state.doc)); }

  decorations(): Array<{ reference: string; kind: string; attrs: Record<string, string> }> {
    return this.references.plugin.getState(this.state)!.find().map((decoration) => {
      const attrs = (decoration as any).type.attrs;
      return { reference: attrs['data-reference'], kind: attrs.class.split(' ')[1].replace('promptier-reference-', ''), attrs };
    });
  }
}
