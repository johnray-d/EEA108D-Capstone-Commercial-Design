import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/EEA108D-Capstone-Commercial-Design/',
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
