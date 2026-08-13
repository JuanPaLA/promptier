# Architecture

How the editor is layered, how domain blocks become ProseMirror nodes, and
where to plug in when extending it. Read [AGENTS.md](../AGENTS.md) first for
the workspace layout; this document covers the inside of `core-editor` and the
contracts between workspaces.

## Layers

```
core-editor
├─ src/core/domain/          plain serializable data types — no ProseMirror, no DOM
├─ src/core/app/             ports & pure use-cases (PromptEditor, format codec)
├─ src/core/infrastructure/  ProseMirror implementation (schema, mappers, descriptors)
└─ src/element/              outer packaging: the Custom Element that index.ts re-exports
react-sdk                    thin React wrapper over the element's property/event contract
playground                   reference consumer (Vite dev app)
```

Dependency rule: `domain` knows nothing; `app` knows `domain`; `infrastructure`
implements `app` ports using `domain` types; `element` wires infrastructure up
for consumption. Nothing ProseMirror-specific crosses `index.ts`.

Inside `infrastructure/prosemirror/` the layout follows the role each file
plays, so a reader can tell ProseMirror-only code from translation code:

```
infrastructure/prosemirror/
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

The document is `PromptContent`: a `version` tag plus a list of `Block`s. Most
hosts never see it — the SDK contract is a string (`element.value`, see
[format.md](format.md)), and `PromptContent` is the *hosted* product's storage,
where exact fidelity matters. The editor is its only writer. `version` exists so
stored documents can be migrated when the shape evolves; v2 dropped
`SectionBlock.id`.

`Block` (in `domain/Block.ts`) **is** the discriminated union on `blockType` —
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
(`infrastructure/prosemirror/descriptors/blocks/`). It bundles everything the
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

## The format codec (app layer)

`app/format/` holds the one serialization: `serialize` and `parse`, pure and
DOM-free. XML tags carry structure, markdown carries everything inside — what a
host stores *is* what a model reads. The grammar, the escaping rules, the
degradation rule and the two round-trip laws live in [format.md](format.md);
`roundTrip.test.ts` enforces them.

There is deliberately **no second rendering**. `toMarkdown`/`toXml` used to
coexist, and two section renderings were the whole source of parse-back
ambiguity: a `#` could be a section title or a loose heading, and no parser
could tell. Collapsing to one format made `HeadingBlock` unambiguous again
rather than costing it.

The domain is still data and the codec is still a fold over it, so a second
strategy remains cheap to add — it is just no longer canonical.

## Consumption chain

- `PromptEditorElement` (Custom Element) is the public surface. Two properties
  project one document: **`value`** (prompt text — the SDK contract, also
  settable as a `value` attribute for plain-HTML hosts) and **`content`**
  (`PromptContent`, for hosts that want structure). Last write wins; both defer
  until the editor mounts. Plus `change` / `selectionchange` events.
  `value` has initial-value semantics like a textarea's content: set it once,
  read it when saving — binding it per keystroke would re-parse while the user
  types and fight the caret.
- `react-sdk` offers two shapes over that contract and no editor logic:
  `PromptEditorField` (controlled component, `content`/`onChange` props) and
  `usePromptEditor` (headless, returns a `PromptEditorController` — the element
  ref, `run`, and the current selection). When a Context layer lands, a
  `PromptEditorProvider` component publishes that same controller.
- `playground` demonstrates host responsibilities: hold state, derive views
  from it (outline via a pure walk over `blocks`, prompt text via `serialize`),
  navigate using the `data-section-id` attribute the editor puts on section
  DOM, and — in `TextLoader` — the string-in/string-out SDK contract. Its
  round-trip pane checks the codec's law live.

## Design decisions log

Decided and implemented:

- Sections are first-class blocks, not heading-delimited runs. (Structure must
  exist in the model to be validated, outlined, restructured.)
- The element keeps one document; `value` and `content` are two views onto it,
  not two inputs to reconcile.
- Collapse (and any future presentation state) stays out of the JSON.
- `PromptContent` is versioned from day one.
- **One format, not two.** The string is simultaneously what a host stores and
  what a model reads, so there is no "export" rendering to diverge from it. A
  second output was designed and dropped: descriptions serialize as comments and
  go to the model with everything else, since a stripped variant is a
  non-breaking `serialize(content, { comments: false })` if token cost ever
  argues for it. See [format.md](format.md).
- **Section identity is derived from the title, not stored.** The tag, the
  outline anchor and the id are one value. This replaced minted ids
  (`newSectionId`), which existed because the format could not carry them —
  once the tag *is* the identity, minting is redundant and a stored attr is
  worse than redundant: it goes stale as the title is typed. The cost is that
  titles slugify (case and diacritics degrade once, then hold) and same-slug
  siblings collide. Real identity returns as a versioned migration when
  cross-references need it.
