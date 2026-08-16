# Architecture

How the editor is layered, how domain blocks become ProseMirror nodes, and
where to plug in when extending it. Read [AGENTS.md](../AGENTS.md) first for
the workspace layout; this document covers the inside of `core-editor` and the
contracts between workspaces.

## Layers

```
core-editor
├─ src/prompt/model/          plain serializable prompt data — no ProseMirror, no DOM
├─ src/prompt/serialization/  canonical text parser, serializer and block codecs
├─ src/prompt/structure/      derived structural readings such as the outline
├─ src/editor/                editor and session contracts, plus editor commands
├─ src/engine/prosemirror/    ProseMirror implementation (schema, mappers, descriptors)
└─ src/PromptEditorElement.ts outer packaging: the Custom Element that index.ts re-exports
react-sdk                     thin React wrapper over the element's property/event contract
playground                    reference consumer (Vite dev app)
```

Dependency rule: `prompt/model` knows nothing outside the model; prompt
capabilities and `editor` build on it; `engine` implements the editor contracts;
and `element` wires the implementation up for consumption. Nothing
ProseMirror-specific crosses `index.ts`.

Inside `engine/prosemirror/` the layout follows the role each file
plays, so a reader can tell ProseMirror-only code from translation code:

```
engine/prosemirror/
├─ proseMirrorEditor.ts     the adapter — implements the port; the only root file
├─ descriptors/             the engine definition: what can exist, how it behaves
│  ├─ promptSchema.ts       assembled from every descriptor's spec
│  ├─ blocks/               BlockDescriptor + its registry + one file per block
│  └─ marks/                MarkDescriptor + its registry + one file per format
├─ mapping/                 domain ⇄ ProseMirror, both directions, stateless
├─ editing/                 reusable document operations (named, not offsets)
├─ commands/                CommandDescriptor + registry (host-invocable actions)
├─ plugins/                 ProseMirror plugins
└─ styles/                  the injected stylesheet
```

`promptSchema` sits inside `descriptors/` rather than beside it because it is
their *derived product*, not a peer input.

**The swap unit is `PromptEditor`, not `BlockDescriptor`.** `nodeSpec`, content
expressions, node views and input rules aren't incidental to ProseMirror — they
*are* its model, so descriptors speak ProseMirror on purpose and are not
portable. Migrating engines means writing a new adapter (a `createXEditor`
factory returning an `EditorSession`) plus a new set of descriptors; the port,
the domain and the renderers survive untouched. Descriptors are the adapter's
internals.

## Domain model

