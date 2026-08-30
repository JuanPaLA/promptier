import type { CommandItemVM } from '../PromptEditorVM';
import { CommandsToolBar } from './CommandsToolBar';

export interface EditorHeaderProps {
  readonly outlineOpen: boolean;
  readonly commandItems: readonly CommandItemVM[];
  readonly onToggleOutline: () => void;
  readonly onCommand: (id: string) => void;
}

export function Header({
  outlineOpen,
  commandItems,
  onToggleOutline,
  onCommand,
}: EditorHeaderProps) {
  return (
    <header className="promptier-header">
      {!outlineOpen && (
        <button
          className="promptier-outline-toggle"
          type="button"
          aria-label="Show outline"
          aria-expanded={false}
          onClick={onToggleOutline}
        >
          ▤
        </button>
      )}
      <CommandsToolBar items={commandItems} onAction={onCommand} />
    </header>
  );
}
