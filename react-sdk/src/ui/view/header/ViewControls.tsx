import type { EditorViewMode } from '../PromptEditor';

export interface ViewControlsProps {
  readonly viewMode: EditorViewMode;
  readonly onViewModeChange: (mode: EditorViewMode) => void;
  readonly fullViewAvailable: boolean;
  readonly fullViewActive: boolean;
  readonly onToggleFullView: () => void;
}

export function ViewControls({
  viewMode,
  onViewModeChange,
  fullViewAvailable,
  fullViewActive,
  onToggleFullView,
}: ViewControlsProps) {
  const fullViewLabel = fullViewActive ? 'Exit full view' : 'Open full view';

  return (
    <div className="promptier-view-controls" role="group" aria-label="View controls">
      <div className="promptier-mode-selector" role="group" aria-label="Prompt view">
        <button type="button" className="promptier-mode-button"
          title="Curated view" aria-label="Curated view"
          aria-pressed={viewMode === 'curated'} onClick={() => onViewModeChange('curated')}>
          <CuratedViewIcon />
        </button>
        <button type="button" className="promptier-mode-button"
          title="Raw view" aria-label="Raw view"
          aria-pressed={viewMode === 'raw'} onClick={() => onViewModeChange('raw')}>
          <RawViewIcon />
        </button>
      </div>
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
    </div>
  );
}

function CuratedViewIcon() {
  return (
    <svg className="promptier-header-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h5M8 11h8M8 15h8M8 18h5" />
    </svg>
  );
}

function RawViewIcon() {
  return (
    <svg className="promptier-header-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16" />
    </svg>
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
