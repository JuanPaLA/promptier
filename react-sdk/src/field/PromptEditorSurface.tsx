/// <reference path="../custom-elements.d.ts" />
import { forwardRef } from 'react';
import { registerPromptEditor, type PromptEditorElement } from 'core-editor';

registerPromptEditor();

export const PromptEditorSurface = forwardRef<PromptEditorElement>(
  function PromptEditorSurface(_, ref) {
    return <prompt-editor ref={ref} />;
  },
);
