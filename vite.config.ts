import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/bilibili': {
        target: 'https://s.search.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bilibili/, '/main/suggest'),
        secure: false,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
