export interface TemplateToken {
  readonly start: number;
  readonly end: number;
  readonly kind: 'expression' | 'statement' | 'comment' | 'verbatim';
  readonly text: string;
  readonly body: string;
  readonly complete: boolean;
}

/** Lexical preservation only: Pebble remains responsible for evaluation. */
export class TemplateSyntax {
  tokens(text: string): readonly TemplateToken[] {
    const tokens: TemplateToken[] = [];
    for (let index = 0; index < text.length;) {
      const token = this.at(text, index);
      if (token) { tokens.push(token); index = token.end; }
      else index += 1;
    }
    return tokens;
  }

  at(text: string, start: number): TemplateToken | undefined {
    const opening = text.slice(start, start + 2);
    const kind = opening === '{{' ? 'expression' : opening === '{%' ? 'statement' : opening === '{#' ? 'comment' : undefined;
    if (!kind) return undefined;
    const closing = kind === 'expression' ? '}}' : kind === 'statement' ? '%}' : '#}';
    const close = this.closingAt(text, start + 2, closing, kind === 'comment');
    let end = close < 0 ? text.length : close + 2;
    const body = text.slice(start + 2, close < 0 ? end : close);
    if (kind === 'statement' && /^-?\s*verbatim\s*-?$/.test(body)) {
      const terminator = /{%\-?\s*endverbatim\s*\-?%}/.exec(text.slice(end));
      end = terminator ? end + terminator.index + terminator[0].length : text.length;
      return { start, end, kind: 'verbatim', text: text.slice(start, end), body, complete: !!terminator };
    }
    return { start, end, kind, text: text.slice(start, end), body, complete: close >= 0 };
  }

  transformOutside(text: string, transform: (text: string) => string): string {
    let result = '';
    let index = 0;
    for (const token of this.tokens(text)) {
      result += transform(text.slice(index, token.start)) + token.text;
      index = token.end;
    }
    return result + transform(text.slice(index));
  }

  logicalLines(text: string): string[] {
    const lines: string[] = [];
    let start = 0;
    let fenced = false;
    for (let index = 0; index < text.length;) {
      if (index === start) {
        const lineEnd = text.indexOf('\n', index);
        const line = text.slice(index, lineEnd < 0 ? text.length : lineEnd);
        if (fenced ? /^```\s*$/.test(line) : /^```\w*\s*$/.test(line)) fenced = !fenced;
      }
      const token = fenced ? undefined : this.at(text, index);
      if (token) index = token.end;
      else {
        if (text[index] === '\n') { lines.push(text.slice(start, index)); start = index + 1; }
        index += 1;
      }
    }
    lines.push(text.slice(start));
    return lines;
  }

  joinLines(lines: readonly string[]): string {
    return lines.join(lines.some((line) => this.tokens(line).length > 0) ? '\n' : ' ');
  }

  private closingAt(text: string, start: number, closing: string, comment: boolean): number {
    let quote = '';
    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
      const character = text[index];
      if (comment) {
        if (text.startsWith(closing, index)) return index;
      } else if (quote) {
        if (character === '\\') index += 1;
        else if (character === quote) quote = '';
      } else if (depth === 0 && text.startsWith(closing, index)) return index;
      else if (character === '"' || character === "'") quote = character;
      else if ('([{'.includes(character)) depth += 1;
      else if (')]}'.includes(character)) depth = Math.max(0, depth - 1);
    }
    return -1;
  }
}
