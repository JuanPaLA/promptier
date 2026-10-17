import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * The library build. Every runtime dependency stays external: React must be the
 * host's single copy, and the Custom Element in core-editor registers a tag
 * name once, so a second bundled copy of it would collide.
 */
const isExternal = (id: string) => /^(react(\/|$)|@nbottarini\/|@cachai\/|tokenx$)/.test(id);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: { external: isExternal },
  },
});
