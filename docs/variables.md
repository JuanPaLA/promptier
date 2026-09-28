# Template variables

The editor recognizes simple Pebble-style paths such as `{{ cliente.nombre }}`.
It does not render templates, inject values, or replace Pebble in the host.

## React

```tsx
import { PromptEditor, type VariableSchema } from 'react-sdk';

const schema: VariableSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    cliente: {
      type: 'object',
      additionalProperties: false,
      properties: {
        nombre: { type: ['string', 'null'], description: 'Nombre del cliente' },
        vip: { type: 'boolean' },
      },
    },
    productos: { type: 'array', items: { type: 'string' } },
  },
};

<PromptEditor value={prompt} onChange={setPrompt} variableSchema={schema} />
```

`onChange` continues to return the template, including its interpolation syntax.
Replacing `variableSchema` updates the picker and decorations without changing
the prompt, selection or undo history. Pass `undefined` to remove the schema.
Treat schema values as immutable and supply a new object when they change.

## Custom Element

```ts
import { registerPromptEditor, type PromptEditorElement } from 'core-editor';

registerPromptEditor();
const editor = document.createElement('prompt-editor') as PromptEditorElement;
editor.value = 'Saludá a {{ cliente.nombre }}.';
editor.variableSchema = schema;
container.append(editor);
```

The property can be assigned before connecting or upgrading the element and
updated afterward. It is a JavaScript property, not a serialized HTML attribute.
Each editor instance has its own schema. Persist the schema separately if needed.

## Validation

Variable validation is an editor setting, disabled by default. It is toggled in
the Settings panel and only controls the visual feedback applied to simple
variable references. The variable schema remains available to the insertion menu
whether validation is enabled or disabled. The Custom Element exposes the
equivalent `variableValidation` property.

## Supported schema vocabulary

- `type`: `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`, or
  an array of those types.
- `properties`, `required`, `additionalProperties` (boolean or schema).
- `items` for list element metadata, plus `title` and `description`.

This is a documented JSON Schema subset, not a full validator. `$ref`, schema
composition, value constraints and engine-specific object methods are outside
this iteration. Hosts should provide a schema projected into this vocabulary.
No actual context values are accepted or inferred.

Properties are optional unless listed in `required`; a nullable type does not
by itself make a property optional. Metadata reports a nested path as required
only when its ancestors are required and cannot be null.

## Recognition and insertion

Simple paths use ASCII letters or underscores at the start of each component,
then letters, digits or underscores, separated by dots. Bracket indexing, quoted
keys, filters and other expressions are preserved but not verified. Pebble
literal values such as `true` and `null` are not variable references.

Recognized references expose type and description through their accessible label
and tooltip. Unknown references receive a warning color; unverified references
receive a neutral color. These are editing hints, not runtime validation.

| Situation | State |
| --- | --- |
| Explicitly declared path | Recognized |
| Validation disabled | No visual validation |
| No schema, with validation enabled | Unverified |
| Undeclared property in an open object | Unverified |
| Undeclared property in a closed object | Unknown |
| Property access on a declared non-object | Unknown |
| Template containing statements that may introduce local scope | Unverified |

The last rule is deliberately document-wide until scope analysis is implemented:
even a recognized global may be shadowed by `set` or a loop. Comments and
`verbatim` suppress recognition. Markdown code does not suppress interpolation.
Section titles do not support variable insertion because their text determines
serialized section identity.

The picker lists nested paths, descriptions and types. Objects and lists are
shown as disabled containers; scalar entries insert `{{ path }}` at the current
selection. It never invents paths through list elements. Insertion within an
existing template token is disabled; selecting an entire token allows replacement.
Manual typing remains available without a schema.

## Deferred

No live completion menu, filtering assistance, conditions, loops, scope analysis,
render preview or engine execution is included. Complex syntax remains editable
source. Preservation applies to template tokens; the editor's normal block
normalization still applies elsewhere. See [format.md](format.md).
