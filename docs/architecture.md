# Architecture

How the editor is layered, how domain blocks become ProseMirror nodes, and
where to plug in when extending it. Read [AGENTS.md](../AGENTS.md) first for
the workspace layout; this document covers the inside of `core-editor` and the
contracts between workspaces.

## Layers

```
core-editor
├─ src/core/domain/          plain serializable data types — no ProseMirror, no DOM
├─ src/core/app/             ports & pure use-cases (PromptEditor, toMarkdown, toXml)
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
├─ ProseMirrorEditor.ts     the adapter — implements the port; the only root file
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
portable. Migrating engines means writing a new adapter (`XEditor implements
MountablePromptEditor`) plus a new set of descriptors; the port, the domain and
the renderers survive untouched. Descriptors are the adapter's internals.

## Domain model

The document is `PromptContent`: a `version` tag plus a list of `Block`s. It is
**opaque to hosts** — a dev consuming the SDK persists it wherever they want,
feeds it back, and renders it with `toMarkdown`. They never author or maintain
the JSON by hand; the editor is its only writer. `version` exists so documents
stored long-term (future backoffice) can be migrated when the format evolves.

`Block` (in `domain/Block.ts`) **is** the discriminated union on `blockType` —
there is no separate base interface, so typing anything as `Block` always
narrows. `BlockType` is derived from it (`Block['blockType']`) for keying
registries:

- `ParagraphBlock`, `HeadingBlock` — leaf text blocks; they carry inline
  content as `BlockContent` (a list of `TextSegment`s, each with optional
  `Format` marks: bold, code).
- `SectionBlock` — a titled, **recursive container** (`children: Block[]`).
  Carries a stable `id` (outline navigation, future cross-references), a plain
  `title`, and an optional `description` documenting the section's intent.
  The description is authoring metadata: round-trips through the editor,
  never rendered to markdown.

Sections are first-class rather than inferred from headings because prompt
*structure* is the editor's value proposition: validation, outline, and
restructuring all need the structure to exist in the model. The title **is**
the section's heading — users never manage `#` levels (see Rendering).

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
- Section ids come from `newSectionId()` at the point a section is *created*
  (the `/section ` input rule). Mapping never mints one — see the decisions log.

## Rendering (app layer)

`toMarkdown` is a pure function over `PromptContent`, recursive with a `depth`
parameter:

- A section renders its title as a heading whose level **is its nesting
  depth** (`#` top-level, `##` one deeper, capped at 6). Moving a section
  renumbers its whole subtree on export — users never sync heading levels.
- `description` is not rendered (authoring metadata).
- Loose `HeadingBlock`s keep their explicit level — an escape hatch inside
  section bodies.
- Multi-format segments nest per `FORMAT_ORDER` (innermost first).

Markdown is one rendering strategy, not the model. A section maps equally well
to XML tags (`<dialogue_rules>…</dialogue_rules>`, via `toXml` +
`sectionTagName`); alternative renderers can be added beside `toMarkdown`
without touching the domain. That is why the domain is data and the renderers
are functions over it: each new strategy is a new fold, not a new method on
every block.

## Consumption chain

- `PromptEditorElement` (Custom Element) is the public surface:
  a `content` property (get/set `PromptContent`) and a `change` CustomEvent
  carrying the new content. That's the whole contract.
- `react-sdk` offers two shapes over that contract and no editor logic:
  `PromptEditorField` (controlled component, `content`/`onChange` props) and
  `usePromptEditor` (headless, returns a `PromptEditorController` — the element
  ref, `run`, and the current selection). When a Context layer lands, a
  `PromptEditorProvider` component publishes that same controller.
- `playground` demonstrates host responsibilities: hold state, derive views
  from it (outline via a pure walk over `blocks`, markdown preview via
  `toMarkdown`), navigate using the `data-section-id` attribute the editor
  puts on section DOM.

## Design decisions log

Decided and implemented:

- Sections are first-class blocks, not heading-delimited runs. (Structure must
  exist in the model to be validated, outlined, restructured.)
- The element keeps a single `content` input; the document *is* the structure.
  No parallel "structured input" to keep in sync.
- Collapse (and any future presentation state) stays out of the JSON.
- `PromptContent` is versioned from day one; hosts treat it as opaque.
- Section ids are stable and generated by the editor (`newSectionId`).
- **Mappers are pure functions of their input.** `toProseMirrorNode` passes
  `block.id` through unchanged rather than minting one for an empty id. It used
  to, and because `setContent` skips no-op updates by comparing the mapped doc
  against the current one, a section with an empty id produced a different doc
  on every pass — recreating the `EditorState`, which wipes undo history and
  jumps the caret. Ids are minted only where a section is created. A host
  authoring content by hand calls `newSectionId()` itself; a section left with
  an empty id simply isn't outline-navigable.
- **The port carries the lifecycle, and the element depends on the port.**
  `PromptEditor` is the platform-free surface (read, write, run, observe);
  `MountablePromptEditor` extends it with `mount`/`destroy` so `HTMLElement`
  reaches only consumers that own a DOM lifecycle. `PromptEditorElement` holds a
  `MountablePromptEditor` and builds it in a `protected createEditor()` — a
  custom element can't take constructor arguments (hosts create it through the
  tag), so an overridable factory is the only real seam. Without this the port
  existed but nothing depended on it: all of the cost, none of the benefit.
- **The domain is plain serializable data, never classes.** It crosses storage,
  the network and React state; it is versioned for migration; and every
  operation on it (`toMarkdown`, `toXml`, a future `validate`, token counting) is
  a fold over the tree. Classes would demand a second recursive rehydration
  mapper beside the ProseMirror one, break structural equality, and pull each
  consumer's concern onto the block itself. Nothing is lost by leaving them out,
  because the invariants live in the ProseMirror grammar, not in the objects —
  see the permissiveness note below.
- **`sectionTagName` lives in `app/rendering/`, not in `domain/`.** Deriving an
  XML tag from a title is a rendering artifact; the domain shouldn't know that
  titles become tags. `SectionNodeView` imports it from there to draw its hint.
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

Known gaps (accepted for the walking skeleton): no tests, so the round-trip
invariant `fromProseMirrorDoc(toProseMirrorDoc(c)) ≡ c` is unverified; no editing
UI for section `description`; copy/pasting a section duplicates its `id`; no id
dedupe; `commandRegistry` collects commands only from mark descriptors, so block
commands (copy, delete, move, turn into) will require modifying it rather than
extending it; `PromptEditorSurface` registers the custom element at module scope,
which throws on import under SSR.
