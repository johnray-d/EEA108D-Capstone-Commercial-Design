import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/EEA108D-Capstone-Commercial-Design/',
  plugins: [
    react(),
    {
      name: 'dev-html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html' || req.url?.startsWith('/EEA108D-Capstone-Commercial-Design')) {
            if (!req.url.includes('.') || req.url.endsWith('.html')) {
              req.url = '/index.src.html';
            }
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.src.html')
      }
    }
  },
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
