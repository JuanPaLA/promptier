import { useRef } from 'react';
import type { CommandItemVM } from '../PromptEditorVM';
import { useAnchoredPanel } from '../../components/hooks/useAnchoredPanel';
import { usePopover } from '../../components/hooks/usePopover';

export interface ActionMenuProps {
  readonly label: string;
  readonly glyph: string;
  readonly accent: 'section' | 'variable' | 'tool';
  readonly items: readonly CommandItemVM[];
  /** Shows the menu disabled, with this explanation, instead of hiding it when it has no items. */
  readonly emptyMessage?: string;
  readonly onAction: (id: string) => void;
}

export function ActionMenu({ label, glyph, accent, items, emptyMessage, onAction }: ActionMenuProps) {
  const popover = usePopover();
  const trigger = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useAnchoredPanel(trigger, panel, popover.open);
  const className = `promptier-action-menu promptier-action-menu-${accent}`;

  if (!items.length) {
    if (emptyMessage === undefined) return null;
    return (
      <div className={className}>
        <button className="promptier-action-menu-trigger" type="button" disabled
          title={emptyMessage} aria-label={`${label}: ${emptyMessage}`}>
          <TriggerContent glyph={glyph} label={label} />
        </button>
      </div>
    );
  }

  return (
    <details ref={popover.ref} className={className} open={popover.open} onToggle={popover.onToggle}>
      <summary ref={trigger} className="promptier-action-menu-trigger" aria-label={label} title={label}>
        <TriggerContent glyph={glyph} label={label} />
      </summary>
      <div ref={panel} className="promptier-action-menu-popover" aria-label={label}>
        {items.map((item) => (
          <button key={item.id} className="promptier-action-menu-item" type="button" disabled={item.disabled}
            title={item.description || item.label} style={{ paddingInlineStart: `${0.5 + item.depth}rem` }}
            onClick={() => {
              popover.close();
              onAction(item.id);
            }}>
            <span className="promptier-action-menu-glyph" aria-hidden="true">{item.glyph}</span>
            <span>{item.label}</span>
            {item.description && <small>{item.description}</small>}
          </button>
        ))}
      </div>
    </details>
  );
}

function TriggerContent({ glyph, label }: { readonly glyph: string; readonly label: string }) {
  return (
    <>
      <span className="promptier-action-menu-glyph" aria-hidden="true">{glyph}</span>
      {label}
    </>
  );
}
