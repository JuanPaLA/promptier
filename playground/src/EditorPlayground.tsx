import { useState } from 'react';
import { PromptEditor } from 'react-sdk';

const INITIAL_PROMPT = [
  'Eres un asistente de soporte.',
  '',
  '<objetivos>',
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
  '</reglas_de_estilo>',
  '</reglas_de_dialogo>',
].join('\n');

/** A host page: it supplies prompt text, receives prompt text, and saves it. */
export function EditorPlayground() {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);

  return (
    <main
      style={{
        width: 'min(90rem, 100%)',
        minHeight: '100vh',
        margin: '0 auto',
        padding: '1.5rem',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Promptier host example</h1>
        <p style={{ margin: '0.35rem 0 0', color: '#57606a' }}>
          This page owns persistence. The React SDK owns the editor interface.
        </p>
      </header>

      <div style={{ height: '75vh', minHeight: '30rem' }}>
        <PromptEditor value={prompt} onChange={setPrompt} />
      </div>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
      </footer>
    </main>
  );
}
