# Promptier

A business-domain editor for LLM prompts, built on ProseMirror.

Architecture, the domain→ProseMirror descriptor seam, and the design decisions log live in [docs/architecture.md](docs/architecture.md). The prompt text format — the one serialization, and a permanent compatibility surface — is specified in [docs/format.md](docs/format.md).

## Workspaces (yarn workspaces)

- `core-editor` — the editor itself. Internally organized by responsibility: the prompt model and its pure capabilities (`prompt`), editor contracts (`editor`), the ProseMirror implementation (`engine`), and browser packaging (`custom-element`). Its public surface (`src/index.ts`) exposes a Custom Element (`PromptEditorElement` / `registerPromptEditor`) plus plain domain data types. Nothing ProseMirror-specific is exported.
- `react-sdk` — React presentation around the Custom Element. String-first: `<PromptEditor value onChange />`; the presenter translates core snapshots and commands into UI models and callbacks. 
- `playground` — dev app (Vite) and reference React host. It owns page layout and persistence behavior, and consumes only `react-sdk` for the editor experience.

## Rules of thumb

- `core-editor` must stay consumable without React.
- Only `core-editor/src/index.ts`'s exports are public. `core-editor/src/prompt/**`, `src/editor/**`, and `src/engine/**` are internal. `core-editor/src/custom-element/**` is the browser packaging layer that wires the engine into a Custom Element for consumption — it's what `index.ts` actually re-exports.
- Dev loop is buildless across workspaces: package `main`/`types` point at TS source directly, so editing `core-editor` or `react-sdk` while `playground`'s dev server is running hot-reloads with no explicit build step.

## Conventions

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
