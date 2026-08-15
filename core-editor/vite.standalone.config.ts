import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * The `<script src>` bundle: everything inlined, including ProseMirror, because
 * a plain script has no module resolution. Runs after the library build, so it
 * must not empty the output directory.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/standalone.ts'),
      formats: ['iife'],
      name: 'PromptierStandalone',
      fileName: () => 'promptier.js',
    },
  },
});
