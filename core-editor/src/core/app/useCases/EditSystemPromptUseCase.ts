import { SystemPrompt } from '../../domain/SystemPrompt';
import { PromptEditor } from '../ports/PromptEditor';

export class EditSystemPromptUseCase {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly systemPrompt: SystemPrompt,
    private readonly editor: PromptEditor,
  ) {}

  start(container: HTMLElement): void {
    this.editor.mount(container, this.systemPrompt.getContent());
    this.unsubscribe = this.editor.onChange((content) => {
      this.systemPrompt.updateContent(content);
    });
  }

  getSystemPrompt(): SystemPrompt {
    return this.systemPrompt;
  }

  stop(): void {
    this.unsubscribe?.();
    this.editor.destroy();
  }
}
