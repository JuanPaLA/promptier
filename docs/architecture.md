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
├─ proseMirrorEditor.ts     the adapter — implements the port
├─ proseMirrorConfiguration.ts  shared descriptor, schema and mapper composition
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
  `Format` marks: bold, italic, code).
- `CodeBlock` — literal text with an optional `language`. Carries a plain
  `code` string rather than `BlockContent`: code has no segments to format, and
  its whitespace is significant. It is also the format's escape hatch — markup
  inside a fence is never structure.
- `QuoteBlock` — a leaf text block whose inline content is kept distinct from
  instructions and serialized with a blockquote marker.
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
| `editorStyles?` | Shadow-root CSS owned by this block |
| `createDefaultBlock?` | Opts the block into the insertion command catalogue |
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

`BlockRegistry` owns the exhaustive `BlockType → descriptor` map, descriptor
order, lookup validation, default insertion blocks, and the aggregation of
input rules, keymaps, node views and styles. Unknown types fail rather than
silently mapping as a different block. `PromptDocumentMapper` separately owns
recursive document and block translation. Registry order matters: the first
block-group node becomes the doc's default block (paragraph).

Marks follow the same pattern in miniature: `MarkDescriptor` +
`MarkRegistry` provides mark specs, input rules and keymaps. Inline delimiter
input rules are generated from the serialization codec registry, so typing the
canonical syntax applies the corresponding mark without format-specific editor
logic. Both
registries compose duplicate key bindings in declaration order, so one
contribution returning `false` delegates to the next instead of overwriting it.
`blockContentMapper` centralizes the inline translation (domain `TextSegment`
formats ⇄ ProseMirror marks) so block descriptors delegate instead of each
reimplementing it. A mark may also contribute its own shadow-root CSS through
`editorStyles`; the style installer aggregates those contributions without
knowing any concrete format.

`proseMirrorConfiguration.ts` is the descriptor composition root. It registers
every concrete descriptor once and builds one shared schema and mapper from
those registries. `proseMirrorEditor.ts` remains the command composition root
and passes the configured objects into each mounted editor session. Adding a
domain block or format extends the corresponding exhaustive registration map;
registry, schema, mapper and editor algorithms stay unchanged. Prompt
serialization and React presentation remain separate exhaustive seams and
require their own contribution for a new domain type.

### Adding a block

Blocks use the same contribution structure across the vertical slice:

1. Add the model under `prompt/model/blocks/` and extend the closed `Block`
   union.
2. Add a `BlockCodec` and register it in the exhaustive `blockCodecs` map. The
   codec declares its own parse priority and whether its syntax interrupts a
   paragraph. The codec catalogue drives dispatch and paragraph escaping.
3. Add a `BlockDescriptor` and register it in the exhaustive
   `blockDescriptors` map. Mapping, input rules, keymaps, node views, styles and
   an optional default insertion value belong to that descriptor.
4. Add a `BlockPresentation` in `react-sdk/src/ui/blocks/` and register it in
   the exhaustive `blockPresentations` map.

`PromptTextParser` recursively reads registered blocks until a container's
closing condition is reached. A container therefore has no knowledge of code
fences or any other opaque block. `BlockCommands` converts the complete domain
block carried by `{ type: 'block.insert', block }` through the shared mapper and
inserts it after the nearest containing block. Its advertised commands are
derived from descriptors that provide `createDefaultBlock`.

Only the model union and these three composition maps change. A new block must
not add branches to parsing, escaping, serialization, mapping, insertion,
styling, view-model projection or toolbar rendering.

### Adding an inline format

Inline formats have three deliberately separate contributions so the pure
format bundle never imports ProseMirror and core never imports React:

1. Add the identifier to `prompt/model/Format.ts`.
2. Add an `InlineFormatCodec` under `prompt/serialization/formats/` and register
   it in the exhaustive `inlineFormatCodecs` map. The shared parser, serializer,
   escaping, nesting and manual-typing input-rule algorithms consume this
   registry.
3. Add a `MarkDescriptor` under
   `engine/prosemirror/descriptors/marks/` and register it in the exhaustive
   `markDescriptors` map. Formatting commands are derived from this registry.
