import { BlockDefinition, BlockType } from '../Block';
import { HeadingBlock, headingDefinition } from './HeadingBlock';
import { ParagraphBlock, paragraphDefinition } from './ParagraphBlock';

export type AnyBlock = ParagraphBlock | HeadingBlock;

type BlockDefinitionRegistry = {
  [K in BlockType]: BlockDefinition<Extract<AnyBlock, { blockType: K }>>;
};

export const blockDefinitions: BlockDefinitionRegistry = {
  paragraph: paragraphDefinition,
  heading: headingDefinition,
};
