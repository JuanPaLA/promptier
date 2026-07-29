import { useRef, type RefObject } from 'react';
import type { PromptEditorElement } from 'core-editor';

export function useEditorElement(): RefObject<PromptEditorElement> {
  return useRef<PromptEditorElement>(null);
}
