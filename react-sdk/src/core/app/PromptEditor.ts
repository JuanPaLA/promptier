import type {
  CommandId,
  EditorCommand,
  EditorSelectionState,
  PromptContent,
} from 'core-editor';

export type Unsubscribe = () => void;
export type PromptListener = (prompt: string) => void;
export type SelectionListener = (selection: EditorSelectionState) => void;

/**
 * What this SDK needs from an editor, in the SDK's own vocabulary: prompts as
 * strings, commands, selection. Nothing about mounting, nodes or lifecycle — a
 * presenter written against this cannot tell whether the editor is a custom
 * element in this document or one behind a postMessage bridge in an iframe.
 * That second implementation is why the port exists at all.
 *
 * `core-editor` has a port of the same name, which is never exported and speaks
 * `PromptContent`. This one is not a mirror of it: the string is the SDK's
 * contract, and this is the narrowing to it.
 */
export interface PromptEditor {
  getPrompt(): string;
  setPrompt(prompt: string): void;
  /** Structure, for outlines and inspection. Opt-in; the contract is the string. */
  getContent(): PromptContent;
  run(command: EditorCommand): void;
  availableCommands(): CommandId[];
  /** `null` until there is an editor with a selection to describe. */
  selectionState(): EditorSelectionState | null;
  onPromptChanged(listener: PromptListener): Unsubscribe;
  onSelectionChanged(listener: SelectionListener): Unsubscribe;
}
