import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_MOCK_FINANCE': JSON.stringify(process.env.VITE_MOCK_FINANCE ?? 'true'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/finance': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finance/, ''),
      },
    },
  },
  optimizeDeps: {
    exclude: ['yahoo-finance2'],
  },
  build: {
    rollupOptions: {
      external: ['yahoo-finance2'],
    },
  },
});