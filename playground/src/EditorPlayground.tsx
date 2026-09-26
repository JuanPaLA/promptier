import { useState } from 'react';
import { PromptEditor, type ToolDefinition, type VariableSchema } from 'react-sdk';

const INITIAL_PROMPT = [
  'Eres un asistente de soporte.',
  'Personaliza la respuesta para {{ cliente.nombre_completo }}.',
  '',
  '<objetivos>',
  'Resolver la consulta en el menor número de turnos.',
  '</objetivos>',
  '',
  '<herramientas>',
  'Antes de hablar de un envío, consulta `buscar_pedido` con el `pedido_id` que indique el usuario.',
  '',
  'Si el problema persiste, registra el caso con `crear_reclamo()` y completa `crear_reclamo.motivo`.',
  '</herramientas>',
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

const VARIABLE_CONTEXT = {
  cliente: { nombre_completo: 'Ada Lovelace', vip: true },
  empresa: 'Promptier',
};

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
        <PromptEditor value={prompt} onChange={setPrompt} variableSchema={VARIABLE_SCHEMA} variableContext={VARIABLE_CONTEXT} tools={TOOLS} />
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

const VARIABLE_SCHEMA: VariableSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    cliente: {
      type: 'object', additionalProperties: false,
      properties: {
        nombre_completo: { type: ['string', 'null'], description: 'Nombre conocido del cliente' },
        vip: { type: 'boolean', description: 'Indica si el cliente tiene atención preferente' },
      },
    },
    empresa: { type: 'string', description: 'Nombre de la empresa', title: 'Empresa' },
    productos: {
      type: 'array', description: 'Productos disponibles; los recorridos se incorporarán más adelante',
      items: { type: 'object', properties: { nombre: { type: 'string' }, precio: { type: 'number' } } },
    },
  },
  required: ['empresa'],
};

const TOOLS: ToolDefinition[] = [
  {
    name: 'buscar_pedido',
    description: 'Consulta el estado y el seguimiento de un pedido',
    parameters: {
      type: 'object',
      required: ['pedido_id'],
      properties: {
        pedido_id: { type: 'string', description: 'Identificador del pedido' },
      },
    },
  },
  {
    name: 'crear_reclamo',
    description: 'Registra un reclamo para que lo atienda una persona',
    parameters: {
      type: 'object',
      required: ['pedido_id', 'motivo'],
      properties: {
        pedido_id: { type: 'string', description: 'Pedido afectado' },
        motivo: { type: 'string', description: 'Resumen del problema' },
        contacto: {
          type: 'object',
          properties: {
            canal: { type: 'string', description: 'Canal preferido para responder' },
          },
        },
      },
    },
  },
];
