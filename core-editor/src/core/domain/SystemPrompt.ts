import { SystemPromptContent, emptySystemPromptContent } from './SystemPromptContent';

export class SystemPrompt {
  readonly id: string;
  readonly createdAt: Date;
  private content: SystemPromptContent;

  constructor(
    id: string,
    content: SystemPromptContent = emptySystemPromptContent(),
    createdAt: Date = new Date(),
  ) {
    this.id = id;
    this.content = content;
    this.createdAt = createdAt;
  }

  getContent(): SystemPromptContent {
    return this.content;
  }

  updateContent(content: SystemPromptContent): void {
    this.content = content;
  }

  getPlainText(): string {
    return this.content.blocks.map((block) => block.text).join('\n');
  }
}
