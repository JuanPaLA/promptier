/// <reference path="./custom-elements.d.ts" />
import { useEffect, useRef } from 'react';
import { registerSystemPromptEditor, type SystemPromptContent, type SystemPromptEditorElement } from 'core-editor';

registerSystemPromptEditor();

interface SystemPromptEditorFieldProps {
  content: SystemPromptContent;
  onChange: (content: SystemPromptContent) => void;
}

export function SystemPromptEditorField({ content, onChange }: SystemPromptEditorFieldProps) {
  const elementRef = useRef<SystemPromptEditorElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleChange = (event: Event) => {
      onChange((event as CustomEvent<SystemPromptContent>).detail);
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