4. Add a `FormatPresentation` under `react-sdk/src/ui/formats/` and register it
   in the exhaustive `formatPresentations` map. The view model and toolbar are
   format-agnostic.

Only the closed domain vocabulary and these three composition maps change. A
new format must not add branches to parsing, serialization, command execution,
mapping, view-model projection or toolbar rendering.

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
`{ type: 'format', format }`; bold, italic and code are concrete commands, not
unrelated command types. Generic insertion uses
`{ type: 'block.insert', block }`, with the complete domain value as its payload.
Outline navigation uses a structural block path so a wrapper never has to reach
into the engine DOM or treat a title-derived id as unique.

Execution and state reporting are independent capabilities. A
`CommandHandler` executes one command family, while a `CommandStateProvider`
contributes concrete commands and their current enabled/active state.
`EditorCommandRegistry` owns execution routing, keyed by the command's `type`
discriminant. `EditorStateReader` combines state providers into the public
`EditorState`; it does not consult the execution registry. Formatting and block
insertion implement both capabilities, while navigation implements execution
only because its targets come from the current outline.

`createProseMirrorEditor` is the command composition root. Adding a command
family means implementing either or both capabilities and registering the new
object there; the registry, state reader, editor adapter and browser packaging
do not change. New command families belong in the public union only when their
behavior and payload are implemented; `block.move` remains a design direction,
not a placeholder API.

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
host stores is the prompt source. Hosts using templates render it with their
own engine before passing the result to a model.
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
`buildOutline(content)` produces one `OutlineEntry` per section and heading in
document order; the public API keeps the shorter `outline` name. Entries are
discriminated by `kind`. Sections retain their tag as `id`, while headings carry
their markdown level and a plain-text title derived from their inline content.
Every entry has an ephemeral structural `path`, which addresses the current
tree for commands such as navigation. It is a fold like `serialize`: anything
holding a `PromptContent` can derive one without a live editor.

That is why it is **not** on the element. A method there would imply the editor
owns the answer, and the next consumer that wants an outline is a server
rendering a stored prompt, not a mounted view. Callers who do have an editor
read `element.content` and fold it themselves.

Entries carry no display text beyond the raw title: an empty title stays empty
and the placeholder is the UI's decision, in the UI's language. Section
containment and heading rank combine deterministically: a section increments
the depth of its contents by one, and a heading adds `level - 1` within that
container. Heading navigation reveals any collapsed containing sections before
moving the selection.

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
  accessibility and focus behavior. It adds no editor *semantics*. Format and
  block labels and glyphs come from separate exhaustive presentation registries. Its private
  `PromptEditorService` normalizes Custom Element properties/events into a
  cached snapshot. `PromptEditorPresenter` is the single reactive owner that
  reconciles `value` / `onChange` and exposes actions. `PromptEditorVM`
  translates core snapshots into command and outline items while retaining the
  private domain lookups needed by those actions. Header, toolbar and outline
  widgets receive those models and callbacks; they know nothing about the
  service, core commands, ProseMirror, or context. The root component keeps
  local-only composition state such as outline visibility and renders the
  Custom Element inline.
  - Curated/Raw mode is local presentation state, defaulting to Curated. Raw
    displays the current canonical `snapshot.prompt` as read-only text; it is
    the normalized serialization, not the original input byte for byte. The
    header's Copy action copies this same string in either mode. The curated
    element stays mounted while hidden so switching preserves its session.
    Formatting and outline controls are hidden in Raw; the prior outline
    preference returns in Curated. Neither switching nor copying writes the
    document. Header composes a horizontally scrollable toolbar of labelled
    groups (Outline, Formatting, Blocks, References, View, Actions) and a
    separate settings popover. References has one picker per kind — sections,
    variables and tools — and a picker whose host input is absent is hidden.
    Picker panels are fixed-positioned so the scrolling toolbar does not clip
    them. Clipboard operations and feedback state live in the React wrapper.
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

Two build outputs, because they answer two different questions
(`yarn workspace @cachai/promptier-core-editor build`):

| Entry | For | ProseMirror |
| --- | --- | --- |
| `@cachai/promptier-core-editor/format` | a developer's **server**, rendering a stored prompt at LLM-call time | absent — asserted by `bundle.test.ts` |
| `@cachai/promptier-core-editor` | bundler consumers | external, so their bundler dedupes it |

