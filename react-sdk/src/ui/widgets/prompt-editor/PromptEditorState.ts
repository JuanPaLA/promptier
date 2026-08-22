import type { ToolbarItemViewModel } from '../header/EditorToolbar';
import type { OutlineItemViewModel } from '../outline/OutlinePanel';

export interface PromptEditorState {
  readonly outlineOpen: boolean;
  readonly toolbarItems: readonly ToolbarItemViewModel[];
  readonly outlineItems: readonly OutlineItemViewModel[];
}

export interface PromptEditorActions {
  readonly mountEditor: (element: HTMLElement | null) => void;
  readonly toggleOutline: () => void;
  readonly runToolbarAction: (id: string) => void;
  readonly selectOutlineItem: (id: string) => void;
}

export interface PromptEditorBinding {
  readonly model: PromptEditorState;
  readonly actions: PromptEditorActions;
}
