import type { CommandItemVM } from '../../PromptEditorVM';
import { EditorToolbar } from './EditorToolbar';

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
      <button
        className="promptier-outline-toggle"
        type="button"
        aria-label={outlineOpen ? 'Hide outline' : 'Show outline'}
        aria-expanded={outlineOpen}
        onClick={onToggleOutline}
      >
        {outlineOpen ? '◧' : '▤'}
      </button>
      <EditorToolbar items={commandItems} onAction={onCommand} />
    </header>
  );
}
