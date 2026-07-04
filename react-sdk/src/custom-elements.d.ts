import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { SystemPromptEditorElement } from 'core-editor';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'system-prompt-editor': DetailedHTMLProps<
        HTMLAttributes<SystemPromptEditorElement>,
        SystemPromptEditorElement
      >;
    }
  }
}

export {};
