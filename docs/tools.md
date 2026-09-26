# Tool references

The editor recognizes mentions of the host's tools and their parameters written
as inline code, such as `` `get_weather` `` or `` `get_weather.location` ``.
It does not call tools, validate arguments, or change how tools reach a model.

## React

```tsx
import { PromptEditor, type ToolDefinition } from 'react-sdk';

const tools: ToolDefinition[] = [
  {
    name: 'get_weather',
    description: 'Current weather for a city',
    parameters: {
      type: 'object',
      required: ['location'],
      properties: {
        location: { type: 'string', description: 'City name' },
        units: { type: 'string' },
      },
    },
  },
];

<PromptEditor value={prompt} onChange={setPrompt} tools={tools} />
```

Replacing `tools` updates decorations and the picker without changing the
prompt, selection or undo history. Treat definitions as immutable and supply a
new array when they change.

## Custom Element

```ts
import { registerPromptEditor, type PromptEditorElement } from 'core-editor';

registerPromptEditor();
const editor = document.createElement('prompt-editor') as PromptEditorElement;
editor.value = 'Call `get_weather` with the `location` the user gives.';
editor.tools = tools;
container.append(editor);
```

`tools` is a JavaScript property, not a serialized HTML attribute. It can be
assigned before connecting or upgrading the element, defaults to an empty list,
and is independent for each editor instance.

## Definitions

A `ToolDefinition` carries a `name`, an optional `description`, and optional
`parameters` described with the schema vocabulary documented in
[variables.md](variables.md#supported-schema-vocabulary). Hosts project their
provider's format into this shape: Anthropic's `input_schema`, OpenAI's
`function.parameters` and MCP's `inputSchema` all become `parameters`.

Names are case-sensitive. When several tools share a name, the first wins.

## Recognition

Only the complete content of an inline code span is a candidate. Plain text,
code blocks and section titles are never scanned. A code span becomes a
reference only when the catalog confirms it:

| Code span | Recognized as |
| --- | --- |
| `get_weather`, `get_weather()` | the tool |
| `get_weather.location`, `get_weather.options.detailed` | that tool's parameter |
| `location` | the parameter, in every tool that declares it at that path |
| anything else | ordinary inline code |

- A tool name takes precedence over a parameter path.
- A mention qualified by a tool never falls back to another tool's parameter.
- Parameters must be declared in `properties`. `additionalProperties` and list
  items never produce a path.
- Content is matched exactly: spaces inside the backticks are significant and
  arguments such as `get_weather(location)` are not recognized.

There is no unknown or missing state: code the catalog does not confirm stays
ordinary code. Recognition is always on and independent of variable validation.

A tool's tooltip shows its signature and description, for example
`get_weather(location: string, units?: string) — Current weather for a city`.
A parameter's tooltip has one line per tool that declares it. Tool references
are not navigable.

## Insertion

The References menu lists every tool followed by its parameters. Choosing one
inserts an inline code span at the selection, separated from neighbouring words.
A parameter is inserted bare when only one tool declares it and qualified by its
tool otherwise, so the inserted text always names exactly the chosen entry.
Insertion is unavailable in section titles, code blocks and template tokens.

## Deferred

Plain-text mentions, unknown-name or typo feedback, navigating to a definition,
disambiguating bare parameters from context, and provider-specific adapters.
