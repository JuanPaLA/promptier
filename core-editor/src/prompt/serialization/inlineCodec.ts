import type { BlockContent, TextSegment } from '../model/BlockContent';
import type { Format } from '../model/Format';
import type { InlineFormatCodec } from './formats/InlineFormatCodec';
import { inlineFormatRegistry } from './formats/inlineFormatCodecs';
import { escapeInlineText, unescapeInlineText } from './textEscaping';

export function parseInline(text: string): BlockContent {
  return parseInlineText(text);
}

export function serializeInline(content: BlockContent): string {
  return content.map(segmentToText).join('');
}

function parseInlineText(text: string): BlockContent {
  const segments: TextSegment[] = [];
  let plain = '';
  let index = 0;

  function flush(): void {
    pushSegment(segments, { text: plain });
    plain = '';
  }

  while (index < text.length) {
    if (
      text[index] === '\\' &&
      inlineFormatRegistry.isEscapable(text[index + 1] ?? '')
    ) {
      plain += text[index + 1];
      index += 2;
      continue;
    }

    const codec = inlineFormatRegistry.openingAt(text, index);
    if (codec) {
      const contentStart = index + codec.openingDelimiter.length;
      const end = findClosingDelimiter(text, contentStart, codec);
      if (end !== -1) {
        flush();
        appendFormattedContent(segments, text.slice(contentStart, end), codec);
        index = end + codec.closingDelimiter.length;
        continue;
      }
    }

    plain += text[index];
    index += 1;
  }

  flush();
  return segments;
}

function appendFormattedContent(
  segments: TextSegment[],
  text: string,
  codec: InlineFormatCodec,
): void {
  if (codec.contentMode === 'literal') {
    pushSegment(segments, {
      text: unescapeInlineText(text, inlineFormatRegistry),
      formats: [codec.format],
    });
    return;
  }

  for (const segment of parseInlineText(text)) {
    pushSegment(segments, withFormat(segment, codec.format));
  }
}

/** The next unescaped closing delimiter at or after `from`, or -1. */
function findClosingDelimiter(
  text: string,
  from: number,
  codec: InlineFormatCodec,
): number {
  let index = from;
  while (index < text.length) {
    if (text[index] === '\\' && inlineFormatRegistry.isEscapable(text[index + 1] ?? '')) {
      index += 2;
      continue;
    }
    if (text.startsWith(codec.closingDelimiter, index)) return index;
    index += 1;
  }
  return -1;
}

/** Adjacent equally-formatted segments have one canonical representation. */
function pushSegment(segments: TextSegment[], segment: TextSegment): void {
  if (segment.text.length === 0) return;
  const last = segments[segments.length - 1];
  if (last && sameFormats(last.formats, segment.formats)) {
    segments[segments.length - 1] = { ...last, text: last.text + segment.text };
    return;
  }
  segments.push(segment);
}

function withFormat(segment: TextSegment, format: Format): TextSegment {
  return {
    text: segment.text,
    formats: inlineFormatRegistry.canonicalize([...(segment.formats ?? []), format]),
  };
}

function sameFormats(left: Format[] | undefined, right: Format[] | undefined): boolean {
  const a = left ?? [];
  const b = right ?? [];
  return a.length === b.length && a.every((format, index) => format === b[index]);
}

function segmentToText(segment: TextSegment): string {
  const codecs = inlineFormatRegistry.nestingOrder(segment.formats ?? []);
  const literal = codecs.find((codec) => codec.contentMode === 'literal');
  const escaping = literal
    ? { isEscapable: (character: string) => character === '\\' || codecs.some((codec) => codec.escapeCharacters.includes(character)) }
    : inlineFormatRegistry;
  return codecs.reduce(
    (inner, codec) => `${codec.openingDelimiter}${inner}${codec.closingDelimiter}`,
    escapeInlineText(segment.text, escaping),
  );
}
