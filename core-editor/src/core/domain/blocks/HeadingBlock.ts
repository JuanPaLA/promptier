import { Block } from '../Block';
import { BlockContent } from '../BlockContent';

export interface HeadingBlock extends Block {
  readonly blockType: 'heading';
  readonly level: 1 | 2 | 3;
  readonly content: BlockContent;
}
