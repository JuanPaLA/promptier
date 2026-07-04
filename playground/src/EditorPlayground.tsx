import { useState } from 'react';
import { emptySystemPromptContent, type SystemPromptContent } from 'core-editor';
import { SystemPromptEditorField } from 'react-sdk';

export function EditorPlayground() {
  const [content, setContent] = useState<SystemPromptContent>(emptySystemPromptContent());

  return (
    <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1 }}>
        <h2>System Prompt Editor</h2>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, minHeight: 200, padding: '0.75rem' }}>
          <SystemPromptEditorField content={content} onChange={setContent} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <h2>Live Domain State (SystemPromptContent)</h2>
        <pre
          style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: 4, minHeight: 200, overflow: 'auto' }}
        >
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}
