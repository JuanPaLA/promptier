export interface OutlineItemViewModel {
  readonly id: string;
  readonly label: string;
  readonly depth: number;
}

export interface OutlinePanelProps {
  readonly items: readonly OutlineItemViewModel[];
  readonly onSelect: (id: string) => void;
}

export function OutlinePanel({ items, onSelect }: OutlinePanelProps) {
  return (
    <nav className="promptier-outline" aria-label="Prompt outline">
      <div className="promptier-outline-heading">Outline</div>
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
    </nav>
  );
}
