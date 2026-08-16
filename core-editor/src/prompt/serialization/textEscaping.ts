/**
 * Escaping keeps the codec total: any text a block can hold must survive
 * `parse(serialize(…))` unchanged, including text that looks like markup.
 *
 * Escapes are processed everywhere, including inside code spans. CommonMark
 * treats code spans as raw, but this is a closed format of our own and
 * uniformity buys a backtick-carrying code segment plus a simpler parser.
 */

const ESCAPABLE = '\\*`';

export function isEscapable(char: string): boolean {
  return ESCAPABLE.includes(char);
}

export function escapeInlineText(text: string): string {
  return text.replace(/[\\*`]/g, (char) => `\\${char}`);
}

export function unescapeInlineText(text: string): string {
  return text.replace(/\\([\\*`])/g, '$1');
}

/**
 * A paragraph whose text opens with a block marker would parse back as that
 * block. A leading backslash makes the line literal.
 */
export function escapeBlockStart(line: string): string {
  return startsBlock(line) ? `\\${line}` : line;
}

export function unescapeBlockStart(line: string): string {
  return line.startsWith('\\') && startsBlock(line.slice(1)) ? line.slice(1) : line;
}

function startsBlock(line: string): boolean {
  return BLOCK_MARKER.test(line) || BARE_TAG.test(line) || COMMENT_OPEN.test(line);
}

const BLOCK_MARKER = /^(#{1,3} |- |\d+\. )/;

/** Only a line that is *nothing but* a tag needs escaping — see docs/format.md. */
const BARE_TAG = /^<\/?[a-zA-Z][\w-]*>$/;

/** A section's first line is read as its description; a paragraph must not be. */
const COMMENT_OPEN = /^<!--/;
