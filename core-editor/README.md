# @cachai/promptier-core-editor

A framework-agnostic editor for LLM prompts, exposed as a Custom Element and built on ProseMirror. It also ships the codec for the prompt text format, usable on a server without the editor.

If you use React, start with [`@cachai/promptier-react-sdk`](https://www.npmjs.com/package/@cachai/promptier-react-sdk): it wraps this package and adds the toolbar and outline. This package is the editing surface and its command API.

## Install

```bash
npm install @cachai/promptier-core-editor
```

Ships ES modules, CommonJS and TypeScript types.

## Use the editor

```ts
import { registerPromptEditor, type PromptEditorElement } from '@cachai/promptier-core-editor';

registerPromptEditor();

const editor = document.createElement('prompt-editor') as PromptEditorElement;
editor.value = 'You are a support assistant.';
editor.addEventListener('change', () => save(editor.value));
document.body.append(editor);
```

`registerPromptEditor(tagName = 'prompt-editor')` defines the element. Calling it again is safe; it throws only if the tag name belongs to a different element.

### The element

| Member | |
| --- | --- |
| `value: string` | The prompt as text. |
| `content: PromptContent` | The prompt as structured data. |
| `variableSchema` | Describes `{{ variables }}` so the editor can offer and recognize them. |
| `variableValidation: boolean` | Turns on visual validation feedback for variable references. Off by default. |
| `tools` | Describes the tools your model can call, so references to them are recognized. |
| `run(command)` | Runs an editor command, such as formatting or inserting a block. Returns a boolean. |
| `getState()` | The current commands, with their enabled and active state, or `null` before the editor exists. |

Events: `change` (detail: the new `PromptContent`) and `statechange` (detail: the editor state, after each transaction).

`variableSchema`, `variableValidation` and `tools` are JavaScript properties, not HTML attributes. They can be set before the element connects.

`value` works like a textarea's initial content: set it once and read it when saving. Writing it on every keystroke re-parses the document and fights the caret.

## Use the format on a server

```ts
import { parse, serialize } from '@cachai/promptier-core-editor/format';

const content = parse(storedPrompt); // PromptContent
const text = serialize(content);      // back to the prompt source
```

This entry is pure and DOM-free. It does not load ProseMirror or the editor, so it is safe to import in Node.

The text format is the only thing you need to store, and it is a permanent compatibility surface: later versions keep reading everything an earlier version wrote. See [the prompt text format](https://github.com/JuanPaLA/promptier/blob/main/docs/format.md).

## More

- [Template variables](https://github.com/JuanPaLA/promptier/blob/main/docs/variables.md)
- [Tool references](https://github.com/JuanPaLA/promptier/blob/main/docs/tools.md)
- [Architecture](https://github.com/JuanPaLA/promptier/blob/main/docs/architecture.md)
- [Source and issues](https://github.com/JuanPaLA/promptier)
