import { usePresenter } from '@nbottarini/react-presenter';
import { useState } from 'react';
import { CustomElementPromptEditor } from '../core/infrastructure/CustomElementPromptEditor';
import { PromptEditorPresenter, type PromptEditorProps } from './PromptEditorPresenter';

/**
 * One editor, bound to `value`/`onChange`. Returns the **editor**, not the
 * presenter: the presenter created here is private and only binds the value,
 * while surrounding UI — a command bar, an outline — composes over the port
 * with a presenter of its own.
 *
 * `PromptEditorView` is this plus the surface, for hosts that want no plumbing.
 */
export function usePromptEditor(props: PromptEditorProps): CustomElementPromptEditor {
  // Lazy initial state rather than useMemo: React may drop a memo, and the
  // editor's identity has to outlive every render of this component.
  const [editor] = useState(() => new CustomElementPromptEditor());

  usePresenter((onChange) => new PromptEditorPresenter(onChange, editor), props);

  return editor;
}
