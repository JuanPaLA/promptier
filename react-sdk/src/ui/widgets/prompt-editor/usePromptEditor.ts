import {
  outline,
  type CommandState,
  type EditorCommand,
  type OutlineEntry,
} from 'core-editor';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { PromptEditorController } from '../../../app/PromptEditorController';
import type { ToolbarItemViewModel } from '../header/EditorToolbar';
import type { OutlineItemViewModel } from '../outline/OutlinePanel';
import type { PromptEditorBinding } from './PromptEditorState';
import { PromptEditorProps } from './PromptEditor'

export function usePromptEditor(
  props: PromptEditorProps,
): PromptEditorBinding {
  const [controller] = useState(() => new PromptEditorController(props.value));
  const [outlineOpen, setOutlineOpen] = useState(props.defaultOutlineOpen ?? true);
  const lastPrompt = useRef(props.value ?? '');
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    if (props.value !== undefined && props.value !== lastPrompt.current) {
      lastPrompt.current = props.value;
      controller.setPrompt(props.value);
      return;
    }
    if (snapshot.prompt === lastPrompt.current) return;
    lastPrompt.current = snapshot.prompt;
    props.onChange?.(snapshot.prompt);
  }, [controller, props.onChange, props.value, snapshot.prompt]);

  const toolbar = useMemo(
    () => buildToolbarBinding(snapshot.state?.commands ?? []),
    [snapshot.state],
  );
  const outlineBinding = useMemo(
    () => buildOutlineBinding(outline(snapshot.content)),
    [snapshot.content],
  );

  const toggleOutline = useCallback(() => {
    setOutlineOpen((open) => !open);
  }, []);
  const runToolbarAction = useCallback((id: string) => {
    const command = toolbar.commandsById.get(id);
    if (command) controller.run(command);
  }, [controller, toolbar]);
  const selectOutlineItem = useCallback((id: string) => {
    const path = outlineBinding.pathsById.get(id);
    if (path) {
      controller.run({ type: 'navigate', target: { kind: 'section', path } });
    }
  }, [controller, outlineBinding]);

  return {
    model: {
      outlineOpen,
      toolbarItems: toolbar.items,
      outlineItems: outlineBinding.items,
    },
    actions: {
      mountEditor: controller.attach,
      toggleOutline,
      runToolbarAction,
      selectOutlineItem,
    },
  };
}

interface ToolbarBinding {
  readonly items: readonly ToolbarItemViewModel[];
  readonly commandsById: ReadonlyMap<string, EditorCommand>;
}

function buildToolbarBinding(states: readonly CommandState[]): ToolbarBinding {
  const items: ToolbarItemViewModel[] = [];
  const commandsById = new Map<string, EditorCommand>();
  states.forEach((state) => {
    const item = toolbarItemFrom(state);
    if (!item) return;
    items.push(item);
    commandsById.set(item.id, state.command);
  });
  return { items, commandsById };
}

function toolbarItemFrom(state: CommandState): ToolbarItemViewModel | null {
  if (state.command.type !== 'format') return null;
  const common = { disabled: !state.enabled, active: state.active };
  switch (state.command.format) {
    case 'bold':
      return {
        ...common,
        id: 'format.bold',
        label: 'Bold',
        glyph: 'B',
        shortcut: 'Ctrl+B',
      };
    case 'code':
      return {
        ...common,
        id: 'format.code',
        label: 'Inline code',
        glyph: '</>',
        shortcut: 'Ctrl+`',
      };
  }
}

interface OutlineBinding {
  readonly items: readonly OutlineItemViewModel[];
  readonly pathsById: ReadonlyMap<string, readonly number[]>;
}

function buildOutlineBinding(entries: readonly OutlineEntry[]): OutlineBinding {
  const pathsById = new Map<string, readonly number[]>();
  const items = entries.map((entry) => {
    const id = `section:${entry.path.join('.')}`;
    pathsById.set(id, entry.path);
    return {
      id,
      label: entry.title || '(untitled section)',
      depth: entry.depth,
    };
  });
  return { items, pathsById };
}
