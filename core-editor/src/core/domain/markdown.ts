import { blockToMarkdown } from './blocks/registry';
import { SystemPromptContent } from './SystemPromptContent';

export function toMarkdown(content: SystemPromptContent): string {
  return content.blocks.map(blockToMarkdown).join('\n\n');
}
