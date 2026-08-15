import type { PromptEditorProps } from './PromptEditorPresenter';
import { PromptEditorSurface } from './PromptEditorSurface';
import { usePromptEditor } from './usePromptEditor';

/**
 * The editor as one component — published as `PromptEditor`, since a host
 * should not have to know this layer's pattern to mount one:
 *
 * ```tsx
 * const [prompt, setPrompt] = useState(saved);
 * <PromptEditor value={prompt} onChange={setPrompt} />
 * ```
 *
 * Strings in, strings out. Nothing here names a block, a format or a version.
 */
export function PromptEditorView(props: PromptEditorProps) {
  const editor = usePromptEditor(props);

  return <PromptEditorSurface editor={editor} />;
}
