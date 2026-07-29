import { useEffect, type RefObject } from 'react';
import type { PromptContent, PromptEditorElement } from 'core-editor';

export function useEditorContentBinding(
  ref: RefObject<PromptEditorElement>,
  content: PromptContent,
  onChange: (content: PromptContent) => void,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleChange = (event: Event) => {
      onChange((event as CustomEvent<PromptContent>).detail);
    };

    element.addEventListener('change', handleChange);
    return () => element.removeEventListener('change', handleChange);
  }, [ref, onChange]);

  useEffect(() => {
    if (ref.current) {
      ref.current.content = content;
    }
  }, [ref, content]);
}
