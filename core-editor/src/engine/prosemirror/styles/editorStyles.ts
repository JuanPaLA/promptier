/** Installs the editor's fixed structural styles inside its private DOM root. */
export function installEditorStyles(root: ShadowRoot): void {
  const style = root.ownerDocument.createElement('style');
  style.textContent = CSS;
  root.append(style);
}

const CSS = `
:host {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.prompt-editor-surface {
  width: 100%;
  height: 100%;
  min-width: 0;
  background: #fff;
  color: #24292f;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}
.prompt-editor-surface,
.prompt-editor-surface *,
.prompt-editor-surface *::before,
.prompt-editor-surface *::after {
  box-sizing: border-box;
}
.prompt-editor-surface > .ProseMirror {
  height: 100%;
  overflow: auto;
  outline: none;
  padding-bottom: 2rem;
  cursor: text;
}
.ProseMirror p {
  margin: 0 0 0.75rem;
}
.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3 {
  margin: 1rem 0 0.5rem;
  font-weight: 600;
  line-height: 1.25;
}
.ProseMirror h1 {
  font-size: 1.75rem;
}
.ProseMirror h2 {
  font-size: 1.5rem;
}
.ProseMirror h3 {
  font-size: 1.25rem;
}
.prompt-section {
  position: relative;
  margin: 0.75rem 0;
  padding: 0.25rem 0 0.25rem 1.5rem;
  border-left: 2px solid #d0d7de;
}
.prompt-section-toggle {
  position: absolute;
  top: 0.35rem;
  left: 0.3rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1;
  color: #57606a;
}
.prompt-code-block {
  margin: 0.5rem 0;
  padding: 0.6rem 0.75rem;
  border-radius: 4px;
  background: #f6f8fa;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  white-space: pre-wrap;
  overflow-x: auto;
}
.prompt-ordered-list,
.prompt-unordered-list {
  margin: 0.5rem 0;
  padding-left: 1.6rem;
}
.prompt-ordered-list > li,
.prompt-unordered-list > li {
  margin: 0.15rem 0;
}
.prompt-section-title {
  min-height: 1.2em;
  margin-bottom: 0.25rem;
  font-weight: 600;
  font-size: 1.05em;
}
.prompt-section-collapsed > .prompt-section-content > :not(.prompt-section-title) {
  display: none;
}
`;
