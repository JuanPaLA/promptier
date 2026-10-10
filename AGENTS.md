# Promptier

A business-domain editor for LLM prompts, built on ProseMirror.

Architecture, the domain→ProseMirror descriptor seam, and the design decisions log live in [docs/architecture.md](docs/architecture.md). The prompt text format — the one serialization, and a permanent compatibility surface — is specified in [docs/format.md](docs/format.md). How a version reaches npm is in [docs/releasing.md](docs/releasing.md).

## Workspaces (yarn workspaces)

- `core-editor` — the editor itself. Internally organized by responsibility: the prompt model and its pure capabilities (`prompt`), editor contracts (`editor`), the ProseMirror implementation (`engine`), and browser packaging (`custom-element`). Its public surface (`src/index.ts`) exposes a Custom Element (`PromptEditorElement` / `registerPromptEditor`) plus plain domain data types. Nothing ProseMirror-specific is exported.
- `react-sdk` — React presentation around the Custom Element. String-first: `<PromptEditor value onChange />`; the presenter translates core snapshots and commands into UI models and callbacks. 
- `playground` — dev lib (Vite) and reference React host. It owns page layout and persistence behavior, and consumes only `react-sdk` for the editor experience.

## Rules of thumb

- `core-editor` must stay consumable without React.
- Only `core-editor/src/index.ts`'s exports are public. `core-editor/src/prompt/**`, `src/editor/**`, and `src/engine/**` are internal. `core-editor/src/custom-element/**` is the browser packaging layer that wires the engine into a Custom Element for consumption — it's what `index.ts` actually re-exports.
- Dev loop is buildless across workspaces: package `main`/`types` point at TS source directly, so editing `core-editor` or `react-sdk` while `playground`'s dev server is running hot-reloads with no explicit build step.

## Conventions

**File casing.** PascalCase ⟺ the file exports a type, interface, class or React
component (`BlockDescriptor.ts`, `SectionNodeView.ts`, `PromptEditorField.tsx`).
camelCase ⟺ it exports values or functions (`sectionDescriptor.ts`,
`promptSchema.ts`, `documentMapper.ts`).

**Stepdown rule.** Public surface first, helpers below it, in call order. Prefer OOP.

**Comments.** Oly explain what the code cannot. But ensure the code is the most cleand and expressive possible.

## Commands

```
yarn install                        # from repo root
yarn workspace playground dev       # start the playground
yarn test                           # vitest, from repo root
yarn workspace @cachai/promptier-core-editor build    # dist/ — what gets published
```

This is intentionally minimal — avoid reading more architectural intent into it than what's written above; the domain model and editor capabilities are still evolving.
