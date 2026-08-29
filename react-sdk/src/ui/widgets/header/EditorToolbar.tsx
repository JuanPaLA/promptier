import type { CommandGroup, CommandItemVM } from '../../PromptEditorVM';

export interface EditorToolbarProps {
  readonly items: readonly CommandItemVM[];
  readonly onAction: (id: string) => void;
}

export function EditorToolbar({ items, onAction }: EditorToolbarProps) {
  return (
    <div className="promptier-command-bar" role="toolbar" aria-label="Editor actions">
      {groupsFrom(items).map(({ group, items: groupItems }) => (
        <div
          key={group}
          className="promptier-command-group"
          role="group"
          aria-label={COMMAND_GROUP_LABELS[group]}
        >
          {groupItems.map((item) => {
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
      ))}
    </div>
  );
}

interface CommandGroupItems {
  readonly group: CommandGroup;
  readonly items: readonly CommandItemVM[];
}

function groupsFrom(items: readonly CommandItemVM[]): CommandGroupItems[] {
  return COMMAND_GROUPS.flatMap((group) => {
    const groupItems = items.filter((item) => item.group === group);
    return groupItems.length > 0 ? [{ group, items: groupItems }] : [];
  });
}

const COMMAND_GROUPS: readonly CommandGroup[] = ['format', 'insert', 'utility'];
const COMMAND_GROUP_LABELS: Record<CommandGroup, string> = {
  format: 'Formatting',
  insert: 'Insert blocks',
  utility: 'Utilities',
};
