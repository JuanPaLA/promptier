import { EditorToolbar, type ToolbarItemViewModel } from './EditorToolbar';

export interface EditorHeaderProps {
  readonly outlineOpen: boolean;
  readonly toolbarItems: readonly ToolbarItemViewModel[];
  readonly onToggleOutline: () => void;
  readonly onToolbarAction: (id: string) => void;
}

export function EditorHeader({
  outlineOpen,
  toolbarItems,
  onToggleOutline,
  onToolbarAction,
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
      <EditorToolbar items={toolbarItems} onAction={onToolbarAction} />
    </header>
  );
}
