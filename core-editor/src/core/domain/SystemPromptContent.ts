export interface SystemPromptBlock {
  type: 'paragraph';
  text: string;
}

export interface SystemPromptContent {
  blocks: SystemPromptBlock[];
}

export function emptySystemPromptContent(): SystemPromptContent {
  return { blocks: [{ type: 'paragraph', text: '' }] };
}
