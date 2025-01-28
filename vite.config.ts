import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,
    allowedHosts: ['soop-chat-mini.go9.ma'],
    proxy: {
      '/afreeca': {
        target: 'https://live.sooplive.co.kr/',
        changeOrigin: true,
      },
    },
  },
});
