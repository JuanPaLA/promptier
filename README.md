# Promptier

A business-domain editor for LLM prompts, built on ProseMirror. You work with sections, headings, lists, template variables and tool references; what you store is the plain prompt text.

## Packages

| Package | What it is |
| --- | --- |
| [`@cachai/promptier-react-sdk`](react-sdk) | React component: `<PromptEditor value onChange />`, with toolbar and outline. |
| [`@cachai/promptier-core-editor`](core-editor) | Framework-agnostic editor exposed as a Custom Element, plus the codec for the prompt text format (usable on a server). |
| `playground` | Dev app for trying the editor with live changes. Not published. |

## Quick start

```bash
npm install @cachai/promptier-react-sdk
```

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

Not using React? See [`core-editor`](core-editor) for the Custom Element.

## Documentation

- [Prompt text format](docs/format.md): the one serialization, and a permanent compatibility surface.
- [Template variables](docs/variables.md)
- [Tool references](docs/tools.md)
- [Architecture](docs/architecture.md)
- [Releasing](docs/releasing.md)

## Development

```bash
yarn install
yarn workspace playground dev   # start the playground
yarn test                       # vitest
```

See [AGENTS.md](AGENTS.md) for the project's layout and conventions.

## License

[MIT](LICENSE) © 2026 Juan López Alurralde
