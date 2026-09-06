import type { Format } from '../../model/Format';

export interface InlineFormatCodec<F extends Format = Format> {
  readonly format: F;
  readonly openingDelimiter: string;
  readonly closingDelimiter: string;
  readonly contentMode: 'nested' | 'literal';
  /** Higher-priority codecs get the first chance to consume an opening token. */
  readonly parsePriority: number;
  /** Lower ranks are wrapped first and therefore sit inside higher-ranked formats. */
  readonly nestingRank: number;
  /** Stable order for formats stored together on a TextSegment. */
  readonly canonicalRank: number;
  /** Single characters that must be escaped when they occur as literal text. */
  readonly escapeCharacters: readonly string[];
}

export type InlineFormatCodecMap = {
  readonly [F in Format]: InlineFormatCodec<F>;
};
