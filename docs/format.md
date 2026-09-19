# The prompt text format

The one serialization the editor reads and writes. XML tags carry structure,
markdown carries everything inside. What a host stores is the prompt source —
there is no separate editor "export" rendering. Hosts using template variables
render that source with their template engine before passing it to a model.

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
| Heading | `# `, `## `, `### ` (levels 1–3) |
| Paragraph | a run of plain lines |
| Ordered list | `1. item` on consecutive lines |
| Unordered list | `- item` on consecutive lines |
| Quote | `> text` on consecutive lines |
| Code block | ```` ```lang ```` … ```` ``` ```` |
| Bold | `**text**` |
| Italic | `_text_` |
| Inline code | `` `text` `` |

```
You are a support assistant.

<objetivos>
Objetivo principal del asistente:

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
indistinguishable by tag; references to that tag are reported as ambiguous.

A tag opens a section only when it is **balanced, block-level, and alone on its
line**. An inline `<thinking>` inside a sentence stays text, and an unclosed tag
stays text.

## Escaping

Escapes keep the codec total: any text a block can hold survives the round trip,
including text that looks like markup.

- `\`, `*`, `_` and `` ` `` are backslash-escaped inside text, except that
  complete opening and closing tags keep their underscores literal.
- Outside code spans, `\>` escapes a closing angle bracket. The serializer
  uses this when formatting across segments would otherwise spell a literal
  tag (for example, `<a_b_\>` preserves an italic `b` between `<a` and `>`).
- A paragraph opening with `# `, `- `, `1. `, `> `, or consisting of nothing
  but a tag is prefixed with `\`.

Escapes are processed **everywhere, including inside code spans**. CommonMark
treats code spans as raw; this is a closed format of our own, and uniformity
buys a code segment that can carry a backtick, plus a simpler parser.

## Degradation

Anything outside the grammar becomes literal text — tables, links, images,
headings deeper than `###`. **Nothing is ever dropped**, because silent
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
- **Hard-wrapped paragraphs reflow**, except when the paragraph contains template
  syntax: those paragraphs retain line breaks so template source is not reflowed.
- **Code spans keep their spaces.** CommonMark strips one leading and trailing
  space; we do not.

## Section references

Opening and closing tags in ordinary inline content, such as
`Follow <dialog_format_rules>.` or `See </dialog_format_rules>.`, are recognized
as section mentions without requiring backticks. Complete tags are literal
inline text: their underscores never introduce italic formatting, regardless
of whether a target exists. Resolution is separate from parsing and searches
the whole document, including nested and later sections. Exactly one matching
tag becomes a navigable reference; zero matches remain plain text and multiple
matches are marked ambiguous. Both tag forms navigate to the same section.
Renaming or deleting a target does not rewrite reference text.

Structural parsing takes precedence: balanced tags alone on their lines still
declare sections. A standalone paragraph containing a tag is escaped by the
serializer to preserve it as content. Code blocks and section titles are not
scanned for references. Mentions can cross ordinary inline formatting boundaries.

Legacy code spans containing exactly one tag remain reference candidates,
including their missing/ambiguous feedback. Code spans with other content stay
literal. The reference picker now inserts ordinary text.

Inline code now emits underscores and asterisks literally, keeping referenced
opening tags exact. Backslashes and backticks remain escaped. Previously emitted
escaped code spans remain accepted and normalize to this spelling.

## Template variables

`{{ name }}` and `{{ object.property }}` are recognized as variable references.
Whitespace around a path is accepted and preserved; the picker inserts
`{{ path }}`. A host supplies `variableSchema` separately from prompt content.
Changing the schema affects suggestions and diagnostics, never serialization.
See [variables.md](variables.md) for the public contract and limitations.

Template expressions (`{{ ... }}`), statements (`{% ... %}`), comments
(`{# ... #}`), and `verbatim` regions are lexically protected from Markdown
parsing and escaping. Quoted strings and nested brackets are respected when
finding a closing delimiter. Multiline tokens retain their contents, including
blank lines. Incomplete tokens retain the text already typed. Existing block
normalization still applies outside these regions; this is not a byte-preserving
editor for arbitrary Pebble templates.

Formatting can surround a complete token. Formatting applied to only part of a
token is removed, retaining only formats shared by its entire source; incomplete
tokens are unformatted. This prevents serialization from inserting Markdown
inside executable template syntax. The codec normalizes such partial formatting
in supplied `PromptContent`, and the editor enforces it during editing.

Code fences and inline code do not disable Pebble interpolation: simple
variables there are recognized too. Comments and `verbatim` do suppress variable
recognition. The editor does not evaluate expressions or validate control flow.
