import { defineConfig } from 'vite';

// On the production build the site is hosted at https://<user>.github.io/Elevate/,
// so assets must be referenced from the "/Elevate/" sub-path. In dev we serve from root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Elevate/' : '/',
  server: { host: true, port: 5173 },
  build: { target: 'es2020', outDir: 'dist', assetsInlineLimit: 0 },
}));
