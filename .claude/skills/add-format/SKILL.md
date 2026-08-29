---
name: add-format
description: Add a new inline format/mark (e.g. italic, strikethrough, link) to the prompt editor. Use whenever a task requires a new entry in the Format union with its ProseMirror mark and markdown rendering.
---

# Add an inline format (mark)

Read `docs/architecture.md` and [docs/format.md](../../../docs/format.md) for
context. Use `boldDescriptor` as the reference implementation. The easiest step
to forget is #4 (the codec) — a format missing there serializes wrong, or worse,
fails to parse back, without any type error.

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

4. **Codec** — a format has to survive `parse(serialize(…))`, in both files:
   - `lib/format/serialize.ts`: add the wrapper to `FORMAT_WRAP` (typecheck
     enforces this one) and insert the format at the right position in
     `FORMAT_ORDER` (typecheck does NOT — a format absent from `FORMAT_ORDER`
     silently never renders). Order is innermost-first: `code` sits innermost,
     so multi-format segments produce e.g. `` **`text`** ``.
   - `lib/format/parse.ts`: recognize the delimiter in `parseInline` and give
     the format a rank in `FORMAT_RANK`. The rank must match schema declaration
     order (`markRegistry()`), because that is the order ProseMirror reports
     marks in — a mismatch breaks the round trip on multi-format segments only.
   - if the delimiter can appear as literal text, add it to `ESCAPABLE` in
     `lib/format/textEscaping.ts`.
   - add a corpus entry to `lib/format/roundTrip.test.ts`, including one
     segment combining the new format with an existing one.

5. **Public surface** — `Format` is already exported from
   `core-editor/src/index.ts`; nothing to add unless the format introduces
   new types.

6. **Demo** — use the format in the playground's initial content
   (`playground/src/EditorPlayground.tsx`).

## Verify

- `corepack yarn test`
- `corepack yarn workspaces foreach -A run typecheck`
- Start the playground (preview server `playground-dev`) and confirm: the
  keybinding/input rule applies the mark, the Prompt JSON pane shows the format
  on the segment, the Prompt text pane wraps it correctly — including combined
  with an existing format (nesting order) — and the Round-trip pane still reads
  **● stable**.
