export const styles = `
.promptier-editor {
  --promptier-border: #d0d7de;
  --promptier-muted: #57606a;
  --promptier-subtle: #f6f8fa;
  --promptier-active: #dbeafe;
  display: flex;
  min-width: 0;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--promptier-border);
  border-radius: 0.5rem;
  background: #fff;
  color: #24292f;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.promptier-editor,
.promptier-editor * {
  box-sizing: border-box;
}
.promptier-header {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--promptier-border);
  background: var(--promptier-subtle);
}
.promptier-outline-toggle,
.promptier-command-button {
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
.promptier-command-button:hover:not(:disabled) {
  border-color: var(--promptier-border);
  background: #fff;
}
.promptier-command-button[aria-pressed="true"] {
  border-color: #93c5fd;
  background: var(--promptier-active);
  font-weight: 700;
}
.promptier-command-button:disabled {
  cursor: default;
  opacity: 0.45;
}
.promptier-command-bar {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.promptier-body {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
}
.promptier-outline {
  width: 15rem;
  flex: 0 0 15rem;
  overflow: auto;
  padding: 0.75rem 0;
  border-right: 1px solid var(--promptier-border);
  background: #fbfcfd;
}
.promptier-outline-heading {
  padding: 0 0.75rem 0.5rem;
  color: var(--promptier-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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
@media (max-width: 42rem) {
  .promptier-outline {
    width: 11rem;
    flex-basis: 11rem;
  }
}
`;
