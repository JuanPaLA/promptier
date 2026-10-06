export const styles = `
.promptier-editor {
  --promptier-border: #d0d7de;
  --promptier-muted: #57606a;
  --promptier-subtle: #f6f8fa;
  --promptier-active: #dbeafe;
  /* Both top bars must align across the outline seam: group label + control height + breathing room + border. */
  --promptier-bar-height: calc(3.25rem + 1px);
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
  gap: 0.4rem;
  padding: 0 0.4rem;
  border-bottom: 1px solid var(--promptier-border);
  background: var(--promptier-subtle);
}
.promptier-toolbar {
  display: flex;
  flex: 1;
  align-self: stretch;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.promptier-toolbar::-webkit-scrollbar {
  display: none;
}
.promptier-toolbar > * {
  flex-shrink: 0;
}
.promptier-toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.promptier-toolbar-group + .promptier-toolbar-group {
  padding-inline-start: 0.4rem;
  border-inline-start: 1px solid var(--promptier-border);
}
.promptier-toolbar-group-trailing {
  margin-inline-start: auto;
}
.promptier-toolbar-group-label {
  color: var(--promptier-muted);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}
.promptier-toolbar-group-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.promptier-outline-toggle,
.promptier-command-button,
.promptier-copy-button,
.promptier-mode-button,
.promptier-full-view-toggle,
.promptier-action-menu-trigger,
.promptier-settings > summary {
  min-width: 1.6rem;
  height: 1.6rem;
  padding: 0 0.4rem;
  border: 1px solid transparent;
  border-radius: 0.3rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.promptier-outline-toggle:hover,
.promptier-copy-button:hover:not(:disabled),
.promptier-mode-button:hover,
.promptier-command-button:hover:not(:disabled),
.promptier-full-view-toggle:hover,
.promptier-action-menu-trigger:hover:not(:disabled),
.promptier-settings > summary:hover {
  border-color: var(--promptier-border);
  background: #fff;
}
.promptier-command-button[aria-pressed="true"],
.promptier-mode-button[aria-pressed="true"] {
  border-color: #93c5fd;
  background: var(--promptier-active);
  font-weight: 700;
}
.promptier-command-button:disabled,
.promptier-action-menu-trigger:disabled {
  cursor: default;
  opacity: 0.45;
}
.promptier-mode-selector,
.promptier-document-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
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
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
.promptier-settings {
  position: relative;
  flex-shrink: 0;
}
.promptier-action-menu-trigger,
.promptier-settings > summary {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  list-style: none;
  white-space: nowrap;
}
.promptier-action-menu-trigger::-webkit-details-marker,
.promptier-settings > summary::-webkit-details-marker {
  display: none;
}
.promptier-action-menu[open] > .promptier-action-menu-trigger,
.promptier-settings[open] > summary {
  border-color: #93c5fd;
  background: var(--promptier-active);
}
.promptier-action-menu-popover {
  position: fixed;
}
.promptier-settings-panel {
  position: absolute;
  top: calc(100% + 0.45rem);
}
.promptier-action-menu-popover,
.promptier-settings-panel {
  z-index: 3;
  width: 17rem;
  max-height: min(28rem, calc(100vh - 7rem));
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid var(--promptier-border);
  border-radius: 0.4rem;
  background: #fff;
  box-shadow: 0 8px 20px #0002;
}
.promptier-settings-panel h3 {
  margin: 0.35rem 0.5rem;
  color: var(--promptier-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.promptier-action-menu-item {
  display: grid;
  width: 100%;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  gap: 0.4rem;
  align-items: center;
  padding: 0.45rem 0.5rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  text-align: start;
  cursor: pointer;
}
.promptier-action-menu-item:hover:not(:disabled) { background: var(--promptier-subtle); }
.promptier-action-menu-item:disabled { color: var(--promptier-muted); cursor: default; }
.promptier-action-menu-item small { grid-column: 2; color: var(--promptier-muted); font-size: 0.72rem; }
.promptier-action-menu-glyph { color: var(--promptier-muted); text-align: center; }
.promptier-action-menu-section .promptier-action-menu-glyph { color: #4338ca; }
.promptier-action-menu-variable .promptier-action-menu-glyph { color: #047857; }
.promptier-action-menu-tool .promptier-action-menu-glyph { color: #b91c1c; }
.promptier-settings { margin-inline-start: 0.25rem; padding-inline-start: 0.5rem; border-inline-start: 1px solid var(--promptier-border); }
.promptier-settings-panel { right: 0; left: auto; width: min(24rem, calc(100vw - 1rem)); padding: 0; }
.promptier-settings-panel > header { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0.8rem; border-bottom: 1px solid var(--promptier-border); }
.promptier-settings-panel h2 { margin: 0; font-size: 0.95rem; }
.promptier-settings-panel > header button { width: 1.75rem; height: 1.75rem; border: 0; border-radius: 0.25rem; background: transparent; color: inherit; font-size: 1.25rem; cursor: pointer; }
.promptier-settings-panel > header button:hover { background: var(--promptier-subtle); }
.promptier-settings-panel section { padding: 0.55rem 0.8rem; }
.promptier-settings-panel p { margin: 0.4rem 0; color: var(--promptier-muted); font-size: 0.78rem; line-height: 1.4; }
.promptier-settings-checkbox { display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; }
.promptier-settings-panel pre { max-height: 13rem; margin: 0.5rem 0 0; overflow: auto; padding: 0.55rem; border: 1px solid var(--promptier-border); border-radius: 0.3rem; background: var(--promptier-subtle); font: 0.72rem/1.45 ui-monospace, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
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
