import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CommandState } from '../../../editor/commands/CommandState';
import type { InsertToolCommand } from '../../../editor/commands/InsertToolCommand';
import type { ToolCatalog } from '../../../prompt/tools/ToolCatalog';
import { canInsertMention, insertMention, selectionSplitsTemplateToken } from '../editing/mentionInsertion';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

export class ToolCommands implements CommandHandler<InsertToolCommand>, CommandStateProvider {
  readonly type = 'tool.insert';

  constructor(private readonly catalog: () => ToolCatalog) {}

  run(view: EditorView, command: InsertToolCommand): boolean {
    const text = this.mentionText(command);
    if (!text || !this.canInsert(view.state)) return false;
    view.dispatch(insertMention(view.state, text, { code: true }).scrollIntoView());
    view.focus();
    return true;
  }

  commandStates(state: EditorState): readonly CommandState[] {
    const catalog = this.catalog();
    const enabled = this.canInsert(state);
    return catalog.tools().flatMap((tool): CommandState[] => [
      { command: { type: 'tool.insert', tool: tool.name }, tool, enabled },
      ...catalog.parameters(tool.name).map((parameter) => ({
        command: { type: 'tool.insert', tool: tool.name, parameter: parameter.path }, tool, parameter, enabled,
      } satisfies CommandState)),
    ]);
  }

  /** The shortest mention that resolves to exactly the requested tool or parameter. */
  private mentionText({ tool, parameter }: InsertToolCommand): string | undefined {
    const catalog = this.catalog();
    if (parameter === undefined) return catalog.resolve(tool)?.kind === 'tool' ? tool : undefined;
    if (!catalog.parameters(tool).some((declared) => declared.path === parameter)) return undefined;
    const unqualified = catalog.resolve(parameter);
    return unqualified?.kind === 'parameter' && unqualified.parameters.length === 1 ? parameter : `${tool}.${parameter}`;
  }

  private canInsert(state: EditorState): boolean {
    return canInsertMention(state) && !selectionSplitsTemplateToken(state.selection);
  }
}
