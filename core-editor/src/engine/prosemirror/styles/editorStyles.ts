/** Injects the editor's structural styles once per document. */
export function ensureEditorStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}

const STYLE_ID = 'prompt-editor-styles';

const CSS = `
.prompt-editor-host {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.prompt-editor-host > .ProseMirror {
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
  outline: none;
  padding-bottom: 2rem;
  cursor: text;
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
.prompt-section-tag {
  position: absolute;
  top: 0.35rem;
  right: 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #8c959f;
  user-select: none;
  pointer-events: none;
}
.prompt-section-collapsed > .prompt-section-tag {
  color: #afb8c1;
}
.prompt-section-collapsed > .prompt-section-content > :not(.prompt-section-title) {
  display: none;
}
`;