**ProseMirror is external for the library build** because two copies break the
`instanceof` checks it makes between schema and state. The module entry has to
stay free of side effects so bundlers can shake it and SSR can import it.

`exports` points at TS source so the dev loop stays buildless; `publishConfig`
swaps in `dist` at publish time. That swap is honored by Yarn and pnpm but not
by `npm publish`, so publish with `yarn npm publish`.

Both packages are published to npm under the `@cachai` scope:
`@cachai/promptier-core-editor` and `@cachai/promptier-react-sdk`.

### Derived references

References remain ordinary `TextSegment`s in storage; legacy code-formatted
references are also supported.
`prompt/references/` owns a pure resolver contract and its implementations,
section and tool resolution. The parser does not consult reference targets or editor
context. Complete opening and closing tags are literal inline tokens, protecting
their underscores from markdown parsing. Ordinary text is scanned for tag
mentions across formatting boundaries; legacy code spans must contain exactly
one tag. Unknown plain mentions remain text, while legacy missing references
retain their feedback. Duplicate tags are ambiguous, not interchangeable targets.

`ReferenceDecorationsPlugin` composes the resolvers independently of the code
mark descriptor. Decorations are recomputed after document changes, with
navigation for resolved targets and feedback for missing/ambiguous targets.
They do not enter document serialization. `reference.insert` validates its target
and inserts ordinary text; its command states provide the React section picker.
A future slash menu can invoke the same command. Future reference kinds can add
resolvers, target variants and picker entries without changing the text parser.

### Tool references

Tools are the first reference kind whose targets live outside the document.
`prompt/tools/ToolCatalog` holds the host's `ToolDefinition`s and resolves the
text of a whole code span to a tool (`name`, `name()`) or to declared parameters
(`name.path`, or a bare `path` naming every tool that declares it).
`toolReferences` adapts it to the resolver contract. It only ever reports
resolved references: unconfirmed code is ordinary code, so tools have no missing
or ambiguous state. Having no target in the document, a tool reference carries a
`detail` for its tooltip instead of a navigation target.

`ReferenceDecorationsPlugin` owns the per-session tool catalog, as
`VariableDecorationsPlugin` owns the variable catalog, and a metadata-only
transaction refreshes its decorations when `tools` are replaced. `tool.insert`
writes a code span through `editing/mentionInsertion`, the same operation behind
`reference.insert`. `tools` travels through the React presenter/service and the
Custom Element to the editor session, like `variableSchema`, and never enters
`PromptContent`, prompt text or undo history. See [tools.md](tools.md).

### Template variables

`prompt/schema/` defines the supported JSON Schema vocabulary (`JsonSchema`) and
`SchemaCatalog`, which resolves and enumerates declared property paths. Variables
and tool parameters share it; `VariableSchema` remains its public name for
variables. `VariableCatalog` adds Pebble's literal names to that path grammar;
`VariableAnalysis` combines the catalog with lexical template tokens to derive
references. These classes are pure capabilities with no editor or browser
dependencies.

`prompt/templates/TemplateSyntax` recognizes opaque template regions, including
quoted delimiters, comments and verbatim content. The format codec uses it to
preserve template source through Markdown parsing and serialization.
`TemplateInlineContent` retains only formatting shared across an entire template
token, preventing marks inside an expression from becoming executable source.

The engine's `VariableDecorations` owns a per-session catalog and derived
decorations; a metadata-only transaction refreshes it on schema replacement.
`VariableCommands` handles insertion and publishes the picker entries.
`TemplateFormatting` enforces the token formatting rule through appended mark
transactions. The editor applies the whole transaction chain before reporting
content, so consumers never observe an intermediate malformed expression.

`variableSchema` travels through the React presenter/service and the Custom
Element to the editor session. `variableValidation` follows the same route and
controls only the decoration plugin; disabling it leaves the catalog and
insertion commands available. Neither value is part of `PromptContent`, prompt
text, or undo history. React projects command states and metadata into the header menus.
See [variables.md](variables.md) for integration examples and scope.
