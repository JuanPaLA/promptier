import { useState } from 'react';
import { toMarkdown, toXml, type Block, type PromptContent, type SectionBlock } from 'core-editor';
import { SystemPromptEditorField } from 'react-sdk';

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
          ],
        },
        {
          blockType: 'section',
          id: 'reglas-estilo',
          title: 'Reglas de estilo',
          children: [
            { blockType: 'paragraph', content: [{ text: 'Tono cordial y directo.' }] },
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

export function EditorPlayground() {
  const [content, setContent] = useState<PromptContent>(initialContent);

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
            <SystemPromptEditorField content={content} onChange={setContent} />
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
