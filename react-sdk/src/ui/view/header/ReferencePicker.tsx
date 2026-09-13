import type { CommandItemVM } from '../PromptEditorVM';

export function ReferencePicker({ items, onAction }: {
  readonly items: readonly CommandItemVM[];
  readonly onAction: (id: string) => void;
}) {
  return (
    <select
      className="promptier-reference-picker"
      aria-label="Reference section"
      title={items.length ? 'Insert a section reference at the cursor' : 'Add a section to reference it'}
      value=""
      disabled={!items.some((item) => !item.disabled)}
      onChange={(event) => { if (event.target.value) onAction(event.target.value); }}
    >
      <option value="" disabled>↗ Reference section</option>
      {items.map((item) => (
        <option key={item.id} value={item.id} disabled={item.disabled}>{item.label}</option>
      ))}
    </select>
  );
}
