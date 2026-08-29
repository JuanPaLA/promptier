import type { OutlineItemVM } from '../PromptEditorVM';

export interface OutlinePanelProps {
  readonly items: readonly OutlineItemVM[];
  readonly onSelect: (id: string) => void;
  readonly onToggle: () => void;
}

export function OutlinePanel({ items, onSelect, onToggle }: OutlinePanelProps) {
  return (
    <nav className="promptier-outline" aria-label="Prompt outline">
      <header className="promptier-outline-header">
        <button
          className="promptier-outline-toggle"
          type="button"
          aria-label="Hide outline"
          aria-expanded={true}
          onClick={onToggle}
        >
          ◧
        </button>
        Outline
      </header>
      <div className="promptier-outline-list">
        {items.length === 0 && (
          <p className="promptier-outline-empty">No sections yet.</p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            className="promptier-outline-entry"
            type="button"
            style={{ paddingInlineStart: `${0.75 + item.depth}rem` }}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
