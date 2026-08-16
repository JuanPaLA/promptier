# The prompt text format

The one serialization the editor reads and writes. XML tags carry structure,
markdown carries everything inside. What a host stores **is** what a model
reads — there is no separate "export" rendering.

`serialize(content)` and `parse(text)` in `core-editor/src/prompt/serialization/` are
the only implementations. Both are pure and DOM-free.

## Why hosts depend on this document

A developer using the SDK stores the string, not our JSON. That makes this
format a **permanent compatibility surface**: there is nowhere to put a version
marker that would not leak into the prompt, so the parser must accept every
shape it has ever emitted. Changes here are one-way doors from the first
external user onward. Nothing else carries a version either — `PromptContent`
dropped its tag, so `parse` is the only compatibility mechanism there is.

## Grammar

The set is closed — exactly what the block and mark registries can express.

| Construct | Text |
| --- | --- |
| Section | `<tag>` … `</tag>`, each on its own line, nestable |
| Section description | `<!-- description: … -->` as the first line inside the tag |
| Heading | `# `, `## `, `### ` (levels 1–3) |
| Paragraph | a run of plain lines |
| Ordered list | `1. item` on consecutive lines |
| Unordered list | `- item` on consecutive lines |
| Code block | ```` ```lang ```` … ```` ``` ```` |
| Bold | `**text**` |
| Inline code | `` `text` `` |

```
You are a support assistant.

<objetivos>
<!-- description: Qué debe lograr el asistente. -->

Resolver la consulta en el menor número de turnos.
</objetivos>

<reglas_de_dialogo>
<reglas_de_formato>
Responde en **markdown**.

### Detalle

1. Saluda con cortesía.
2. Identifica el problema.
</reglas_de_formato>
</reglas_de_dialogo>
```

### Section tags are identity

A section has no stored id. Its title slugifies to a tag
(`sectionTagName`), and that tag is simultaneously the serialized element, the
outline anchor and the id. Two sections whose titles slugify alike are
indistinguishable — accepted until cross-references need real identity.

A tag opens a section only when it is **balanced, block-level, and alone on its
line**. An inline `<thinking>` inside a sentence stays text, and an unclosed tag
stays text.

## Escaping

Escapes keep the codec total: any text a block can hold survives the round trip,
including text that looks like markup.

- `\`, `*` and `` ` `` are backslash-escaped inside text.
- A paragraph opening with `# `, `- `, `1. `, `<!--`, or consisting of nothing
  but a tag is prefixed with `\`.

Escapes are processed **everywhere, including inside code spans**. CommonMark
treats code spans as raw; this is a closed format of our own, and uniformity
buys a code segment that can carry a backtick, plus a simpler parser.

## Degradation

Anything outside the grammar becomes literal text — blockquotes, tables, links,
images, headings deeper than `###`. **Nothing is ever dropped**, because silent
loss would make "just give me a string" untrustworthy.

The escape hatch for literal markup is a code fence: tags inside a fence never
open a section.

## The two laws

Both are enforced by `roundTrip.test.ts`.

1. **`parse(serialize(content)) ≡ content`** — for content with no blank blocks.
2. **`serialize(parse(text))` is idempotent** — arbitrary input is *normalized*
   on the first pass, then stable. Round-tripping foreign text does not preserve
   it byte for byte; that is expected, not a bug.

## Known asymmetries

Deliberate, and covered by tests:

- **Titles degrade once.** Slugging drops case and diacritics, so
  `Reglas de diálogo` comes back as `reglas de dialogo`. Stable from then on,
  because `sectionTagName(sectionTitleFromTag(tag)) === tag`.
- **Blank blocks are dropped** — empty *or* whitespace-only. That is what makes
  the editor's trailing empty paragraph harmless, and cutting and re-pasting a
  document is enough to produce a whitespace-only one. Both sides must use the
  same test for blankness (`trim`); when they disagreed, such a block survived
  serialization and was then dropped on the way back in, so a round trip lost a
  line. A block with its own delimiters — a code fence, a section's tags — is
  never blank by this test, so a fence full of spaces survives.
- **Hard-wrapped paragraphs reflow.** Consecutive plain lines join into one
  paragraph; `BlockContent` cannot hold a line break.
- **Code spans keep their spaces.** CommonMark strips one leading and trailing
  space; we do not.
