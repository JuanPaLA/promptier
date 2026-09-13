import { blockRegistry, markRegistry } from './prosemirror/proseMirrorConfiguration';
import { installEditorStyles as installProseMirrorStyles } from './prosemirror/styles/editorStyles';

export { createProseMirrorEditor } from './prosemirror/proseMirrorEditor';

export function installEditorStyles(root: ShadowRoot): void {
  installProseMirrorStyles(root, [
    ...blockRegistry.editorStyles(),
    ...markRegistry.editorStyles(),
  ]);
}
