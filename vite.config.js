import { defineConfig } from 'vite';

// Relative base so the production build can be hosted from any sub-path.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: { target: 'es2020', outDir: 'dist', assetsInlineLimit: 0 },
});
