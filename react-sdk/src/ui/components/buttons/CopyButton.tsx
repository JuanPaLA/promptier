import type { CopyStatus } from '../hooks/useCopyPrompt';

export interface CopyButtonProps {
  readonly status: CopyStatus;
  readonly onCopy: () => void;
}

export function CopyButton({ status, onCopy }: CopyButtonProps) {
  const message = status === 'copied'
    ? 'Raw prompt copied.'
    : status === 'failed'
      ? 'Copy failed. Select and copy the text in Raw view.'
      : '';

  return (
    <div className="promptier-document-actions" role="group" aria-label="Document actions">
      <button
        className="promptier-copy-button"
        type="button"
        title="Copy raw prompt"
        aria-label="Copy raw prompt"
        disabled={status === 'copying'}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onCopy}
      >
        <CopyIcon status={status} />
      </button>
      <span className="promptier-copy-feedback" role="status">{message}</span>
    </div>
  );
}

function CopyIcon({ status }: { readonly status: CopyStatus }) {
  return (
    <svg className="promptier-header-icon" viewBox="0 0 24 24" aria-hidden="true">
      {status === 'copied' ? (
        <path d="m5 12 4 4L19 6" />
      ) : status === 'failed' ? (
        <>
          <path d="M12 3 2 21h20L12 3Z M12 9v5" />
          <circle cx="12" cy="17" r="0.5" />
        </>
      ) : (
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V4H4v12h4" />
        </>
      )}
    </svg>
  );
}
