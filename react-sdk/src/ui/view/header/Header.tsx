import { ActionMenu } from './ActionMenu';
import { EditorSettings } from './EditorSettings';
import type { CommandItemVM } from '../PromptEditorVM';
import { CommandsToolBar } from './CommandsToolBar';
import { CopyButton } from '../../components/buttons/CopyButton';
import { ViewControls, type ViewControlsProps } from './ViewControls';
import { CopyStatus } from '../../components/hooks/useCopyPrompt'

export interface EditorHeaderProps extends ViewControlsProps {
  readonly outlineOpen: boolean;
  readonly formatCommands: readonly CommandItemVM[];
  readonly blockCommands: readonly CommandItemVM[];
  readonly referenceCommands?: readonly CommandItemVM[];
  readonly variableCommands?: readonly CommandItemVM[];
  readonly toolCommands?: readonly CommandItemVM[];
  readonly variableValidation: boolean;
  readonly variableContext: unknown;
  readonly onToggleOutline: () => void;
  readonly onCommand: (id: string) => void;
  readonly copyStatus: CopyStatus;
  readonly onCopy: () => void;
  readonly onVariableValidationChange: (enabled: boolean) => void;
}

export function Header({
  outlineOpen, formatCommands, blockCommands, referenceCommands = [], variableCommands = [], toolCommands = [], variableValidation,
  variableContext, onToggleOutline, onCommand, copyStatus, onCopy, onVariableValidationChange, ...viewControls
}: EditorHeaderProps) {
  return (
    <header className="promptier-header">
      <div className="promptier-header-actions">
        {viewControls.viewMode === 'curated' && (
          <>
            {!outlineOpen && (
              <div className="promptier-navigation" role="group" aria-label="Navigation">
                <button className="promptier-outline-toggle" type="button"
                  aria-label="Show outline" aria-expanded={false} onClick={onToggleOutline}>
                  ▤
                </button>
              </div>
            )}
            <div className="promptier-editing-actions">
              <CommandsToolBar groups={[
                { label: 'Formatting', items: formatCommands },
                { label: 'Blocks', items: blockCommands },
              ]} onAction={onCommand} />
              <div className="promptier-reference-actions">
                <ActionMenu label="References" glyph="↗" groups={[
                  { label: 'Sections', items: referenceCommands },
                  { label: 'Variables', items: variableCommands },
                  { label: 'Tools', items: toolCommands },
                ]} onAction={onCommand} />
              </div>
            </div>
          </>
        )}
        <div className="promptier-header-trailing">
          <CopyButton status={copyStatus} onCopy={onCopy} />
          <ViewControls {...viewControls} />
          <EditorSettings variableValidation={variableValidation} variableContext={variableContext}
            onVariableValidationChange={onVariableValidationChange} />
        </div>
      </div>
    </header>
  );
}
