import type { Format } from '../../model/Format';
import type {
  InlineFormatCodec,
  InlineFormatCodecMap,
} from './InlineFormatCodec';

export class InlineFormatRegistry {
  private readonly codecs: readonly InlineFormatCodec[];
  private readonly codecsByFormat = new Map<Format, InlineFormatCodec>();
  private readonly parsers: readonly InlineFormatCodec[];
  private readonly escapableCharacters: ReadonlySet<string>;

  constructor(codecsByFormat: InlineFormatCodecMap) {
    this.codecs = Object.entries(codecsByFormat).map(([registeredFormat, codec]) => {
      validateCodec(registeredFormat, codec);
      if (this.codecsByFormat.has(codec.format)) {
        throw new Error(`An inline format codec is already registered for "${codec.format}".`);
      }
      this.codecsByFormat.set(codec.format, codec);
      return codec;
    });
    validateUniqueOpeningDelimiters(this.codecs);
    this.parsers = [...this.codecs].sort(compareParsingOrder);
    this.escapableCharacters = new Set([
      '\\',
      ...this.codecs.flatMap((codec) => codec.escapeCharacters),
    ]);
  }

  all(): readonly InlineFormatCodec[] {
    return this.codecs;
  }

  get(format: Format): InlineFormatCodec {
    const codec = this.codecsByFormat.get(format);
    if (!codec) throw new Error(`No inline format codec is registered for "${format}".`);
    return codec;
  }

  openingAt(text: string, index: number): InlineFormatCodec | undefined {
    return this.parsers.find((codec) => text.startsWith(codec.openingDelimiter, index));
  }

  canonicalize(formats: readonly Format[]): Format[] {
    return [...new Set(formats)].sort(
      (left, right) =>
        this.get(left).canonicalRank - this.get(right).canonicalRank ||
        left.localeCompare(right),
    );
  }

  nestingOrder(formats: readonly Format[]): InlineFormatCodec[] {
    return this.canonicalize(formats)
      .map((format) => this.get(format))
      .sort(
        (left, right) =>
          left.nestingRank - right.nestingRank || left.format.localeCompare(right.format),
      );
  }

  isEscapable(character: string): boolean {
    return this.escapableCharacters.has(character);
  }
}

function validateUniqueOpeningDelimiters(codecs: readonly InlineFormatCodec[]): void {
  const formatsByDelimiter = new Map<string, Format>();
  for (const codec of codecs) {
    const existing = formatsByDelimiter.get(codec.openingDelimiter);
    if (existing) {
      throw new Error(
        `Inline formats "${existing}" and "${codec.format}" use the same opening delimiter.`,
      );
    }
    formatsByDelimiter.set(codec.openingDelimiter, codec.format);
  }
}

function validateCodec(registeredFormat: string, codec: InlineFormatCodec): void {
  if (codec.format !== registeredFormat) {
    throw new Error(
      `Inline format codec registered as "${registeredFormat}" declares "${codec.format}".`,
    );
  }
  if (codec.openingDelimiter.length === 0 || codec.closingDelimiter.length === 0) {
    throw new Error(`Inline format "${codec.format}" must declare non-empty delimiters.`);
  }
  for (const character of codec.escapeCharacters) {
    if ([...character].length !== 1) {
      throw new Error(
        `Inline format "${codec.format}" escape entries must be single characters.`,
      );
    }
  }
}

function compareParsingOrder(left: InlineFormatCodec, right: InlineFormatCodec): number {
  return (
    right.parsePriority - left.parsePriority ||
    right.openingDelimiter.length - left.openingDelimiter.length ||
    left.format.localeCompare(right.format)
  );
}
