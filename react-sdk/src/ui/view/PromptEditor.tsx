import { usePresenter } from '@nbottarini/react-presenter';
import { useState } from 'react';

import { PromptEditorService } from '../../lib/PromptEditorService';
import { styles } from '../styles/styles';
import {
  PromptEditorPresenter,
  type PromptEditorPresenterProps,
} from './PromptEditorPresenter';
import { Footer } from './footer/Footer';
import { Header } from './header/Header';
import { OutlinePanel } from './outline/OutlinePanel';

export interface PromptEditorProps extends PromptEditorPresenterProps {
  readonly defaultOutlineOpen?: boolean;
}

export function PromptEditor(props: PromptEditorProps) {
  const [editor] = useState(() => new PromptEditorService());
  const [outlineOpen, setOutlineOpen] = useState(true)
  const toggleOutline = () => setOutlineOpen((open) => !open);

    const presenter = usePresenter(
    (onChange) => new PromptEditorPresenter(onChange, editor),
    { value: props.value, onChange: props.onChange },
  );

  return (
    <div className="promptier-editor">
      <style>{styles}</style>
      {outlineOpen && (
        <OutlinePanel
          items={presenter.model.outlineItems}
          onSelect={presenter.selectOutlineItem}
          onToggle={toggleOutline}
        />
      )}
      <div className="promptier-main">
        <Header
          outlineOpen={outlineOpen}
          formatCommands={presenter.model.formatCommands}
          onToggleOutline={toggleOutline}
          onCommand={presenter.runCommand}
        />
        <div className="promptier-surface">
          <prompt-editor ref={editor.attach} />
        </div>
        <Footer
          charsLength={presenter.model.charsCount}
          wordCount={presenter.model.wordCount}
        />
      </div>
    </div>
  );
}
