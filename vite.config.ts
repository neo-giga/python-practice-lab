import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base: the same build works at a domain root and under a repo subpath
// such as /python-interview-lab/ on GitHub Pages. Routing is hash-based.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  // The main chunk is mostly the curriculum text (~190 KB source); the editor is lazy-loaded.
  build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 600 },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: true,
        test: {
          name: 'corpus',
          include: ['tests/corpus/**/*.test.ts'],
          environment: 'node',
          testTimeout: 600_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
