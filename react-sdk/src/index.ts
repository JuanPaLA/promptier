/**
 * The whole public surface. `PromptEditor` is the editor in one component;
 * `usePromptEditor` + `PromptEditorSurface` are the same thing unbundled, for
 * hosts composing their own UI around one editor.
 */
export { PromptEditorView as PromptEditor } from './ui/PromptEditorView';
export { PromptEditorSurface } from './ui/PromptEditorSurface';
export { usePromptEditor } from './ui/usePromptEditor';
export type { PromptEditorProps } from './ui/PromptEditorPresenter';
// The editor as this SDK models it. Name it when writing UI of your own over
// one — a command bar, an outline — so that UI never touches the DOM either.
export type { PromptEditor as PromptEditorPort, Unsubscribe } from './core/app/PromptEditor';
