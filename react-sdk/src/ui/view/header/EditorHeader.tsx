import type { CommandItemVM } from '../PromptEditorVM';
import { CommandEditorToolbar } from './CommandEditorToolbar';

export interface EditorHeaderProps {
  readonly outlineOpen: boolean;
  readonly commandItems: readonly CommandItemVM[];
  readonly onToggleOutline: () => void;
  readonly onCommand: (id: string) => void;
}

export function EditorHeader({
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
      <CommandEditorToolbar items={commandItems} onAction={onCommand} />
    </header>
  );
}
