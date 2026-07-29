import { useState } from 'react';
import {
  toMarkdown,
  toXml,
  type Block,
  type EditorCommand,
  type EditorSelectionState,
  type PromptContent,
  type SectionBlock,
} from 'core-editor';
import { PromptEditorSurface, usePromptEditor } from 'react-sdk';

const initialContent: PromptContent = {
  version: 1,
  blocks: [
    { blockType: 'paragraph', content: [
      { text: 'Eres un asistente de soporte. Escribe ' },
      { text: '/section ', formats: ['code'] },
      { text: 'en una línea vacía para crear una sección.' },
    ] },
    {
      blockType: 'section',
      id: 'objetivos',
      title: 'Objetivos',
      description: 'Qué debe lograr el asistente en cada conversación.',
      children: [
        { blockType: 'paragraph', content: [{ text: 'Resolver la consulta en el menor número de turnos.' }] },
      ],
    },
    {
      blockType: 'section',
      id: 'reglas-dialogo',
      title: 'Reglas de diálogo',
      children: [
        {
          blockType: 'section',
          id: 'reglas-formato',
          title: 'Reglas de formato',
          children: [
            { blockType: 'paragraph', content: [
              { text: 'Responde en ' },
              { text: 'markdown', formats: ['bold'] },
              { text: ', sin encabezados de nivel 1.' },
            ] },
            { blockType: 'orderedList', items: [
              [{ text: 'Saluda con cortesía.' }],
              [{ text: 'Identifica el problema del usuario.' }],
              [{ text: 'Propón una solución en ' }, { text: 'pasos concretos', formats: ['bold'] }, { text: '.' }],
            ] },
          ],
        },
        {
          blockType: 'section',
          id: 'reglas-estilo',
          title: 'Reglas de estilo',
          children: [
            { blockType: 'paragraph', content: [{ text: 'Tono cordial y directo.' }] },
            { blockType: 'unorderedList', items: [
              [{ text: 'Evita jerga técnica innecesaria.' }],
              [{ text: 'Usa frases ' }, { text: 'cortas', formats: ['bold'] }, { text: '.' }],
            ] },
          ],
        },
      ],
    },
  ],
};

interface OutlineEntry {
  id: string;
  title: string;
  depth: number;
}

function collectOutline(blocks: Block[], depth = 0): OutlineEntry[] {
  return blocks
    .filter((block): block is SectionBlock => block.blockType === 'section')
    .flatMap((section) => [
      { id: section.id, title: section.title || '(sin título)', depth },
      ...collectOutline(section.children, depth + 1),
    ]);
}

function Outline({ blocks }: { blocks: Block[] }) {
  const entries = collectOutline(blocks);
  return (
    <nav style={{ height: '100%', overflow: 'auto' }}>
      <h2 style={{ margin: '0 0 0.75rem' }}>Arbol</h2>
      {entries.length === 0 && <p style={{ color: '#888' }}>Sin secciones todavía.</p>}
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{ paddingLeft: entry.depth * 16, cursor: 'pointer', lineHeight: 1.8 }}
          onClick={() =>
            document
              .querySelector(`[data-section-id="${entry.id}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        >
          {entry.title}
        </div>
      ))}
    </nav>
  );
}

interface FormatButton {
  label: string;
  command: EditorCommand;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { label: 'B', command: { id: 'format.bold' } },
  { label: '</>', command: { id: 'format.code' } },
];

function FormatToolbar({
  selection,
  onRun,
}: {
  selection: EditorSelectionState | null;
  onRun: (command: EditorCommand) => void;
}) {
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
              onRun(command);
            }}
            disabled={selection ? !state?.enabled : false}
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

export function EditorPlayground() {
  const [content, setContent] = useState<PromptContent>(initialContent);
  const { elementRef, run, selection } = usePromptEditor({ content, onChange: setContent });

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
          <FormatToolbar selection={selection} onRun={run} />
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
            <PromptEditorSurface ref={elementRef} />
          </div>
        </section>
        <aside style={{ height: '70vh', minWidth: 0, overflow: 'hidden' }}>
          <Outline blocks={content.blocks} />
        </aside>
      </div>
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
          <h2 style={{ margin: '0 0 0.75rem' }}>Markdown</h2>
          <pre
            style={{
              margin: 0,
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: 4,
              minHeight: 160,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {toMarkdown(content)}
          </pre>
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 0.75rem' }}>XML</h2>
          <pre
            style={{
              margin: 0,
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: 4,
              minHeight: 160,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {toXml(content)}
          </pre>
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 0.75rem' }}>Prompt JSON</h2>
          <pre
            style={{
              margin: 0,
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: 4,
              minHeight: 160,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
