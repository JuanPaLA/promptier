import { SystemPromptContent } from './SystemPromptContent';
import { Block, BlockDefinition } from './Block'
import { blockDefinitions } from './blocks/blockRegistry'

export function toMarkdown(content: SystemPromptContent): string {
  return content.blocks.map(blockToMarkdown).join('\n\n');
}

function blockToMarkdown(block: Block): string {
  const definition = blockDefinitions[block.blockType] as BlockDefinition<Block>;
  return definition.toMarkdown(block);
}
