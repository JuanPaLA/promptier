import { Block } from '../Block';

export interface ParagraphBlock extends Block {
  readonly blockType: 'paragraph';
}
