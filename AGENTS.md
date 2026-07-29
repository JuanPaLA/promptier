# Promptier

A business-domain editor for LLM prompts, built on ProseMirror.

Architecture, the domain→ProseMirror descriptor seam, and the design decisions log live in [docs/architecture.md](docs/architecture.md).

## Workspaces (yarn workspaces)

- `core-editor` — the editor itself. Framework-agnostic: no React here yet, until needed. Internally organized as clean architecture (`domain` / `app` / `infrastructure`). Its public surface (`src/index.ts`) exposes a Custom Element (`PromptEditorElement` / `registerPromptEditor`) plus plain domain data types. Nothing ProseMirror-specific is exported.
- `react-sdk` — thin React wrapper around the Custom Element (`PromptEditorField` for the controlled component, `usePromptEditor` for headless use). Translates the element's property/event contract into React props/callbacks. No editor logic of its own.
- `playground` — dev app (Vite) for trying the editor with live changes. A plain consumer of `react-sdk`, nothing else.

## Rules of thumb

- `core-editor` must stay consumable without React (plain HTML, iframe, any framework). If a change forces a non-React consumer to need React, it's in the wrong workspace.
- Only `core-editor/src/index.ts`'s exports are public. `core-editor/src/core/**` is the clean-architecture engine (domain/app/infrastructure), fully internal. `core-editor/src/element/**` is the outer packaging layer (the Custom Element) that wires the engine up for consumption — it's what `index.ts` actually re-exports.
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
evaluation (that's a TDZ error). `app/rendering/toMarkdown.ts` is the reference.

**Comments.** Explain what the code cannot. Keep ProseMirror lore that isn't
derivable from the code (`a PM command called without dispatch is a dry run`) and
the reason a non-obvious choice was made. Don't restate the architecture — that
belongs in `docs/architecture.md`, and duplicating it there guarantees drift.
When a comment exists to explain position arithmetic, extract a named operation
in `infrastructure/prosemirror/editing/` instead.

## Commands

```
yarn install                    # from repo root
yarn workspace playground dev   # start the playground
```

This is intentionally minimal — avoid reading more architectural intent into it than what's written above; the domain model and editor capabilities are still evolving.
