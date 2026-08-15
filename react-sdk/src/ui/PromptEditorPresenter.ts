import { PresenterBase, type ChangeFunc } from '@nbottarini/react-presenter';
import type { PromptEditor, Unsubscribe } from '../core/app/PromptEditor';

export interface PromptEditorProps {
  /**
   * The prompt, as text. A seed with reconciliation rather than a controlled
   * binding — see `setPrompt` below for why re-applying it per keystroke would
   * be wrong.
   */
  value?: string;
  /** Fires after every edit, with the prompt a host stores and a model reads. */
  onChange?(value: string): void;
}

/**
 * Empty on purpose, and the presenter never calls `updateModel`. The custom
 * element paints its own document, so React contributes no markup that depends
 * on state here — and since `updateModel` is what forces a re-render, typing
 * and moving the caret re-render nothing.
 *
 * Panels that *do* paint per-keystroke state — a command bar, an outline — get
 * their own presenter over the same port, so each one's re-render stays inside
 * the panel that needs it.
 */
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

  /**
   * Seeds the editor, skipping the string we just reported. Without that guard
   * the obvious host — `useState` plus `onChange={setText}` — feeds every
   * keystroke back in, and re-seeding re-parses the document, discards undo
   * history and jumps the caret. The editor is re-seeded only for a genuinely
   * different string: loading another prompt, a reset, a push from a server.
   */
  private setPrompt(prompt: string | undefined): void {
    if (prompt === undefined || prompt === this.lastReportedPrompt) return;
    this.editor.setPrompt(prompt);
    this.lastReportedPrompt = prompt;
  }

  /**
   * The outbound half: hand the host the new text, and remember we did. Guarded
   * by the same field as `setPrompt`, so a prompt the host itself set does not
   * come back as a change — and an edit that lands on the text the host already
   * holds (typing a character, then undo) reports nothing, which is correct.
   */
  private reportPrompt(prompt: string): void {
    if (prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.props.onChange?.(prompt);
  }
}
