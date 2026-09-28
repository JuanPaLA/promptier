import type { ReactNode } from 'react';

export interface ToolbarGroupProps {
  readonly label: string;
  /** Pushes this group and the ones after it to the end of the toolbar. */
  readonly trailing?: boolean;
  readonly children: ReactNode;
}

export function ToolbarGroup({ label, trailing = false, children }: ToolbarGroupProps) {
  return (
    <div className={trailing ? 'promptier-toolbar-group promptier-toolbar-group-trailing' : 'promptier-toolbar-group'}
      role="group" aria-label={label}>
      <span className="promptier-toolbar-group-label" aria-hidden="true">{label}</span>
      <div className="promptier-toolbar-group-actions">{children}</div>
    </div>
  );
}