The document is `PromptContent`: a list of `Block`s. Most hosts never see it —
the SDK contract is a string (`element.value`, see, and
`PromptContent` is the *hosted* product's storage, where exact fidelity matters.
The editor is its only writer.

`Block` (in `prompt/model/Block.ts`) **is** the discriminated union on `blockType` —
there is no separate base interface, so typing anything as `Block` always
narrows. `BlockType` is derived from it (`Block['blockType']`) for keying
registries:

- `ParagraphBlock`, `HeadingBlock` — leaf text blocks; they carry inline
  content as `BlockContent` (a list of `TextSegment`s, each with optional
  `Format` marks: bold, code).
- `CodeBlock` — literal text with an optional `language`. Carries a plain
  `code` string rather than `BlockContent`: code has no segments to format, and
  its whitespace is significant. It is also the format's escape hatch — markup
  inside a fence is never structure.
- `SectionBlock` — a titled, **recursive container** (`children: Block[]`) with
  an optional `description` documenting its intent. It carries **no id**:
  identity is derived from the title (see below).

Sections are first-class rather than inferred from headings because prompt
*structure* is the editor's value proposition: validation, outline, and
restructuring all need the structure to exist in the model.

## The descriptor seam (how blocks reach ProseMirror)

Every block type contributes one `BlockDescriptor`
(`engine/prosemirror/descriptors/blocks/`). It bundles everything the
ProseMirror engine needs for that type:

| Member | Purpose |
| --- | --- |
| `blockType` | Discriminant; doubles as the ProseMirror node name |
| `nodeSpec` | The node's schema entry |
| `extraNodes?` | Auxiliary schema nodes (e.g. section's `sectionTitle`) |
| `toProseMirrorNode` / `fromProseMirrorNode` | Both mapping directions |
| `inputRules?` | Typing shortcuts (`# `, `/section `) |
| `keymaps?` | Key bindings scoped to this block (bound before `baseKeymap`) |
| `nodeView?` | Custom rendering/behavior (e.g. section collapse) |

Two deliberate inversions keep this cycle-free:

- **Schema is passed in, not imported.** The schema is assembled *from* every
  descriptor's `nodeSpec` (`descriptors/promptSchema.ts`), so descriptors — and
  `documentMapper` — receive it as an argument.
- **Recursion is injected.** Container blocks map their children through a
  `mapChild` callback provided by the registry, instead of importing the
  registry (which imports them).

`blockDescriptorRegistry.ts` is the single integration point: it maps
`BlockType → descriptor` and derives everything the editor consumes
(`blockDescriptors` for the schema, `blockInputRules`, `blockKeymaps`,
`blockNodeViews`, and the two mapping entry points used by `documentMapper`).
Registry order matters: the first block-group node becomes the doc's default
block (paragraph).

Marks follow the same pattern in miniature: `MarkDescriptor` +
`markDescriptorRegistry` provide mark specs, input rules and keymaps.
`blockContentMapper` centralizes the inline translation (domain `TextSegment`
formats ⇄ ProseMirror marks) so block descriptors delegate instead of each
reimplementing it.

### Editing operations

ProseMirror addresses a tree through flat integer positions, so caret placement
is naturally written as offset arithmetic whose meaning needs a comment.
`editing/blockTransactions.ts` names those operations once
(`replaceRangeWithBlock`, `insertBlockAt`, `caretAfterNode`, `caretInLastBlock`)
and descriptors and plugins call them instead of computing positions. They take
and return a `Transaction`, so they compose — a list can delete its trailing
item and then insert a paragraph in one chain. New descriptors should reach for
these before writing an offset.

### Section specifics

- Node grammar: `section` = `sectionTitle block+`, with `id`/`description` as
  attrs. `sectionTitle` is a plain textblock **outside the `block` group**, so
  it can only exist where the section's content expression puts it: first
  child. The cheapest validation is structure the grammar makes unrepresentable
  — every section has exactly one title, always first.
- Since `section` is itself in the `block` group, arbitrary nesting
  (subsections) falls out of the grammar for free.
- Collapse is implemented in `SectionNodeView` and is **view-only state**: it
  never enters the document JSON, which stays purely semantic.
- Structural editor CSS is injected once per document (`styles/editorStyles.ts`)
  because the element mounts in light DOM and `core-editor` has no CSS
  pipeline.
- Section identity is **derived, never stored**: `sectionTagName(title)` is
  simultaneously the serialized tag, the outline anchor and the id. A stored
  attr would go stale the moment the title is edited, so `SectionNodeView`
  recomputes `data-section-id` on every update.

## Prompt serialization

`prompt/serialization/` holds the one serialization: `serialize` and `parse`, pure and
DOM-free. XML tags carry structure, markdown carries everything inside — what a
host stores *is* what a model reads.
`roundTrip.test.ts` enforces them.

There is deliberately **no second rendering**. `toMarkdown`/`toXml` used to
coexist, and two section renderings were the whole source of parse-back
ambiguity: a `#` could be a section title or a loose heading, and no parser
could tell. Collapsing to one format made `HeadingBlock` unambiguous again
rather than costing it.

The domain is still data and the codec is still a fold over it, so a second
strategy remains cheap to add — it is just no longer canonical.

## Prompt structure

`prompt/structure/` derives structural readings from a document.
`buildOutline(content)` produces one `OutlineEntry` per section with its tag as
`id`, its raw title and its nesting depth; the public API keeps the shorter
`outline` name. It is a fold like `serialize`: anything holding a
`PromptContent` can derive one without a live editor.

That is why it is **not** on the element. A method there would imply the editor
owns the answer, and the next consumer that wants an outline is a server
rendering a stored prompt, not a mounted view. Callers who do have an editor
read `element.content` and fold it themselves.

Entries carry no display text beyond the raw title: an empty title stays empty
and the placeholder is the UI's decision, in the UI's language. Headings are
excluded for now — folding them in means deciding how a heading's level relates
to a section's depth.

## Consumption chain

- `PromptEditorElement` (Custom Element) is the public surface. Two properties
  project one document: **`value`** (prompt text — the SDK contract, also
  settable as a `value` attribute for plain-HTML hosts) and **`content`**
  (`PromptContent`, for hosts that want structure). Last write wins; both defer
  until the editor mounts. Plus `change` / `selectionchange` events.
  `value` has initial-value semantics like a textarea's content: set it once,
  read it when saving — binding it per keystroke would re-parse while the user
  types and fight the caret.
  - For driving UI it also answers `availableCommands()` and
    `getSelectionState()`. The catalogue is a property of the engine, so it
    answers **before mount**; the selection state is `null` until an editor
    exists, because before that there is no selection to describe. A host
    builds its menu from the catalogue and paints it from the state, reaching
    each command through the optional chain it needs anyway for a command that
    doesn't apply to the current selection.
- `react-sdk` forwards that contract as `<PromptEditor value onChange />`, and
  adds no editor logic. Its own layering, the reasoning behind it and the phases
  that got there live in [refactor-plan.md](refactor-plan.md); what matters here
  is the seam it presses on. `playground/src/MinimalConsumer.tsx` is the
  compiler-checked proof of the contract: it imports nothing from `core-editor`.
  - It used to be a *controlled* binding (`content`/`onChange(content)`), which
    forced every React host to hold `PromptContent` — leaking the document model
    into the one place the SDK exists to keep it out of. It then swung to
    `defaultValue` in / `getValue()` out, with `onChange` carrying accessors;
    that protected writing (a per-keystroke re-parse fights the caret) at the
    cost of the ergonomics the SDK exists for. `onChange` now carries the
    string, and the wrapper reconciles `value` against the last string it
    reported so a host's own echo never re-seeds the document.
  - `registerPromptEditor()` runs when the wrapper receives a DOM node, not at
    module scope, so importing the package under SSR does not throw. Defining
    the tag late is safe: the node upgrades in place, and the element replays a
    `value` or `content` set before that (`upgradeProperty`) instead of letting
    the own property shadow the accessor forever.
  - **`change` fires for user edits only.** Writing `value` or `content`
    replaces the state rather than applying a transaction, so it emits nothing.
    That is fine for the host doing the writing and wrong for everyone else, so
    `react-sdk` notifies its own subscribers on write — otherwise a sibling
    outline keeps rendering the previous document. Whether the element itself
    should emit on host writes is open.
- `playground` starts from a *string* and pulls structure only because it draws
  an outline and inspector panes: `TextLoader` shows the string contract,
  `MinimalConsumer` shows a whole integration with no `core-editor` import, and
  the round-trip pane checks the codec's law live.

## Distribution

Three build outputs, because they answer three different questions
(`yarn workspace core-editor build`):

| Entry | For | ProseMirror |
| --- | --- | --- |
| `core-editor/format` | a developer's **server**, rendering a stored prompt at LLM-call time | absent — asserted by `bundle.test.ts` |
| `core-editor` | bundler consumers | external, so their bundler dedupes it |
| `dist/promptier.js` | `<script src>` — see `examples/standalone.html` | inlined |

Two things this shape encodes. **ProseMirror is external for the library build**
because two copies break the `instanceof` checks it makes between schema and
state. And **the standalone bundle is its own entry** (`src/standalone.ts`), not
a reformat of `index.ts`: it registers the tag and publishes `window.Promptier`,
and the module entry has to stay free of side effects so bundlers can shake it
and SSR can import it.

`exports` points at TS source so the dev loop stays buildless; `publishConfig`
swaps in `dist` at publish time.
