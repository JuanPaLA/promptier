import { referenceStyles } from '../plugins/ReferenceDecorationsPlugin';
/** Installs the editor's fixed structural styles inside its private DOM root. */
export function installEditorStyles(
  root: ShadowRoot,
  extensionStyles: readonly string[] = [],
): void {
  const style = root.ownerDocument.createElement('style');
  style.textContent = [CSS, referenceStyles, ...extensionStyles].join('\n');
  root.append(style);
}

const CSS = `
.ProseMirror .promptier-variable {
  background: #ecfdf5; color: #047857; border-bottom: 1px solid #6ee7b7;
  border-radius: 3px; padding: 1px 2px;
}
.ProseMirror .promptier-variable-unknown { background: #fffbeb; color: #92400e; border-color: #d97706; }
.ProseMirror .promptier-variable-unverified { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
.ProseMirror .promptier-variable:focus { outline: 2px solid #059669; }
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
  white-space: pre-wrap;
  height: 100%;
  overflow: auto;
  outline: none;
  padding-bottom: 2rem;
  cursor: text;
}
`;
