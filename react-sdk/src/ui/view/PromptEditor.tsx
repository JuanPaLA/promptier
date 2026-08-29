import { usePresenter } from '@nbottarini/react-presenter';
import { useState } from 'react';

import { PromptEditorService } from '../../lib/PromptEditorService';
import { styles } from '../styles/styles';
import {
  PromptEditorPresenter,
  type PromptEditorPresenterProps,
} from './PromptEditorPresenter';
import { EditorHeader } from './header/EditorHeader';
import { OutlinePanel } from './outline/OutlinePanel';

export interface PromptEditorProps extends PromptEditorPresenterProps {
  readonly defaultOutlineOpen?: boolean;
}

export function PromptEditor(props: PromptEditorProps) {
  const [editor] = useState(() => new PromptEditorService());
  const [outlineOpen, setOutlineOpen] = useState(true)

    const presenter = usePresenter(
    (onChange) => new PromptEditorPresenter(onChange, editor),
    { value: props.value, onChange: props.onChange },
  );

  return (
    <div className="promptier-editor">
      <style>{styles}</style>
      <EditorHeader
        outlineOpen={outlineOpen}
        commandItems={presenter.model.commandItems}
        onToggleOutline={() => setOutlineOpen((open) => !open)}
        onCommand={presenter.runCommand}
      />
      <div className="promptier-body">
        {outlineOpen && (
          <OutlinePanel
            items={presenter.model.outlineItems}
            onSelect={presenter.selectOutlineItem}
          />
        )}
        <div className="promptier-surface">
          <prompt-editor ref={editor.attach} />
        </div>
      </div>
    </div>
  );
}
