/// <reference path="./custom-elements.d.ts" />
import { useEffect, useRef } from 'react';
import { registerSystemPromptEditor, type PromptContent, type SystemPromptEditorElement } from 'core-editor';

registerSystemPromptEditor();

interface SystemPromptEditorFieldProps {
  content: PromptContent;
  onChange: (content: PromptContent) => void;
}

export function SystemPromptEditorField({ content, onChange }: SystemPromptEditorFieldProps) {
  const elementRef = useRef<SystemPromptEditorElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleChange = (event: Event) => {
      onChange((event as CustomEvent<PromptContent>).detail);
    };

    element.addEventListener('change', handleChange);
    return () => element.removeEventListener('change', handleChange);
  }, [onChange]);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.content = content;
    }
  }, [content]);

  return <system-prompt-editor ref={elementRef} />;
}
