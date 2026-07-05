import { Block } from './Block';
import { ParagraphBlock } from './blocks/ParagraphBlock';

export interface SystemPromptContent {
  blocks: Block[];
}

export function emptySystemPromptContent(): SystemPromptContent {
  const paragraph: ParagraphBlock = { blockType: 'paragraph', text: '' };
  return { blocks: [paragraph] };
}
