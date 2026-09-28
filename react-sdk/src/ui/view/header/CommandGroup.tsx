import type { CommandItemVM } from '../PromptEditorVM';
import { ToolbarGroup } from './ToolbarGroup';

export interface CommandGroupProps {
  readonly label: string;
  readonly items: readonly CommandItemVM[];
  readonly onAction: (id: string) => void;
}

export function CommandGroup({ label, items, onAction }: CommandGroupProps) {
  if (!items.length) return null;
  return (
    <ToolbarGroup label={label}>
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
    </ToolbarGroup>
  );
}
