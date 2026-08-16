/**
 * The `<script src>` entry: registers `<prompt-editor>` on load and publishes
 * the codec as `window.Promptier`.
 *
 * Separate from `index.ts` on purpose. Registering is a side effect, and the
 * module entry has to stay free of them so bundlers can tree-shake it and SSR
 * can import it. This file exists precisely to *have* the side effect.
 */
import { parse } from './prompt/serialization/parse';
import { serialize } from './prompt/serialization/serialize';
import { registerPromptEditor } from './element/PromptEditorElement';

registerPromptEditor();

const api = { parse, serialize, registerPromptEditor };

declare global {
  interface Window {
    Promptier: typeof api;
  }
}

window.Promptier = api;

export {};
