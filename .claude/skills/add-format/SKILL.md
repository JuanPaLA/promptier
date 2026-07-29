---
name: add-format
description: Add a new inline format/mark (e.g. italic, strikethrough, link) to the prompt editor. Use whenever a task requires a new entry in the Format union with its ProseMirror mark and markdown rendering.
---

# Add an inline format (mark)

Read `docs/architecture.md` for context. Use `BoldDescriptor` as the
reference implementation. The easiest step to forget is #4 (markdown) — a
format missing there exports wrong markdown without any type error.

## Checklist

1. **Domain** — add the format name to the `Format` union in
   `core-editor/src/core/domain/Format.ts`. Formats are plain string
   literals carried on `TextSegment.formats`.

2. **Descriptor** —
   `core-editor/src/core/infrastructure/prosemirror/descriptors/marks/<name>Descriptor.ts`
   (camelCase file: it exports a value), implementing `MarkDescriptor`: `format`
   (the `Format` string — it doubles as the mark's schema name, which is how
   `blockContentMapper` maps marks back to formats), `markSpec`
   (`toDOM`/`parseDOM`, built in a `function <name>MarkSpec()` declared below the
   descriptor), plus optional `inputRules` and `keymap` (follow
   `boldDescriptor`'s pattern).

3. **Register** — add it to `markRegistry()` in
   `descriptors/marks/markDescriptorRegistry.ts` (typecheck enforces this:
   the registry is a mapped type over `Format`).

4. **Markdown** — in `core-editor/src/core/app/rendering/toMarkdown.ts`:
   - add the wrapper to `FORMAT_WRAP` (typecheck enforces this one), and
   - insert the format at the right position in `FORMAT_ORDER` (typecheck
     does NOT enforce this — a format absent from `FORMAT_ORDER` silently
     never renders). Order is innermost-first: `code` sits innermost so
     multi-format segments produce e.g. **`text`**.

5. **Public surface** — `Format` is already exported from
   `core-editor/src/index.ts`; nothing to add unless the format introduces
   new types.

6. **Demo** — use the format in the playground's initial content
   (`playground/src/EditorPlayground.tsx`).

## Verify

- `corepack yarn workspaces foreach -A run typecheck`
- Start the playground (preview server `playground-dev`) and confirm: the
  keybinding/input rule applies the mark, the Live Domain State panel shows
  the format on the segment, and the Markdown panel wraps the text correctly
  — including combined with an existing format (nesting order).
