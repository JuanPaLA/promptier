import { PresenterBase, type ChangeFunc } from '@nbottarini/react-presenter';

import {
  PromptEditorService,
  type PromptEditorSnapshot,
  type Unsubscribe,
} from '../../lib/PromptEditorService';
import type { TokenEstimator } from '../../lib/TokenEstimator';
import { PromptEditorVM } from './PromptEditorVM';
import type { ToolDefinition, VariableSchema } from '@cachai/promptier-core-editor';

export interface PromptEditorPresenterProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly variableSchema?: VariableSchema;
  readonly tools?: readonly ToolDefinition[];
}

export class PromptEditorPresenter extends PresenterBase<
  PromptEditorVM,
  PromptEditorPresenterProps
> {
  private editorSubscription: Unsubscribe | null = null;
  private lastReportedPrompt = '';

  constructor(
    onChange: ChangeFunc,
    private readonly editor: PromptEditorService,
    private readonly tokenEstimator: TokenEstimator,
  ) {
    super(onChange);
    this.propChanged('value', this.setPrompt);
    this.propChanged('variableSchema', this.setVariableSchema);
    this.propChanged('tools', this.setTools);
  }

  protected initModel(): PromptEditorVM {
    return this.viewModelFor(this.editor.getSnapshot());
  }

  start(): void {
    this.editorSubscription = this.editor.subscribe(this.handleEditorChange);
    this.setPrompt(this.props.value);
    this.setVariableSchema(this.props.variableSchema);
    this.setTools(this.props.tools);
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
    const target = this.model.outlineTargetFor(id);
    if (!target) return;
    this.editor.run({ type: 'navigate', target });
  };

  private setPrompt = (prompt: string | undefined): void => {
    if (prompt === undefined || prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.editor.setPrompt(prompt);
  };

  private setVariableSchema = (schema: VariableSchema | undefined): void => {
    this.editor.setVariableSchema(schema);
  };

  private setTools = (tools: readonly ToolDefinition[] | undefined): void => {
    this.editor.setTools(tools ?? []);
  };

  private handleEditorChange = (): void => {
    const snapshot = this.editor.getSnapshot();
    this.updateModel(this.viewModelFor(snapshot));
    this.reportPrompt(snapshot.prompt);
  };

  private viewModelFor(snapshot: PromptEditorSnapshot): PromptEditorVM {
    return PromptEditorVM.from(snapshot, this.tokenEstimator);
  }

  private refreshViewModel(): void {
    this.updateModel(this.viewModelFor(this.editor.getSnapshot()));
  }

  private reportPrompt(prompt: string): void {
    if (prompt === this.lastReportedPrompt) return;
    this.lastReportedPrompt = prompt;
    this.props.onChange?.(prompt);
  }

}
