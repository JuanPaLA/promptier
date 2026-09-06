export const styles = `
.promptier-editor {
  --promptier-border: #d0d7de;
  --promptier-muted: #57606a;
  --promptier-subtle: #f6f8fa;
  --promptier-active: #dbeafe;
  /* Both top bars must align across the outline seam: control height + block padding + border. */
  --promptier-bar-height: calc(2.8rem + 1px);
  --promptier-footer-height: calc(1.4rem + 0.5px);
  display: flex;
  min-width: 0;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  flex-direction: row;
  overflow: hidden;
  border: 1px solid var(--promptier-border);
  border-radius: 0;
  background: #fff;
  color: #24292f;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.promptier-editor:fullscreen {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  border-radius: 0;
}
.promptier-editor::backdrop {
  background: #fff;
}
.promptier-editor,
.promptier-editor * {
  box-sizing: border-box;
}
.promptier-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.promptier-header {
  position: relative;
  display: flex;
  height: var(--promptier-bar-height);
  flex-shrink: 0;
  min-height: var(--promptier-bar-height);
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--promptier-border);
  background: var(--promptier-subtle);
}
.promptier-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.promptier-header-actions::-webkit-scrollbar {
  display: none;
}
.promptier-header-actions > * {
  flex-shrink: 0;
}
.promptier-outline-toggle {
  flex: 0 0 auto;
}
.promptier-outline-toggle,
.promptier-command-button,
.promptier-copy-button,
.promptier-mode-button,
.promptier-full-view-toggle {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.promptier-outline-toggle:hover,
.promptier-copy-button:hover:not(:disabled),
.promptier-mode-button:hover,
.promptier-command-button:hover:not(:disabled),
.promptier-full-view-toggle:hover {
  border-color: var(--promptier-border);
  background: #fff;
}
.promptier-command-button[aria-pressed="true"],
.promptier-mode-button[aria-pressed="true"] {
  border-color: #93c5fd;
  background: var(--promptier-active);
  font-weight: 700;
}
.promptier-command-button:disabled {
  cursor: default;
  opacity: 0.45;
}
.promptier-full-view-toggle {
  flex: 0 0 auto;
}
.promptier-editing-actions,
.promptier-header-trailing,
.promptier-view-controls,
.promptier-mode-selector {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.promptier-editing-actions {
  flex-wrap: nowrap;
}
.promptier-header-trailing {
  margin-inline-start: auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 0.5rem;
}
.promptier-view-controls,
.promptier-editing-actions {
  padding-inline-start: 0.5rem;
  border-inline-start: 1px solid var(--promptier-border);
}
.promptier-view-controls {
  flex-wrap: nowrap;
}
.promptier-copy-feedback:not(:empty) {
  position: absolute;
  z-index: 1;
  top: calc(100% + 0.5rem);
  right: 0.5rem;
  width: 14rem;
  max-width: calc(100% - 1rem);
  padding: 0.5rem;
  border: 1px solid var(--promptier-border);
  border-radius: 0.35rem;
  background: #fff;
  box-shadow: 0 2px 6px #0002;
  font-size: 0.8rem;
}
.promptier-raw-surface {
  display: block;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  resize: none;
  overflow: auto;
  padding: 0.75rem;
  border: 0;
  background: #fff;
  color: inherit;
  font: 0.875rem/1.6 ui-monospace, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.promptier-editor :focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}
.promptier-surface[hidden] {
  display: none;
}
.promptier-full-view-icon,
.promptier-header-icon {
  display: block;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
.promptier-command-bar {
  display: flex;
  align-items: center;
}
.promptier-command-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.2rem;
}
.promptier-command-group + .promptier-command-group {
  margin-inline-start: 0.4rem;
  padding-inline-start: 0.4rem;
  border-inline-start: 1px solid var(--promptier-border);
}
.promptier-outline {
  display: flex;
  width: 15rem;
  min-height: 0;
  flex: 0 0 15rem;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--promptier-border);
  background: #fbfcfd;
}
.promptier-outline-header {
  display: flex;
  height: var(--promptier-bar-height);
  flex-shrink: 0;
  min-height: var(--promptier-bar-height);
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--promptier-border);
  background: var(--promptier-subtle);
  color: var(--promptier-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.promptier-outline-list {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 0.75rem 0;
}
.promptier-outline-empty {
  margin: 0;
  padding: 0.5rem 0.75rem;
  color: var(--promptier-muted);
  font-size: 0.85rem;
}
.promptier-outline-entry {
  display: block;
  width: 100%;
  overflow: hidden;
  padding-block: 0.4rem;
  padding-inline-end: 0.75rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.promptier-outline-entry:hover {
  background: var(--promptier-subtle);
}
.promptier-outline-entry[data-kind="section"] {
  font-weight: 600;
}
.promptier-surface {
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: 0.75rem;
}
.promptier-surface > prompt-editor {
  display: block;
  width: 100%;
  height: 100%;
}
.promptier-footer {
  display: flex;
  height: var(--promptier-footer-height);
  min-height: var(--promptier-footer-height);
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 0.5rem;
  border-top: 1px solid var(--promptier-border);
  background: var(--promptier-subtle);
  color: var(--promptier-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
@media (max-width: 42rem) {
  .promptier-outline {
    width: 11rem;
    flex-basis: 11rem;
  }
}
`;
