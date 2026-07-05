import { defineConfig } from 'vite';

// The site is served from the ROOT of its custom domain (and from root in dev),
// so assets are referenced from "/". (It used to live at the project-page sub-path
// https://<user>.github.io/Elevate/, which required base:'/Elevate/'.)
export default defineConfig({
  base: '/',
  server: { host: true, port: 5173 },
  build: { target: 'es2020', outDir: 'dist', assetsInlineLimit: 0 },
});
