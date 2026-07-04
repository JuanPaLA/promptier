import { Block, BlockDefinition, BlockType } from '../Block';
import { HeadingBlock, headingDefinition } from './heading';
import { ParagraphBlock, paragraphDefinition } from './paragraph';

export type AnyBlock = ParagraphBlock | HeadingBlock;

type BlockDefinitionRegistry = {
  [K in BlockType]: BlockDefinition<Extract<AnyBlock, { blockType: K }>>;
};

const blockDefinitions: BlockDefinitionRegistry = {
  paragraph: paragraphDefinition,
  heading: headingDefinition,
};

export function blockToMarkdown(block: Block): string {
  const definition = blockDefinitions[block.blockType] as BlockDefinition<Block>;
  return definition.toMarkdown(block);
}
