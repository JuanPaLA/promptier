import { Block, BlockDefinition } from '../Block';

export interface ParagraphBlock extends Block {
  readonly blockType: 'paragraph';
}

export const paragraphDefinition: BlockDefinition<ParagraphBlock> = {
  blockType: 'paragraph',
  toMarkdown: (block) => block.text,
};
