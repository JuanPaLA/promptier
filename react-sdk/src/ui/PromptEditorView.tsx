import type { PromptEditorProps } from './PromptEditorPresenter';
import { PromptEditorSurface } from './PromptEditorSurface';
import { usePromptEditor } from './usePromptEditor';

export function PromptEditorView(props: PromptEditorProps) {
  const editor = usePromptEditor(props);

  return <PromptEditorSurface editor={editor} />;
}
