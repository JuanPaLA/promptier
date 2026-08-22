import { styles } from '../../styles/styles';
import { EditorSurface } from '../editor/EditorSurface';
import { EditorHeader } from '../header/EditorHeader';
import { OutlinePanel } from '../outline/OutlinePanel';
import { usePromptEditor } from './usePromptEditor'

export interface PromptEditorProps {
    value?: string;
    onChange?(value: string): void;
    className?: string;
    defaultOutlineOpen?: boolean;
}

export function PromptEditor(props: PromptEditorProps) {
  const { model, actions } = usePromptEditor(props);
  const className = ['promptier-editor', props.className].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <style>{styles}</style>
      <EditorHeader
        outlineOpen={model.outlineOpen}
        toolbarItems={model.toolbarItems}
        onToggleOutline={actions.toggleOutline}
        onToolbarAction={actions.runToolbarAction}
      />
      <div className="promptier-body">
        {model.outlineOpen && (
          <OutlinePanel
            items={model.outlineItems}
            onSelect={actions.selectOutlineItem}
          />
        )}
        <EditorSurface mountOn={actions.mountEditor} />
      </div>
    </div>
  );
}
