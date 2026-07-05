import { Block, BlockDefinition } from '../Block';
import { richTextToMarkdown } from '../serialization/richTextToMarkdown';

export interface ParagraphBlock extends Block {
  readonly blockType: 'paragraph';
}

export const paragraphDefinition: BlockDefinition<ParagraphBlock> = {
  blockType: 'paragraph',
  toMarkdown: (block) => richTextToMarkdown(block.content),
};
