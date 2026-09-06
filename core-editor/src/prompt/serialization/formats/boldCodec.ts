import type { InlineFormatCodec } from './InlineFormatCodec';

export const boldCodec: InlineFormatCodec<'bold'> = {
  format: 'bold',
  openingDelimiter: '**',
  closingDelimiter: '**',
  contentMode: 'nested',
  parsePriority: 30,
  nestingRank: 30,
  canonicalRank: 10,
  escapeCharacters: ['*'],
};
