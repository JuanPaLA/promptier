# Architecture

How the editor is layered, how domain blocks become ProseMirror nodes, and
where to plug in when extending it. Read [AGENTS.md](../AGENTS.md) first for
the workspace layout; this document covers the inside of `core-editor` and the
contracts between workspaces.

## Layers

```
core-editor
├─ src/core/domain/          plain serializable data types — no ProseMirror, no DOM
├─ src/core/app/             ports & pure use-cases (PromptEditor, toMarkdown)
├─ src/core/infrastructure/  ProseMirror implementation (schema, mappers, descriptors)
└─ src/element/              outer packaging: the Custom Element that index.ts re-exports
react-sdk                    thin React wrapper over the element's property/event contract
playground                   reference consumer (Vite dev app)
```

Dependency rule: `domain` knows nothing; `app` knows `domain`; `infrastructure`
implements `app` ports using `domain` types; `element` wires infrastructure up
for consumption. Nothing ProseMirror-specific crosses `index.ts`.

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
(`infrastructure/prosemirror/blockDescriptors/`). It bundles everything the
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
  descriptor's `nodeSpec` (`Schema.ts`), so descriptors receive it as an
  argument.
- **Recursion is injected.** Container blocks map their children through a
  `mapChild` callback provided by the registry, instead of importing the
  registry (which imports them).

`blockDescriptorRegistry.ts` is the single integration point: it maps
`BlockType → descriptor` and derives everything the editor consumes
(`blockDescriptors` for the schema, `blockInputRules`, `blockKeymaps`,
`blockNodeViews`, and the two mapping entry points used by `DocumentMapper`).
Registry order matters: the first block-group node becomes the doc's default
block (paragraph).

Marks follow the same pattern in miniature: `MarkDescriptor` +
`markDescriptorRegistry` provide mark specs, input rules and keymaps.
`BlockContentMapper` centralizes the inline translation (domain `TextSegment`
formats ⇄ ProseMirror marks) so block descriptors delegate instead of each
reimplementing it.

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
- Structural editor CSS is injected once per document (`editorStyles.ts`)
  because the element mounts in light DOM and `core-editor` has no CSS
  pipeline.

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
to XML tags (`<dialogue_rules>…</dialogue_rules>`); alternative renderers can
be added beside `toMarkdown` without touching the domain.

## Consumption chain

- `SystemPromptEditorElement` (Custom Element) is the public surface:
  a `content` property (get/set `PromptContent`) and a `change` CustomEvent
  carrying the new content. That's the whole contract.
- `react-sdk`'s `SystemPromptEditorField` only translates that contract into
  `content`/`onChange` props. No editor logic.
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

Known gaps (accepted for the walking skeleton): no editing UI for section
`description`; copy/pasting a section duplicates its `id`; no id dedupe.
