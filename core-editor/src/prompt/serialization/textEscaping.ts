/**
 * Escaping keeps the codec total: any text a block can hold must survive
 * `parse(serialize(…))` unchanged, including text that looks like markup.
 *
 * Escapes are processed everywhere, including inside code spans. CommonMark
 * treats code spans as raw, but this is a closed format of our own and
 * uniformity buys a backtick-carrying code segment plus a simpler parser.
 */

export interface InlineEscapeRules {
  isEscapable(character: string): boolean;
}

export function escapeInlineText(text: string, rules: InlineEscapeRules): string {
  return [...text]
    .map((character) => (rules.isEscapable(character) ? `\\${character}` : character))
    .join('');
}

export function unescapeInlineText(text: string, rules: InlineEscapeRules): string {
  let result = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] === '\\' && rules.isEscapable(text[index + 1] ?? '')) {
      result += text[index + 1];
      index += 2;
      continue;
    }
    result += text[index];
    index += 1;
  }
  return result;
}

export interface BlockEscapeRules {
  isBlockStart(line: string): boolean;
}

/**
 * A paragraph whose text opens with a block marker would parse back as that
 * block. A leading backslash makes the line literal.
 */
export function escapeBlockStart(line: string, rules: BlockEscapeRules): string {
  return rules.isBlockStart(line) ? `\\${line}` : line;
}

export function unescapeBlockStart(line: string, rules: BlockEscapeRules): string {
  return line.startsWith('\\') && rules.isBlockStart(line.slice(1)) ? line.slice(1) : line;
}
