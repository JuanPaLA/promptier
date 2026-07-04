# Promptier

A business-domain editor for system prompts, built on ProseMirror.

## Workspaces (yarn workspaces)

- `core-editor` — the editor itself. Framework-agnostic: no React here yet, until needed. Internally organized as clean architecture (`domain` / `app` / `infrastructure`). Its public surface (`src/index.ts`) exposes a Custom Element (`SystemPromptEditorElement` / `registerSystemPromptEditor`) plus plain domain data types. Nothing ProseMirror-specific is exported.
- `react-sdk` — thin React wrapper around the Custom Element (`SystemPromptEditorField`). Translates the element's property/event contract into React props/callbacks. No editor logic of its own.
- `playground` — dev app (Vite) for trying the editor with live changes. A plain consumer of `react-sdk`, nothing else.

## Rules of thumb

- `core-editor` must stay consumable without React (plain HTML, iframe, any framework). If a change forces a non-React consumer to need React, it's in the wrong workspace.
- Only `core-editor/src/index.ts`'s exports are public. `core-editor/src/core/**` is the clean-architecture engine (domain/app/infrastructure), fully internal. `core-editor/src/element/**` is the outer packaging layer (the Custom Element) that wires the engine up for consumption — it's what `index.ts` actually re-exports.
- Naming stays domain-descriptive (`SystemPromptEditorElement`, not `PromptierElement`) — the product name belongs at the npm scope/package level, not in class or component names.
- Dev loop is buildless across workspaces: package `main`/`types` point at TS source directly, so editing `core-editor` or `react-sdk` while `playground`'s dev server is running hot-reloads with no explicit build step.

## Commands

```
yarn install                    # from repo root
yarn workspace playground dev   # start the playground
```

This is intentionally minimal — avoid reading more architectural intent into it than what's written above; the domain model and editor capabilities are still evolving.
