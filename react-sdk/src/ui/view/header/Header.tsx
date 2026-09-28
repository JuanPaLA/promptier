import { ActionMenu } from './ActionMenu';
import { EditorSettings } from './EditorSettings';
import type { CommandItemVM } from '../PromptEditorVM';
import { CommandGroup } from './CommandGroup';
import { ToolbarGroup } from './ToolbarGroup';
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
      <div className="promptier-toolbar" role="toolbar" aria-label="Editor toolbar">
        {viewControls.viewMode === 'curated' && (
          <>
            {!outlineOpen && (
              <ToolbarGroup label="Outline">
                <button className="promptier-outline-toggle" type="button"
                  aria-label="Show outline" aria-expanded={false} onClick={onToggleOutline}>
                  ▤
                </button>
              </ToolbarGroup>
            )}
            <CommandGroup label="Formatting" items={formatCommands} onAction={onCommand} />
            <CommandGroup label="Blocks" items={blockCommands} onAction={onCommand} />
            <ToolbarGroup label="References">
              <ActionMenu label="Sections" glyph="↗" accent="section" items={referenceCommands}
                emptyMessage="This prompt has no sections yet" onAction={onCommand} />
              <ActionMenu label="Variables" glyph="{{ }}" accent="variable" items={variableCommands} onAction={onCommand} />
              <ActionMenu label="Tools" glyph="ƒ" accent="tool" items={toolCommands} onAction={onCommand} />
            </ToolbarGroup>
          </>
        )}
        <ToolbarGroup label="View" trailing>
          <ViewControls {...viewControls} />
        </ToolbarGroup>
        <ToolbarGroup label="Actions">
          <CopyButton status={copyStatus} onCopy={onCopy} />
        </ToolbarGroup>
      </div>
      <EditorSettings variableValidation={variableValidation} variableContext={variableContext}
        onVariableValidationChange={onVariableValidationChange} />
    </header>
  );
}
