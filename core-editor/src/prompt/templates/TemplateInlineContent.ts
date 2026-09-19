import type { BlockContent, TextSegment } from '../model/BlockContent';
import type { Format } from '../model/Format';
import { TemplateSyntax } from './TemplateSyntax';

/** Template source can carry surrounding formatting, never markdown inside it. */
export class TemplateInlineContent {
  normalize(content: BlockContent): BlockContent {
    const tokens = new TemplateSyntax().tokens(content.map((segment) => segment.text).join(''));
    if (!tokens.length) return content;
    const result: BlockContent = [];
    let position = 0;
    for (const token of tokens) {
      this.slice(content, position, token.start).forEach((segment) => this.append(result, segment));
      const pieces = this.slice(content, token.start, token.end);
      const formats = token.complete ? this.commonFormats(pieces) : [];
      this.append(result, { text: token.text, ...(formats.length ? { formats } : {}) });
      position = token.end;
    }
    this.slice(content, position, Infinity).forEach((segment) => this.append(result, segment));
    return result;
  }

  private slice(content: BlockContent, from: number, to: number): BlockContent {
    const result: BlockContent = [];
    let position = 0;
    for (const segment of content) {
      const start = Math.max(from - position, 0);
      const end = Math.min(to - position, segment.text.length);
      if (end > start) result.push({ ...segment, text: segment.text.slice(start, end) });
      position += segment.text.length;
    }
    return result;
  }

  private commonFormats(segments: BlockContent): Format[] {
    return (segments[0]?.formats ?? []).filter((format) => segments.every((segment) => segment.formats?.includes(format)));
  }

  private append(result: BlockContent, segment: TextSegment): void {
    const previous = result[result.length - 1];
    const formats = segment.formats ?? [];
    if (previous && (previous.formats?.length ?? 0) === formats.length
      && formats.every((format) => previous.formats?.includes(format))) {
      result[result.length - 1] = { ...previous, text: previous.text + segment.text };
    } else result.push(segment);
  }
}
