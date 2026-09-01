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
├─ src/editor/                mounted editor-session contract, plus editor commands
├─ src/engine/prosemirror/    ProseMirror implementation (schema, mappers, descriptors)
└─ src/ProptEditorElement.ts  browser packaging: the Custom Element that index.ts re-exports
react-sdk                     Custom Element service, presenter and React UI composition
playground                    reference consumer (Vite dev lib)
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
│  ├─ promptSchema.ts       schema factory over explicit descriptor registries
│  ├─ blocks/               BlockDescriptor + BlockRegistry
│  └─ marks/                MarkDescriptor + MarkRegistry
├─ mapping/                 PromptDocumentMapper owns domain ⇄ ProseMirror translation
├─ editing/                 reusable document operations (named, not offsets)
├─ commands/                execution routing + editor-state projection
├─ plugins/                 ProseMirror plugins
└─ styles/                  fixed styles installed inside the element's shadow root
```

`createPromptSchema` sits inside `descriptors/` rather than beside them because
the schema is their *derived product*, not a peer input.

**The swap unit is `EditorSession`, not `BlockDescriptor`.** `nodeSpec`, content
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
- `SectionBlock` — a titled, **recursive container** (`children: Block[]`). It
  carries **no id**: identity is derived from the title (see below).

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

- **Schema is passed in, not imported.** `createPromptSchema` assembles it from
  the registries, then `PromptDocumentMapper` and every descriptor receive that exact
  schema instance.
- **Recursion is injected.** Container blocks map their children through a
  `mapChild` callback provided by `PromptDocumentMapper`, instead of importing the
  mapper or registry that owns their traversal.

`BlockRegistry` owns the exhaustive `BlockType → descriptor` map,
descriptor order, lookup validation, and the aggregation of input rules,
keymaps and node views. Unknown types fail rather than silently mapping as a
different block. `PromptDocumentMapper` separately owns recursive document and block
translation. Registry order matters: the first block-group node becomes the
doc's default block (paragraph).

Marks follow the same pattern in miniature: `MarkDescriptor` +
`MarkRegistry` provides mark specs, input rules and keymaps. Both
registries compose duplicate key bindings in declaration order, so one
contribution returning `false` delegates to the next instead of overwriting it.
`blockContentMapper` centralizes the inline translation (domain `TextSegment`
formats ⇄ ProseMirror marks) so block descriptors delegate instead of each
reimplementing it.

`proseMirrorEditor.ts` is the descriptor composition root as well as the command
composition root. It registers every concrete descriptor once, builds one shared
schema and mapper from those registries, and passes the resulting objects into
each mounted editor session. Adding a domain block or format extends the
corresponding exhaustive registration map; registry, schema, mapper and editor
algorithms stay unchanged. Prompt serialization and React presentation remain
separate exhaustive seams and may require their own contribution for a new
domain type.

### Editing operations

ProseMirror addresses a tree through flat integer positions, so caret placement
is naturally written as offset arithmetic whose meaning needs a comment.
`editing/blockTransactions.ts` names those operations once
(`replaceRangeWithBlock`, `insertBlockAt`, `caretAfterNode`, `caretInLastBlock`)
and descriptors and plugins call them instead of computing positions. They take
and return a `Transaction`, so they compose — a list can delete its trailing
item and then insert a paragraph in one chain. New descriptors should reach for
these before writing an offset.

### Editor commands

`editor/commands/EditorCommand.ts` is the engine-independent command contract.
Commands are small discriminated data objects: `type` names the semantic action
and the remaining fields carry that action's input. Formatting uses
`{ type: 'format', format }`; bold and code are two concrete commands, not two
unrelated command types. Outline navigation uses a structural block path so a
wrapper never has to reach into the engine DOM or treat a title-derived id as
unique.

Execution and state reporting are independent capabilities. A
`CommandHandler` executes one command family, while a `CommandStateProvider`
contributes concrete commands and their current enabled/active state.
`EditorCommandRegistry` owns execution routing, keyed by the command's `type`
discriminant. `EditorStateReader` combines state providers into the public
`EditorState`; it does not consult the execution registry. Formatting
implements both capabilities, while navigation implements execution only
because its targets come from the current outline.

`createProseMirrorEditor` is the command composition root. Adding a command
family means implementing either or both capabilities and registering the new
object there; the registry, state reader, editor adapter and browser packaging
do not change. New command families belong in the public union only when their
behavior and payload are implemented; names such as `block.insert` and
`block.move` are design directions, not placeholder API.

The element imports editor creation and styles through
`engine/index.ts`. This is an internal module boundary, not a second engine
interface: the element is the composition layer that deliberately wires the
ProseMirror implementation.

### Section specifics

- Node grammar: `section` = `sectionTitle block+`. `sectionTitle` is a plain
  textblock **outside the `block` group**, so
  it can only exist where the section's content expression puts it: first
  child. The cheapest validation is structure the grammar makes unrepresentable
  — every section has exactly one title, always first.
- Since `section` is itself in the `block` group, arbitrary nesting
  (subsections) falls out of the grammar for free.
- Collapse is implemented in `SectionNodeView` and is **view-only state**: it
  never enters the document JSON, which stays purely semantic.
- The editor mounts in an open shadow root. Its fixed structural CSS lives in
  that root (`styles/editorStyles.ts`), so host selectors cannot alter the
  editing surface and editor selectors cannot escape into the host document.
  Only the custom-element host participates in host layout; internal classes
  are not a styling API.
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
`id`, its raw title, nesting depth, and ephemeral structural `path`; the public
API keeps the shorter `outline` name. The path addresses the current tree for
commands such as navigation while `id` remains a readable derived anchor. It is
a fold like `serialize`: anything holding a
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

- `PromptEditorElement` is the public type contract for the registered Custom
  Element. The runtime class is created lazily by `registerPromptEditor()`, so
  importing the package does not evaluate `HTMLElement` during SSR. The element
  owns a nullable `EditorSession`; it does not implement that contract because
  a Custom Element can exist before it is connected, while a session always
  represents a mounted editor and owns its cleanup. Connecting creates a
  session, disconnecting destroys it, and reconnecting creates a new one from
  the last content. Two properties
  project one document: **`value`** (prompt text — the SDK contract, also
  settable as a `value` attribute for plain-HTML hosts) and **`content`**
  (`PromptContent`, for hosts that want structure). Last write wins; both defer
  until the editor mounts. Plus `change` / `statechange` events.
  `value` has initial-value semantics like a textarea's content: set it once,
  read it when saving — binding it per keystroke would re-parse while the user
  types and fight the caret.
  - For driving UI it also answers `getState()`, which is `null` until an editor
    exists. Its commands are the authoritative catalogue for the current
    editor and carry their enabled state plus active state when that concept
    applies. `statechange` fires after transactions and programmatic document
    writes.
- `react-sdk` exposes `<PromptEditor value onChange />` and owns the React editor
  interface: shell layout, the collapsible outline, command view models,
  accessibility and focus behavior. It adds no editor *semantics*. Its private
  `PromptEditorService` normalizes Custom Element properties/events into a
  cached snapshot. `PromptEditorPresenter` is the single reactive owner that
  reconciles `value` / `onChange` and exposes actions. `PromptEditorVM`
  translates core snapshots into command and outline items while retaining the
  private domain lookups needed by those actions. Header, toolbar and outline
  widgets receive those models and callbacks; they know nothing about the
  service, core commands, ProseMirror, or context. The root component keeps
  local-only composition state such as outline visibility and renders the
  Custom Element inline.
  - It used to be a *controlled* binding (`content`/`onChange(content)`), which
    forced every React host to hold `PromptContent` — leaking the document model
    into the one place the SDK exists to keep it out of. It then swung to
    `defaultValue` in / `getValue()` out, with `onChange` carrying accessors;
    that protected writing (a per-keystroke re-parse fights the caret) at the
    cost of the ergonomics the SDK exists for. `onChange` now carries the
    string, and the wrapper reconciles `value` against the last string it
    reported so a host's own echo never re-seeds the document.
  - `registerPromptEditor()` runs when the wrapper receives a DOM node, not at
    module scope. It creates the `HTMLElement` subclass only in a browser, so
    importing either package during SSR is safe. Defining the tag late is safe:
    the node upgrades in place, and the element replays a `value` or `content`
    set before that (`upgradeProperty`) instead of letting the own property
    shadow the accessor forever. Registration accepts an existing compatible
    Promptier element (including across development reloads) and rejects a tag
    name already owned by another element contract.
  - **`change` fires for user edits only.** Writing `value` or `content`
    replaces the document and emits `statechange`, while `react-sdk` also
    publishes the new prompt through its own snapshot. A controlled host's echo
    is reconciled against the last prompt observed by the presenter,
    so it does not re-seed the editor or fight the caret.
- `playground` is the compiler-checked reference host: it imports only
  `react-sdk`, supplies a string, receives a string, and owns save state. It does
  not implement command bars, outlines, inspectors, or editor styling.

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
