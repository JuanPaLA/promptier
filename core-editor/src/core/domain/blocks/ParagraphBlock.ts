import type { BlockContent } from '../BlockContent';

export interface ParagraphBlock {
  readonly blockType: 'paragraph';
  readonly content: BlockContent;
}
