import { useEffect, useState } from 'react';
import {
  outline,
  parse,
  serialize,
  type EditorCommand,
  type EditorSelectionState,
  type OutlineEntry,
  type PromptContent,
} from 'core-editor';
import { PromptEditorSurface, usePromptEditor, type PromptEditorPort } from 'react-sdk';
import { MinimalConsumer } from './MinimalConsumer';

/**
 * The host's starting point is a *string*. Nothing here names a block or a
 * format — that is the SDK contract this playground exists to show.
 */
const INITIAL_PROMPT = [
  'Eres un asistente de soporte. Escribe `/section ` en una línea vacía para crear una sección.',
  '',
  '<objetivos>',
  '<!-- description: Qué debe lograr el asistente en cada conversación. -->',
  '',
  'Resolver la consulta en el menor número de turnos.',
  '</objetivos>',
  '',
  '<reglas_de_dialogo>',
  '<reglas_de_formato>',
  'Responde en **markdown**, sin encabezados de nivel 1.',
  '',
  '1. Saluda con cortesía.',
  '2. Identifica el problema del usuario.',
  '3. Propón una solución en **pasos concretos**.',
  '</reglas_de_formato>',
  '',
  '<reglas_de_estilo>',
  'Tono cordial y directo.',
  '',
  '- Evita jerga técnica innecesaria.',
  '- Usa frases **cortas**.',
  '',
  '```json',
  '{',
  '  "tono": "cordial",',
  '  "maxTurnos": 3',
  '}',
  '```',
  '</reglas_de_estilo>',
  '</reglas_de_dialogo>',
].join('\n');

const PANE_STYLE = {
  margin: 0,
  background: '#f5f5f5',
  padding: '0.75rem',
  borderRadius: 4,
  minHeight: 160,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
} as const;

function Outline({ entries }: { entries: OutlineEntry[] }) {
  return (
    <nav style={{ height: '100%', overflow: 'auto' }}>
      <h2 style={{ margin: '0 0 0.75rem' }}>Arbol</h2>
      {entries.length === 0 && <p style={{ color: '#888' }}>Sin secciones todavía.</p>}
      {entries.map((entry, index) => (
        <div
          key={`${entry.id}-${index}`}
          style={{ paddingLeft: entry.depth * 16, cursor: 'pointer', lineHeight: 1.8 }}
          onClick={() =>
            document
              .querySelector(`[data-section-id="${entry.id}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        >
          {entry.title || '(sin título)'}
        </div>
      ))}
    </nav>
  );
}

const FORMAT_BUTTONS: { label: string; command: EditorCommand }[] = [
  { label: 'B', command: { id: 'format.bold' } },
  { label: '</>', command: { id: 'format.code' } },
];

/**
 * Drives commands through the port, never the DOM — the shape a real
 * `<CommandBar>` will have once it moves into the SDK, built from
 * `availableCommands()` instead of this hardcoded list.
 */
function FormatToolbar({ editor }: { editor: PromptEditorPort }) {
  const [selection, setSelection] = useState<EditorSelectionState | null>(() =>
    editor.selectionState(),
  );

  useEffect(() => editor.onSelectionChanged(setSelection), [editor]);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {FORMAT_BUTTONS.map(({ label, command }) => {
        const state = selection?.commands[command.id];
        const active = state?.active ?? false;
        return (
          <button
            key={command.id}
            type="button"
            // Keep the editor selection alive: a plain click would blur the
            // editor before run() fires.
            onMouseDown={(event) => {
              event.preventDefault();
              editor.run(command);
            }}
            disabled={!state?.enabled}
            style={{
              minWidth: 32,
              padding: '0.25rem 0.5rem',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: active ? '#dfe3ff' : '#fff',
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The structured view, which only this playground wants. An SDK host that just
 * stores prompts never renders anything like it.
 */
function Inspector({ prompt, content }: { prompt: string; content: PromptContent | null }) {
  const stable = serialize(parse(prompt)) === prompt;
  return (
    <section
      style={{
        marginTop: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: '0 0 0.75rem' }}>Prompt text</h2>
        <pre style={PANE_STYLE}>{prompt}</pre>
      </div>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: '0 0 0.75rem' }}>
          Round-trip{' '}
          <span style={{ fontSize: '0.7em', color: stable ? '#1a7f37' : '#cf222e' }}>
            {stable ? '● stable' : '● differs'}
          </span>
        </h2>
        <pre style={PANE_STYLE}>{serialize(parse(prompt))}</pre>
      </div>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: '0 0 0.75rem' }}>Prompt JSON</h2>
        <pre style={PANE_STYLE}>{content ? JSON.stringify(content, null, 2) : ''}</pre>
      </div>
    </section>
  );
}

/**
 * The whole SDK contract: a host hands the editor a string and takes one back.
 * Loading a new prompt is just setting that string — the editor re-seeds
 * because it differs from the one it last reported.
 */
function TextLoader({ onLoad }: { onLoad: (prompt: string) => void }) {
  const [draft, setDraft] = useState('');
  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.75rem' }}>Load from text (SDK contract)</h2>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={'<goals>\nBe fast.\n</goals>'}
        style={{ width: '100%', minHeight: 120, fontFamily: 'ui-monospace, monospace', padding: '0.5rem' }}
      />
      <button
        type="button"
        onClick={() => onLoad(draft)}
        style={{ marginTop: '0.5rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
      >
        Load into editor
      </button>
    </section>
  );
}

export function EditorPlayground() {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const editor = usePromptEditor({ value: prompt, onChange: setPrompt });

  // The structured document, pulled only because this playground draws an
  // outline and a JSON pane from it. An SDK host that just saves prompts never
  // reaches past the string.
  // Pulled once on mount as well as on every edit: seeding the editor does not
  // emit `change` (setContent replaces the state rather than applying a
  // transaction), so subscribing alone would leave these panes empty until the
  // first keystroke. This effect runs after the presenter's, so the seed landed.
  const [content, setContent] = useState<PromptContent | null>(null);
  useEffect(() => {
    const pullContent = () => setContent(editor.getContent());
    pullContent();
    return editor.onPromptChanged(pullContent);
  }, [editor]);

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 70vw) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        <section style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 0.75rem' }}>System Prompt Editor</h2>
          <FormatToolbar editor={editor} />
          <div
            style={{
              width: '70vw',
              height: '70vh',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '0.75rem',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <PromptEditorSurface editor={editor} />
          </div>
        </section>
        <aside style={{ height: '70vh', minWidth: 0, overflow: 'hidden' }}>
          <Outline entries={content ? outline(content) : []} />
        </aside>
      </div>
      <Inspector prompt={prompt} content={content} />
      <TextLoader onLoad={setPrompt} />
      <MinimalConsumer defaultValue={'<tono>\nUsa frases **cortas**.\n</tono>'} />
    </div>
  );
}
