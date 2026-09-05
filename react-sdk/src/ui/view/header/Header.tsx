import type { CommandItemVM } from '../PromptEditorVM';
import { CommandsToolBar } from './CommandsToolBar';
import { CopyButton } from '../../components/buttons/CopyButton';
import { ViewControls, type ViewControlsProps } from './ViewControls';
import { CopyStatus } from '../../components/hooks/useCopyPrompt'

export interface EditorHeaderProps extends ViewControlsProps {
  readonly outlineOpen: boolean;
  readonly formatCommands: readonly CommandItemVM[];
  readonly onToggleOutline: () => void;
  readonly onCommand: (id: string) => void;
  readonly copyStatus: CopyStatus;
  readonly onCopy: () => void;
}

export function Header({
  outlineOpen, formatCommands, onToggleOutline, onCommand,
  copyStatus, onCopy, ...viewControls
}: EditorHeaderProps) {
  return (
    <header className="promptier-header">
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
            <CommandsToolBar items={formatCommands} onAction={onCommand} />
          </div>
        </>
      )}
      <div className="promptier-header-trailing">
        <CopyButton status={copyStatus} onCopy={onCopy} />
        <ViewControls {...viewControls} />
      </div>
    </header>
  );
}
