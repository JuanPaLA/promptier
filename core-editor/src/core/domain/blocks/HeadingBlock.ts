import { Block, BlockDefinition } from '../Block';
import { richTextToMarkdown } from '../serialization/richTextToMarkdown';

export interface HeadingBlock extends Block {
  readonly blockType: 'heading';
  readonly level: 1 | 2 | 3;
}

export const headingDefinition: BlockDefinition<HeadingBlock> = {
  blockType: 'heading',
  toMarkdown: (block) => `${'#'.repeat(block.level)} ${richTextToMarkdown(block.content)}`,
};
