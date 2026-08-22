# Promptier

A business-domain editor for LLM prompts, built on ProseMirror.

Architecture, the domain→ProseMirror descriptor seam, and the design decisions log live in [docs/architecture.md](docs/architecture.md). The prompt text format — the one serialization, and a permanent compatibility surface — is specified in [docs/format.md](docs/format.md).

## Workspaces (yarn workspaces)

- `core-editor` — the editor itself. Framework-agnostic: no React here yet, until needed. Internally organized by responsibility: the prompt model and its pure capabilities (`prompt`), editor contracts (`editor`), the ProseMirror implementation (`engine`), and browser packaging (`custom-element`). Its public surface (`src/index.ts`) exposes a Custom Element (`PromptEditorElement` / `registerPromptEditor`) plus plain domain data types. Nothing ProseMirror-specific is exported.
- `react-sdk` — React presentation around the Custom Element: one private `PromptEditorController` (`app`), a root view-model hook, and prop-driven editor widgets plus styles (`ui`). String-first: `<PromptEditor value onChange />`; only the root widget translates core snapshots and commands into UI models and callbacks. It is a **library, not an application** — no `createRoot`; the host supplies the composition root. See [docs/refactor-plan.md](docs/refactor-plan.md).
- `playground` — dev app (Vite) and reference React host. It owns page layout and persistence behavior, and consumes only `react-sdk` for the editor experience.
- `examples/` — `standalone.html`, the `<script src>` integration in one file. Serve it with the `examples` launch config after building `core-editor`.

## Rules of thumb

- `core-editor` must stay consumable without React (plain HTML, iframe, any framework). If a change forces a non-React consumer to need React, it's in the wrong workspace.
- Only `core-editor/src/index.ts`'s exports are public. `core-editor/src/prompt/**`, `src/editor/**`, and `src/engine/**` are internal. `core-editor/src/custom-element/**` is the browser packaging layer that wires the engine into a Custom Element for consumption — it's what `index.ts` actually re-exports.
- Dev loop is buildless across workspaces: package `main`/`types` point at TS source directly, so editing `core-editor` or `react-sdk` while `playground`'s dev server is running hot-reloads with no explicit build step.

## Conventions

**Naming.** The brand lives in the package name, not in identifiers. Prefix with
the brand only when the unprefixed name would be too generic in the consumer's
namespace — Lexical exports `LexicalComposer` because `<Composer>` collides with
everything; TipTap exports `EditorContent`. `PromptEditorField` is specific
enough, so it isn't `PromptierEditorField`. Keep the domain qualifier as narrow
as the product actually is: it's a *prompt* editor, not only a system-prompt one.

**File casing.** PascalCase ⟺ the file exports a type, interface, class or React
component (`BlockDescriptor.ts`, `SectionNodeView.ts`, `PromptEditorField.tsx`).
camelCase ⟺ it exports values or functions (`sectionDescriptor.ts`,
`promptSchema.ts`, `documentMapper.ts`).

**Stepdown rule.** Public surface first, helpers below it, in call order. Prefer
`function` declarations over `const` arrows for module-level helpers — hoisting
is what makes the ordering possible. A `const` may sit below a function that
reads it *at call time*; it may not if the function runs during module
evaluation (that's a TDZ error). `prompt/serialization/serialize.ts` is the reference.

**Comments.** Explain what the code cannot. Keep ProseMirror lore that isn't
derivable from the code (`a PM command called without dispatch is a dry run`) and
the reason a non-obvious choice was made. Don't restate the architecture — that
belongs in `docs/architecture.md`, and duplicating it there guarantees drift.
When a comment exists to explain position arithmetic, extract a named operation
in `engine/prosemirror/editing/` instead.

## Commands

```
yarn install                        # from repo root
yarn workspace playground dev       # start the playground
yarn test                           # vitest, from repo root
yarn workspace core-editor build    # dist/ — needed by examples/standalone.html
```

This is intentionally minimal — avoid reading more architectural intent into it than what's written above; the domain model and editor capabilities are still evolving.
