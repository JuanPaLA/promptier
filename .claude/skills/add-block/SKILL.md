---
name: add-block
description: Add a new block type (e.g. list, code block, container) to the prompt editor. Use whenever a task requires a new blockType across domain, ProseMirror descriptor, markdown rendering, and exports.
---

# Add a block type

Read `docs/architecture.md` (section "The descriptor seam") for context. A new
block touches every file below; missing one is a silent bug, so walk the
checklist in order and don't skip verification.

Use `HeadingBlock` as the reference for a leaf block, `SectionBlock` for a
container block.

## Checklist

1. **Domain interface** — `core-editor/src/core/domain/blocks/<Name>Block.ts`:
   `interface <Name>Block extends Block` with `blockType: '<name>'` and its
   data. Leaf text blocks carry `content: BlockContent`; container blocks
   carry `children: Block[]` instead. Everything must be plain and
   JSON-serializable.

2. **Union** — add it to `AnyBlock` in
   `core-editor/src/core/domain/blocks/blockRegistry.ts` and to `BlockType` in
   `core-editor/src/core/domain/Block.ts`.

3. **Descriptor** —
   `core-editor/src/core/infrastructure/prosemirror/blocksDescriptors/<Name>Descriptor.ts`,
   implementing `BlockDescriptor<<Name>Block>`:
   - `nodeSpec` with `group: 'block'` (unless intentionally non-top-level).
   - Both mapping directions. Delegate inline text to
     `richTextToNodes`/`richTextFromNode` from `BlockContentMapper`.
   - Container blocks: map children through the injected `mapChild` callback —
     never import the registry from a descriptor (cycle).
   - Auxiliary nodes (like section's title) go in `extraNodes`.
   - Optional: `inputRules` (typing shortcut), `keymaps`, `nodeView`
     (custom DOM/behavior; keep presentation state out of the document —
     see `SectionNodeView`).

4. **Register** — add the descriptor to `blockRegistry` in
   `blocksDescriptors/blockDescriptorRegistry.ts`. Registry order matters:
   paragraph stays first (it's the doc's default block).

5. **Markdown** — add the `case '<name>':` to `blockToMarkdown` in
   `core-editor/src/core/app/rendering/toMarkdown.ts`. Container blocks
   recurse via `blocksToMarkdown(children, depth + 1)`. The `default` branch
   is an exhaustiveness check — typecheck fails until the case exists.

6. **Public surface** — export the block's type from
   `core-editor/src/index.ts`.

7. **Styles** — if the block needs structural CSS, add it to the injected
   sheet in `core-editor/src/core/infrastructure/prosemirror/editorStyles.ts`.

8. **Demo** — add an instance to the initial content in
   `playground/src/EditorPlayground.tsx` so the walking skeleton shows it.

## Verify

- `corepack yarn workspaces foreach -A run typecheck`
- Start the playground (preview server `playground-dev`) and confirm:
  the block renders, editing round-trips (Live Domain State panel shows the
  expected JSON), and the Markdown panel shows the expected output.