- **Mappers are pure functions of their input** — they never mint ids or read
  the clock. `setContent` skips no-op updates by comparing the mapped doc
  against the current one, so a mapper that invented a value would produce a
  different doc on every pass, recreating the `EditorState`, wiping undo history
  and jumping the caret. Deriving identity from the title preserves this:
  same input, same output.
- **The port is a capability; the element is the lifecycle owner; hosts know
  neither.** `PromptEditor` says only what you can do with a *live* editor (read,
  write, run, observe). Creating one is `createProseMirrorEditor(container,
  initialContent)`, which returns an `EditorSession` — the editor plus the
  authority to end it. There is no `mount`: an `EditorView` without a container
  isn't a dormant editor, it's nothing, so having a container is a precondition
  of *existing*, not a later call. This is what retired the earlier
  `PromptEditor`/`MountablePromptEditor` split, which tried to express a
  *phase* boundary ("not valid yet") with a *capability* boundary — so the
  narrow half was exactly the six methods that threw before `mount`, and no
  consumer ever depended on it.
  - The element owns the lifecycle because it is the only party the browser
    tells about attachment: it creates in `connectedCallback`, destroys in
    `disconnectedCallback`, and holds the document in `pendingContent` across
    the gap. One nullable `session` field replaced a non-null editor plus a
    parallel `mounted` flag — nullness *is* mountedness, so they cannot desync.
  - `destroy` sits on `EditorSession`, not on `PromptEditor`, so anything handed
    an editor can drive it but not end it. The concrete class is unexported, so
    the module boundary enforces that, not just the type.
  - **Hosts never see any of it.** `createProseMirrorEditor`, `EditorSession`
    and `destroy` stay out of `index.ts`. Removing the element from the DOM
    *is* destroy — the custom element turns lifecycle into the browser's job,
    which is the main reason it's the public surface.
  - `protected createEditor(container, initialContent)` remains the engine seam
    (a custom element can't take constructor arguments); only its signature and
    call site moved. A consequence worth keeping: an element created and never
    connected now builds no engine at all.
- **The domain is plain serializable data, never classes.** It crosses storage,
  the network and React state; it is versioned for migration; and every
  operation on it (`serialize`, a future `validate`, token counting) is
  a fold over the tree. Classes would demand a second recursive rehydration
  mapper beside the ProseMirror one, break structural equality, and pull each
  consumer's concern onto the block itself. Nothing is lost by leaving them out,
  because the invariants live in the ProseMirror grammar, not in the objects —
  see the permissiveness note below.
- **`sectionTagName` lives in `app/format/`, not in `domain/`.** Deriving a tag
  from a title is a format artifact; the domain shouldn't know that titles
  become tags. `SectionNodeView` and `sectionDescriptor` import it from there
  for the tag hint and the outline anchor.
- `Block` is the closed union itself, not an open base interface, and it is the
  single source of truth: `BlockType` derives from it, and the document
  (`PromptContent.blocks`, `SectionBlock.children`) is typed with it. The
  ergonomic name is the correct one — a host writing `blocks: Block[]` gets
  narrowing instead of silently losing it, which an open base interface made
  easy to get wrong.
- The domain stays permissive where the editor grammar is strict: stored JSON
  may contain a section with empty `children`; the PM grammar requires
  `block+`, so mapping in backfills an empty paragraph. Structural invariants
  live in the grammar until `validate()` exists — that's where domain-level
  invariants will get their real home.
- List items are values (`BlockContent[]`), not blocks with identity. A leaf
  block otherwise holds exactly one `BlockContent`; in a list it doubles as "one
  addressable line among many." That's a scoped simplification — if items ever
  need stable ids, cross-references or multi-block content, promote them to a
  `ListItemBlock` and version the migration like any other. Until then lists stay
  the only place `BlockContent` is plural.

Decided, not yet implemented (direction commitments):

- **Structure validation is opt-in, non-blocking lint**: a pure
  `validate(content, schema): Diagnostic[]` in `app/`, where `schema` is a
  data-driven declaration of expected sections. Opinions ("prompt best
  practices") ship as presets over that mechanism; the engine stays
  unopinionated and never blocks typing.
- **Resources are referenced, never embedded**: tool definitions, variables,
  JSON schemas reach the editor through a separate `resources` input and are
  referenced from blocks by id (mention-like nodes). Rendering resolves them.
  Blocks must not embed resource payloads.

Known gaps (accepted for the walking skeleton): the codec is under test, but the
mapper invariant `fromProseMirrorDoc(toProseMirrorDoc(c)) ≡ c` is not — the one
codec bug found so far (whitespace-only blocks surviving `serialize` but skipped
by `parse`) was reported from the playground, not caught by a test; no editing
UI for section `description`; sections whose titles slugify alike share an
anchor; `commandRegistry` collects commands only from mark descriptors, so block
commands (copy, delete, move, turn into) will require modifying it rather than
extending it; `PromptEditorSurface` registers the custom element at module scope,
which throws on import under SSR; `core-editor` is still `private` with `main`
pointing at TS source, so there is nothing to put in a `<script src>` — that is
Phase 3.
