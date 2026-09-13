import type { CommandItemVM } from '../PromptEditorVM'

export interface CommandsToolBarProps {
  readonly groups: readonly CommandGroup[];
  readonly onAction: (id: string) => void;
}

export interface CommandGroup {
  readonly label: string;
  readonly items: readonly CommandItemVM[];
}

export function CommandsToolBar({ groups, onAction }: CommandsToolBarProps) {
  return (
    <div className="promptier-command-bar" role="toolbar" aria-label="Editor actions">
      {groups.filter(({ items }) => items.length > 0).map(({ label, items }) => (
        <div
          key={label}
          className="promptier-command-group"
          role="group"
          aria-label={label}
        >
          {items.map((item) => (
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
          ))}
        </div>
      ))}
    </div>
  );
}
