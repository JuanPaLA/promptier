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
   `interface <Name>Block` (it extends nothing — there is no base interface)
   declaring `readonly blockType: '<name>'` plus its data. Leaf text blocks
   carry `content: BlockContent`; container blocks carry `children: Block[]`
   instead. Everything must be plain and JSON-serializable.

2. **Union** — add it to the `Block` union in
   `core-editor/src/core/domain/Block.ts`. That's the single source of truth:
   `BlockType` derives from it, and adding it here is what makes steps 4 and 5
   fail to compile until you do them.

3. **Descriptor** —
   `core-editor/src/core/infrastructure/prosemirror/descriptors/blocks/<name>Descriptor.ts`
   (camelCase file: it exports a value), implementing `BlockDescriptor<<Name>Block>`:
   - `nodeSpec` with `group: 'block'` (unless intentionally non-top-level).
     Build it in a `function <name>NodeSpec()` declared *below* the descriptor —
     public surface first (see AGENTS.md, Conventions).
   - Both mapping directions. Delegate inline text to
     `blockContentToNodes`/`blockContentFromNode` from `mapping/blockContentMapper`.
     Keep both directions pure — never mint ids or read the clock while mapping.
   - Container blocks: map children through the injected `mapChild` callback —
     never import the registry from a descriptor (cycle).
   - Auxiliary nodes (like section's title) go in `extraNodes`.
   - Optional: `inputRules` (typing shortcut), `keymaps`, `nodeView`
     (custom DOM/behavior; keep presentation state out of the document —
     see `SectionNodeView`).
   - For anything that moves the caret or replaces a block, use the named
     operations in `editing/blockTransactions.ts` instead of computing
     positions.

4. **Register** — add the descriptor to `blockRegistry()` in
   `descriptors/blocks/blockDescriptorRegistry.ts`. Registry order matters:
   paragraph stays first (it's the doc's default block).

5. **Codec** — the block must survive a round trip through the text format, or
   saving silently loses it. Read [docs/format.md](../../../docs/format.md)
   first, then:
   - add the `case '<name>':` to `blockToText` in
     `core-editor/src/core/app/format/serialize.ts` (container blocks recurse
     via `blocksToText(children)`). The `default` branch is an exhaustiveness
     check — typecheck fails until the case exists.
   - teach `parseBlocks` in `format/parse.ts` to recognize it, and add it to
     `startsBlock` so a paragraph doesn't swallow it.
   - if its text form could collide with plain paragraph text, extend
     `startsBlock` in `format/textEscaping.ts` so paragraphs escape it.
   - add a corpus entry to `format/roundTrip.test.ts`. Nothing about the parser
     is checkable by reading — `yarn test` is the verification.

6. **Public surface** — export the block's type from
   `core-editor/src/index.ts`.

7. **Styles** — if the block needs structural CSS, add it to the injected
   sheet in
   `core-editor/src/core/infrastructure/prosemirror/styles/editorStyles.ts`.

8. **Demo** — add an instance to the initial content in
   `playground/src/EditorPlayground.tsx` so the walking skeleton shows it.

## Verify

- `corepack yarn test`
- `corepack yarn workspaces foreach -A run typecheck`
- Start the playground (preview server `playground-dev`) and confirm: the block
  renders, the Prompt JSON pane shows the expected domain shape, the Prompt text
  pane shows the expected serialization, and the Round-trip pane still reads
  **● stable**.
