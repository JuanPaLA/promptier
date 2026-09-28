/// <reference path="../../custom-elements.d.ts" />
import { usePresenter } from '@nbottarini/react-presenter';
import { useRef, useState } from 'react';

import { PromptEditorService } from '../../lib/PromptEditorService';
import { styles } from '../styles/styles';
import {
  PromptEditorPresenter,
  type PromptEditorPresenterProps,
} from './PromptEditorPresenter';
import { Footer } from './footer/Footer';
import { Header } from './header/Header';
import { OutlinePanel } from './outline/OutlinePanel';
import { useFullscreen } from '../components/hooks/useFullscreen';
import { RawPromptView } from './RawPromptView';
import { useCopyPrompt } from '../components/hooks/useCopyPrompt';

export type PromptEditorProps = PromptEditorPresenterProps;

export function PromptEditor(props: PromptEditorProps) {
  const editorRoot = useRef<HTMLDivElement>(null);
  const [editor] = useState(() => new PromptEditorService());
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [viewMode, setViewMode] = useState<EditorViewMode>('curated');
  const [variableValidation, setVariableValidation] = useState(false);
  const clipboard = useCopyPrompt(() => editor.getSnapshot().prompt);
  const fullView = useFullscreen(editorRoot);
  const toggleOutline = () => setOutlineOpen((open) => !open);

  const presenter = usePresenter(
    (onChange) => new PromptEditorPresenter(onChange, editor),
    { value: props.value, onChange: props.onChange, variableSchema: props.variableSchema, tools: props.tools },
  );

  return (
    <div ref={editorRoot} className="promptier-editor">
      <style>{styles}</style>
      {outlineOpen && viewMode === 'curated' && (
        <OutlinePanel
          items={presenter.model.outlineItems}
          onSelect={presenter.selectOutlineItem}
          onToggle={toggleOutline}
        />
      )}
      <div className="promptier-main">
        <Header
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          copyStatus={clipboard.status}
          onCopy={clipboard.copy}
          outlineOpen={outlineOpen}
          formatCommands={presenter.model.formatCommands}
          blockCommands={presenter.model.blockCommands}
          referenceCommands={presenter.model.referenceCommands}
          variableCommands={presenter.model.variableCommands}
          toolCommands={presenter.model.toolCommands}
          variableValidation={variableValidation}
          onToggleOutline={toggleOutline}
          onCommand={presenter.runCommand}
          fullViewAvailable={fullView.available}
          fullViewActive={fullView.active}
          onToggleFullView={fullView.toggle}
          onVariableValidationChange={(enabled) => {
            setVariableValidation(enabled);
            editor.setVariableValidation(enabled);
          }}
        />
        <div className="promptier-surface" hidden={viewMode === 'raw'}>
          <prompt-editor ref={editor.attach} />
        </div>
        {viewMode === 'raw' && <RawPromptView prompt={presenter.model.prompt} />}
        <Footer
          charsLength={presenter.model.charsCount}
          wordCount={presenter.model.wordCount}
        />
      </div>
    </div>
  );
}

export type EditorViewMode = 'curated' | 'raw';
