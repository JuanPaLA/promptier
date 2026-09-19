import type { CommandItemVM } from '../PromptEditorVM';

export function VariablePicker({ items, onAction }: {
  readonly items: readonly CommandItemVM[];
  readonly onAction: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <select
      className="promptier-reference-picker"
      aria-label="Insert variable"
      title="Insert a variable at the cursor"
      value=""
      disabled={!items.some((item) => !item.disabled)}
      onChange={(event) => { if (event.target.value) onAction(event.target.value); }}
    >
      <option value="" disabled>{'{{ }} Insert variable'}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id} disabled={item.disabled} title={item.description}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
