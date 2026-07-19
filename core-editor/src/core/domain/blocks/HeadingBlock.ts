import type { BlockContent } from '../BlockContent';

export interface HeadingBlock {
  readonly blockType: 'heading';
  readonly level: 1 | 2 | 3;
  readonly content: BlockContent;
}
