import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { PromptEditorElement } from '@cachai/promptier-core-editor';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'prompt-editor': DetailedHTMLProps<
        HTMLAttributes<PromptEditorElement>,
        PromptEditorElement
      >;
    }
  }
}

export {};
