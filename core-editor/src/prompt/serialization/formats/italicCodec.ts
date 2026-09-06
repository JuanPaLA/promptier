import type { InlineFormatCodec } from './InlineFormatCodec';

export const italicCodec: InlineFormatCodec<'italic'> = {
  format: 'italic',
  openingDelimiter: '_',
  closingDelimiter: '_',
  contentMode: 'nested',
  parsePriority: 10,
  nestingRank: 20,
  canonicalRank: 20,
  escapeCharacters: ['_'],
};
