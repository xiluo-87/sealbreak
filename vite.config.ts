import { defineConfig } from 'vitest/config';

// A relative base keeps every asset URL working under the GitHub Pages
// project path (/sealbreak/) as well as at the root of `vite preview`.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
