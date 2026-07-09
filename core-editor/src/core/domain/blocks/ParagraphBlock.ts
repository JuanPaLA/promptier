import { Block } from '../Block';
import { BlockContent } from '../BlockContent';

export interface ParagraphBlock extends Block {
  readonly blockType: 'paragraph';
  readonly content: BlockContent;
}
