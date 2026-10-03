import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Two outputs, because they answer two different questions:
 *
 * - `format`   — the codec alone, for a developer's server. No DOM, no
 *                ProseMirror; that absence is asserted by a test.
 * - `editor`   — the element, with ProseMirror left external so a consumer's
 *                bundler dedupes it. Two ProseMirror copies break the
 *                `instanceof` checks it makes between schema and state.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        format: resolve(__dirname, 'src/prompt/serialization/index.ts'),
        editor: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => id.startsWith('prosemirror-'),
    },
  },
});
