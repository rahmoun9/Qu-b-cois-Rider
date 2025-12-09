import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,               // ton port front
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // ton backend
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // <-- garde COMMENTÉ%
      },
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
});
