import { useCallback, type RefObject } from 'react';
import type { EditorCommand, PromptEditorElement } from 'core-editor';

export function useEditorCommands(
  ref: RefObject<PromptEditorElement>,
): (command: EditorCommand) => void {
  return useCallback((command: EditorCommand) => ref.current?.run(command), [ref]);
}
