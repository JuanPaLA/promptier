import type { CommandItemVM } from '../PromptEditorVM';
import { CommandsToolBar } from './CommandsToolBar';

export interface EditorHeaderProps {
  readonly outlineOpen: boolean;
  readonly formatCommands: readonly CommandItemVM[];
  readonly fullViewAvailable: boolean;
  readonly fullViewActive: boolean;
  readonly onToggleOutline: () => void;
  readonly onCommand: (id: string) => void;
  readonly onToggleFullView: () => void;
}

export function Header({
  outlineOpen,
  formatCommands,
  fullViewAvailable,
  fullViewActive,
  onToggleOutline,
  onCommand,
  onToggleFullView,
}: EditorHeaderProps) {
  const fullViewLabel = fullViewActive ? 'Exit full view' : 'Open full view';

  return (
    <header className="promptier-header">
      {!outlineOpen && (
        <button
          className="promptier-outline-toggle"
          type="button"
          aria-label="Show outline"
          aria-expanded={false}
          onClick={onToggleOutline}
        >
          ▤
        </button>
      )}
      <CommandsToolBar items={formatCommands} onAction={onCommand} />
      {fullViewAvailable && (
        <button
          className="promptier-full-view-toggle"
          type="button"
          title={fullViewLabel}
          aria-label={fullViewLabel}
          aria-pressed={fullViewActive}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onToggleFullView}
        >
          <FullViewIcon contracted={fullViewActive} />
        </button>
      )}
    </header>
  );
}

function FullViewIcon({ contracted }: { readonly contracted: boolean }) {
  const path = contracted
    ? 'M3 8h5V3m13 5h-5V3M3 16h5v5m13-5h-5v5'
    : 'M8 3H3v5m13-5h5v5m0 8v5h-5M8 21H3v-5';

  return (
    <svg
      className="promptier-full-view-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
