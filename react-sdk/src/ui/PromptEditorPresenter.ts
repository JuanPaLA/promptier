import { PresenterBase, type ChangeFunc } from '@nbottarini/react-presenter';
import type { PromptEditor, Unsubscribe } from '../core/app/PromptEditor';

export interface PromptEditorProps {
  value?: string;
  onChange?(value: string): void;
}

export type PromptEditorViewModel = Record<string, never>;

export class PromptEditorPresenter extends PresenterBase<
  PromptEditorViewModel,
  PromptEditorProps
> {
  private subscription: Unsubscribe | null = null;
  private lastReportedPrompt = '';

  constructor(
    onChange: ChangeFunc,
    private readonly editor: PromptEditor,
  ) {
    super(onChange);
    this.propChanged('value', (value) => this.setPrompt(value));
  }

  protected initModel(): PromptEditorViewModel {
    return {};
  }

  start(): void {
    this.subscription = this.editor.onPromptChanged((prompt) => this.reportPrompt(prompt));
    this.setPrompt(this.props.value);
  }

  stop(): void {
    this.subscription?.();
    this.subscription = null;
  }

  private setPrompt(prompt: string | undefined): void {
    if (prompt === undefined || prompt === this.lastReportedPrompt) return;
    this.editor.setPrompt(prompt);
    this.lastReportedPrompt = prompt;
  }

  private reportPrompt(prompt: string): void {
    if (prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.props.onChange?.(prompt);
  }
}
