import { usePopover } from '../../components/hooks/usePopover';

export function EditorSettings({ variableValidation, variableContext, onVariableValidationChange }: {
  readonly variableValidation: boolean;
  readonly variableContext: unknown;
  readonly onVariableValidationChange: (enabled: boolean) => void;
}) {
  const popover = usePopover();
  return (
    <details ref={popover.ref} className="promptier-settings" open={popover.open} onToggle={popover.onToggle}>
      <summary aria-label="Editor settings" title="Editor settings"><SettingsIcon /></summary>
      <aside className="promptier-settings-panel" aria-label="Editor settings">
        <header>
          <h2>Editor settings</h2>
          <button type="button" aria-label="Close settings" title="Close settings" onClick={popover.close}>×</button>
        </header>
        <section>
          <h3>Variables</h3>
          <div className="promptier-settings-checkbox">
            <input id="promptier-variable-validation" type="checkbox" checked={variableValidation}
              onChange={(event) => onVariableValidationChange(event.target.checked)} />
            <label htmlFor="promptier-variable-validation">Validate variable references</label>
          </div>
          <p>When enabled, declared, unknown and unverified variables receive visual feedback in the prompt.</p>
        </section>
        <section>
          <h3>Shared context</h3>
          <p>This is the read-only context supplied when the editor was mounted.</p>
          <pre>{formatContext(variableContext)}</pre>
        </section>
      </aside>
    </details>
  );
}

function formatContext(context: unknown): string {
  if (context === undefined) return 'No shared context was supplied.';
  try {
    return JSON.stringify(context, null, 2) ?? 'undefined';
  } catch {
    return 'The shared context cannot be displayed as JSON.';
  }
}

function SettingsIcon() {
  return (
    <svg className="promptier-header-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
