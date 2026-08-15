/// <reference path="../custom-elements.d.ts" />
import type { CustomElementPromptEditor } from '../core/infrastructure/CustomElementPromptEditor';

/**
 * The humble half: renders one editor node and hands it to the editor object.
 * Everything that happens next is the adapter's and the presenter's business.
 *
 * Take this over `PromptEditorView` when the surrounding UI needs the editor
 * too — a command bar, an outline — so all of it drives the same instance.
 */
export function PromptEditorSurface({ editor }: { editor: CustomElementPromptEditor }) {
  return <prompt-editor ref={editor.mountOn} />;
}
