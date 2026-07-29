import { useState, type RefObject } from 'react';
import type {
  EditorCommand,
  EditorSelectionState,
  PromptContent,
  PromptEditorElement,
} from 'core-editor';
import { useEditorCommands } from '../element/useEditorCommands';
import { useEditorContentBinding } from '../element/useEditorContentBinding';
import { useEditorElement } from '../element/useEditorElement';
import { useEditorSelectionListener } from '../element/useEditorSelectionListener';

export interface UsePromptEditorOptions {
  content: PromptContent;
  onChange: (content: PromptContent) => void;
}

/**
 * Everything a host needs to drive one editor: where to mount it, how to run
 * commands against it, and its current selection. When a Context layer lands,
 * this is the value a provider publishes.
 */
export interface PromptEditorController {
  elementRef: RefObject<PromptEditorElement>;
  run: (command: EditorCommand) => void;
  selection: EditorSelectionState | null;
}

export function usePromptEditor({
  content,
  onChange,
}: UsePromptEditorOptions): PromptEditorController {
  const elementRef = useEditorElement();
  const [selection, setSelection] = useState<EditorSelectionState | null>(null);

  useEditorContentBinding(elementRef, content, onChange);
  useEditorSelectionListener(elementRef, setSelection);
  const run = useEditorCommands(elementRef);

  return { elementRef, run, selection };
}
