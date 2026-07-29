import { useEffect, type RefObject } from 'react';
import type { EditorSelectionState, PromptEditorElement } from 'core-editor';

export function useEditorSelectionListener(
  ref: RefObject<PromptEditorElement>,
  onSelectionChange?: (state: EditorSelectionState) => void,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !onSelectionChange) return;

    const handleSelectionChange = (event: Event) => {
      onSelectionChange((event as CustomEvent<EditorSelectionState>).detail);
    };

    element.addEventListener('selectionchange', handleSelectionChange);
    return () => element.removeEventListener('selectionchange', handleSelectionChange);
  }, [ref, onSelectionChange]);
}
