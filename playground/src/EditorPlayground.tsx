import { useState } from 'react';
import { toMarkdown, type Block, type PromptContent, type SectionBlock } from 'core-editor';
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
    <nav>
      <h2>Outline</h2>
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
    <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <Outline blocks={content.blocks} />
      </div>
      <div style={{ flex: 1 }}>
        <h2>System Prompt Editor</h2>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, minHeight: 200, padding: '0.75rem' }}>
          <SystemPromptEditorField content={content} onChange={setContent} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <h2>Live Domain State (PromptContent)</h2>
        <pre
          style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: 4, minHeight: 200, overflow: 'auto' }}
        >
          {JSON.stringify(content, null, 2)}
        </pre>
        <h2>Markdown (what an agent would consume)</h2>
        <pre
          style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: 4, minHeight: 100, overflow: 'auto' }}
        >
          {toMarkdown(content)}
        </pre>
      </div>
    </div>
  );
}
