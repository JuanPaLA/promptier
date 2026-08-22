export interface ToolbarItemViewModel {
  readonly id: string;
  readonly label: string;
  readonly glyph: string;
  readonly shortcut?: string;
  readonly disabled: boolean;
  readonly active: boolean;
}

export interface EditorToolbarProps {
  readonly items: readonly ToolbarItemViewModel[];
  readonly onAction: (id: string) => void;
}

export function EditorToolbar({ items, onAction }: EditorToolbarProps) {
  return (
    <div className="promptier-command-bar" role="toolbar" aria-label="Text formatting">
      {items.map((item) => {
        const title = item.shortcut
          ? `${item.label} (${item.shortcut})`
          : item.label;

        return (
          <button
            key={item.id}
            className="promptier-command-button"
            type="button"
            title={title}
            aria-label={item.label}
            aria-pressed={item.active}
            disabled={item.disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onAction(item.id)}
          >
            {item.glyph}
          </button>
        );
      })}
    </div>
  );
}
