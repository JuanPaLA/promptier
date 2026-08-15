/// <reference path="../custom-elements.d.ts" />
import type { CustomElementPromptEditor } from '../core/infrastructure/CustomElementPromptEditor';

export function PromptEditorSurface({ editor }: { editor: CustomElementPromptEditor }) {
  return <prompt-editor ref={editor.mountOn} />;
}
