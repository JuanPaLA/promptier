import { usePresenter } from '@nbottarini/react-presenter';
import { useState } from 'react';
import { CustomElementPromptEditor } from '../core/infrastructure/CustomElementPromptEditor';
import { PromptEditorPresenter, type PromptEditorProps } from './PromptEditorPresenter';

export function usePromptEditor(props: PromptEditorProps): CustomElementPromptEditor {
  const [editor] = useState(() => new CustomElementPromptEditor());

  usePresenter((onChange) => new PromptEditorPresenter(onChange, editor), props);

  return editor;
}
