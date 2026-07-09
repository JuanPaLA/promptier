const STYLE_ID = 'system-prompt-editor-styles';

const CSS = `
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

/** Injects the editor's structural styles once per document. */
export function ensureEditorStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
