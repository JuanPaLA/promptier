import { forwardRef, useImperativeHandle } from 'react';
import type { EditorCommand, EditorSelectionState, PromptContent } from 'core-editor';
import { useEditorCommands } from '../element/useEditorCommands';
import { useEditorContentBinding } from '../element/useEditorContentBinding';
import { useEditorElement } from '../element/useEditorElement';
import { useEditorSelectionListener } from '../element/useEditorSelectionListener';
import { PromptEditorSurface } from './PromptEditorSurface';

export interface PromptEditorFieldHandle {
  run: (command: EditorCommand) => void;
}

interface PromptEditorFieldProps {
  content: PromptContent;
  onChange: (content: PromptContent) => void;
  onSelectionChange?: (state: EditorSelectionState) => void;
}

export const PromptEditorField = forwardRef<PromptEditorFieldHandle, PromptEditorFieldProps>(
  function PromptEditorField({ content, onChange, onSelectionChange }, ref) {
    const elementRef = useEditorElement();
    const run = useEditorCommands(elementRef);

    useImperativeHandle(ref, () => ({ run }), [run]);
    useEditorContentBinding(elementRef, content, onChange);
    useEditorSelectionListener(elementRef, onSelectionChange);

    return <PromptEditorSurface ref={elementRef} />;
  },
);
