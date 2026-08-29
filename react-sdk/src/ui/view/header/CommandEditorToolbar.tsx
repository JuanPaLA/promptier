import type { CommandItemVM } from '../PromptEditorVM'

export function CommandEditorToolbar({ items, onAction }: { items: readonly CommandItemVM[]; onAction: (id: string) => void }) {
  return (
    <div className="promptier-command-bar" role="toolbar" aria-label="Editor actions">
        <div
          className="promptier-command-group"
          role="group"
          aria-label={'Formatting'}
        >
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
    </div>
  );
}

