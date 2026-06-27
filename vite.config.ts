import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/craps-tool/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
