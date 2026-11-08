import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { swPlugin } from './scripts/vite-sw.mjs';

export default defineConfig({
  base: './',
  plugins: [react(), swPlugin()],
  build: { target: 'es2019' }
});
