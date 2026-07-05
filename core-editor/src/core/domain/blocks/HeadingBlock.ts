import { Block } from '../Block';

export interface HeadingBlock extends Block {
  readonly blockType: 'heading';
  readonly level: 1 | 2 | 3;
}
