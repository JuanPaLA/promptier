import type { BlockContent } from '../BlockContent';

export interface QuoteBlock {
  readonly blockType: 'quote';
  readonly content: BlockContent;
}
