import type { CommandItemVM } from '../PromptEditorVM'

export interface CommandsToolBarProps {
  readonly items: readonly CommandItemVM[];
  readonly onAction: (id: string) => void;
}

export function CommandsToolBar({ items, onAction }: CommandsToolBarProps) {
  return (
    <div className="promptier-command-bar" role="toolbar" aria-label="Editor actions">
        <div
          className="promptier-command-group"
          role="group"
          aria-label={'Formatting'}
        >
          {items.map((item) => {
              return (
              <button
                key={item.id}
                className="promptier-command-button"
                type="button"
                title={item.label}
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

