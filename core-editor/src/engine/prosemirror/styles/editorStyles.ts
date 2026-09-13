import { referenceStyles } from '../plugins/referenceDecorations';
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
`;
