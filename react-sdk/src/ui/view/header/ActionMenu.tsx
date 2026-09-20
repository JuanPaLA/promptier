import { useState } from 'react';
import type { CommandItemVM } from '../PromptEditorVM';

export interface ActionMenuGroup {
  readonly label: string;
  readonly items: readonly CommandItemVM[];
}

export function ActionMenu({ label, glyph, groups, onAction }: {
  readonly label: string;
  readonly glyph: string;
  readonly groups: readonly ActionMenuGroup[];
  readonly onAction: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const availableGroups = groups.filter((group) => group.items.length > 0);
  if (!availableGroups.length) return null;

  return (
    <details className="promptier-action-menu" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary aria-label={label} title={label}>{glyph} {label}</summary>
      <div className="promptier-action-menu-popover" aria-label={label}>
        {availableGroups.map((group) => (
          <ActionMenuGroupView key={group.label} group={group} onAction={(id) => {
            setOpen(false);
            onAction(id);
          }} />
        ))}
      </div>
    </details>
  );
}

function ActionMenuGroupView({ group, onAction }: {
  readonly group: ActionMenuGroup;
  readonly onAction: (id: string) => void;
}) {
  return (
    <section className="promptier-action-menu-group" aria-label={group.label}>
      <h3>{group.label}</h3>
      {group.items.map((item) => (
        <button key={item.id} type="button" disabled={item.disabled}
          title={item.description || item.label} onClick={() => onAction(item.id)}>
          <span className="promptier-action-menu-glyph" aria-hidden="true">{item.glyph}</span>
          <span>{item.label}</span>
          {item.description && <small>{item.description}</small>}
        </button>
      ))}
    </section>
  );
}
