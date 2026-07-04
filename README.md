# Promptier

A business-domain editor for system prompts, built on ProseMirror.

## Structure

- `core-editor` — the editor, framework-agnostic (exposed as a Custom Element).
- `react-sdk` — React wrapper around it.
- `playground` — dev app for trying the editor with live changes.

## Getting started

```
yarn install
yarn workspace playground dev
```

See [AGENTS.md](AGENTS.md) for the project's conventions.
