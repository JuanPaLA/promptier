import { PresenterBase, type ChangeFunc } from '@nbottarini/react-presenter';

import {
  PromptEditorService,
  type Unsubscribe,
} from '../../lib/PromptEditorService';
import { PromptEditorVM } from './PromptEditorVM';

export interface PromptEditorPresenterProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
}

export class PromptEditorPresenter extends PresenterBase<
  PromptEditorVM,
  PromptEditorPresenterProps
> {
  private editorSubscription: Unsubscribe | null = null;
  private lastReportedPrompt = '';

  constructor(onChange: ChangeFunc, private readonly editor: PromptEditorService) {
    super(onChange);
    this.propChanged('value', this.setPrompt);
  }

  protected initModel(): PromptEditorVM {
    return PromptEditorVM.from(this.editor.getSnapshot());
  }

  start(): void {
    this.editorSubscription = this.editor.subscribe(this.handleEditorChange);
    this.setPrompt(this.props.value);
    this.refreshViewModel();
  }

  stop(): void {
    this.editorSubscription?.();
    this.editorSubscription = null;
  }

  runCommand = (id: string): void => {
    const command = this.model.commandFor(id);
    if (command) this.editor.run(command);
  };

  selectOutlineItem = (id: string): void => {
    const path = this.model.outlinePathFor(id);
    if (!path) return;
    this.editor.run({ type: 'navigate', target: { kind: 'section', path } });
  };

  private setPrompt = (prompt: string | undefined): void => {
    if (prompt === undefined || prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.editor.setPrompt(prompt);
  };

  private handleEditorChange = (): void => {
    const snapshot = this.editor.getSnapshot();
    this.updateModel(PromptEditorVM.from(snapshot));
    this.reportPrompt(snapshot.prompt);
  };

  private refreshViewModel(): void {
    this.updateModel(PromptEditorVM.from(this.editor.getSnapshot()));
  }

  private reportPrompt(prompt: string): void {
    if (prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.props.onChange?.(prompt);
  }

}
