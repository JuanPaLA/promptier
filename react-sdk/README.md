# @cachai/promptier-react-sdk

A React editor for LLM prompts. You pass it a string and get a string back: sections, headings, lists and inline formatting are all kept in the prompt text itself.

## Install

```bash
npm install @cachai/promptier-react-sdk
```

Requires React 18.3+ or 19. The editing engine, [`@cachai/promptier-core-editor`](https://www.npmjs.com/package/@cachai/promptier-core-editor), is installed with it.

## Usage

```tsx
import { useState } from 'react';
import { PromptEditor } from '@cachai/promptier-react-sdk';

export function PromptField() {
  const [prompt, setPrompt] = useState('You are a support assistant.');

  return (
    <div style={{ height: 480 }}>
      <PromptEditor value={prompt} onChange={setPrompt} />
    </div>
  );
}
```

The editor fills its parent, so give the parent a height. It brings its own styles; there is nothing to import.

What you store is a plain string, the prompt source. Its format is documented in [the prompt text format](https://github.com/JuanPaLA/promptier/blob/main/docs/format.md).

## Props

All props are optional.

| Prop | Type | |
| --- | --- | --- |
| `value` | `string` | The prompt source. |
| `onChange` | `(value: string) => void` | Called with the prompt source whenever it changes. |
| `variableSchema` | `VariableSchema` | Describes the `{{ variables }}` your template engine will fill, so the editor can offer them and recognize them. |
| `tools` | `readonly ToolDefinition[]` | Describes the tools your model can call, so the editor can recognize and insert references to them. |
| `defaultOutlineOpen` | `boolean` | Whether the outline panel starts open. When omitted, it starts open only if the editor's container is wide enough to hold it beside the editing area (about 43rem). Only read on mount; users toggle it from the editor afterwards. |

`PromptEditorProps`, `VariableSchema`, `ToolDefinition`, `JsonSchema`, `JsonSchemaType` and `VariableType` are exported as types.

### Variables

```tsx
import { PromptEditor, type VariableSchema } from '@cachai/promptier-react-sdk';

const schema: VariableSchema = {
  type: 'object',
  properties: {
    cliente: {
      type: 'object',
      properties: { nombre: { type: 'string', description: 'Customer name' } },
    },
  },
};

<PromptEditor value={prompt} onChange={setPrompt} variableSchema={schema} />
```

The editor recognizes variables; it never renders the template or fills in values. See [template variables](https://github.com/JuanPaLA/promptier/blob/main/docs/variables.md).

### Tools

```tsx
import { PromptEditor, type ToolDefinition } from '@cachai/promptier-react-sdk';

const tools: ToolDefinition[] = [
  {
    name: 'get_weather',
    description: 'Current weather for a city',
    parameters: { type: 'object', properties: { location: { type: 'string' } } },
  },
];

<PromptEditor value={prompt} onChange={setPrompt} tools={tools} />
```

See [tool references](https://github.com/JuanPaLA/promptier/blob/main/docs/tools.md).

## Good to know

- The component registers the `<prompt-editor>` custom element the first time it mounts. If another element already uses that tag name, registration throws.
- Treat `variableSchema` and `tools` as immutable: pass a new object when they change.

## Related

- [`@cachai/promptier-core-editor`](https://www.npmjs.com/package/@cachai/promptier-core-editor): the framework-agnostic editor underneath, and the text format codec for servers.
- [Source and issues](https://github.com/JuanPaLA/promptier)
