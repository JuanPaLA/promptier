/** Inline formatting a segment of text can carry. */
export type Format = 'bold' | 'code';

/** A stretch of text sharing exactly the same formatting. */
export interface TextSegment {
  readonly text: string;
  readonly formats?: Format[];
}

/** A block's formatted text: an ordered list of segments, concatenated left to right. */
export type BlockContent = TextSegment[];

/** The behavior for a format, kept beside the data rather than on it (mirrors BlockDefinition). */
export interface FormatDefinition {
  readonly format: Format;
  wrap(inner: string): string;
}

/** Lift a plain string into RichText — one unformatted segment (empty string → no segments). */
export const richText = (text: string): BlockContent => (text ? [{ text }] : []);
