import { useState } from 'react';
import { PromptEditor } from 'react-sdk';

/**
 * A whole integration, and the point of the SDK: a string goes in, a string
 * comes out.
 *
 * Note what this file does *not* import — no `PromptContent`, no `Block`, no
 * `Format`, nothing from `core-editor` at all. That absence is the contract,
 * and it is checked by the compiler every time this file builds.
 */
export function MinimalConsumer({ defaultValue }: { defaultValue: string }) {
  const [prompt, setPrompt] = useState(defaultValue);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <section style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.25rem' }}>Minimal consumer</h2>
      <p style={{ margin: '0 0 0.75rem', color: '#57606a', fontSize: '0.9em' }}>
        The entire integration: <code>value</code> in, <code>onChange</code> out. This component
        imports nothing from <code>core-editor</code>.
      </p>
      <div style={{ height: '14rem', border: '1px solid #ccc', borderRadius: 4, padding: '0.75rem' }}>
        <PromptEditor value={prompt} onChange={setPrompt} />
      </div>
      <button
        type="button"
        onClick={() => setSaved(prompt)}
        style={{ margin: '0.75rem 0', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
      >
        Save
      </button>
      {saved !== null && (
        <pre
          style={{
            margin: 0,
            background: '#f5f5f5',
            padding: '0.75rem',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {saved}
        </pre>
      )}
    </section>
  );
}
