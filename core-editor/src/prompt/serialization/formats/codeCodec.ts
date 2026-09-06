import type { InlineFormatCodec } from './InlineFormatCodec';

export const codeCodec: InlineFormatCodec<'code'> = {
  format: 'code',
  openingDelimiter: '`',
  closingDelimiter: '`',
  contentMode: 'literal',
  parsePriority: 20,
  nestingRank: 10,
  canonicalRank: 30,
  escapeCharacters: ['`'],
};
