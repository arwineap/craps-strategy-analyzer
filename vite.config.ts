import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/craps-strategy-analyzer/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
