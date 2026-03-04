import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          react: ['react', 'react-dom'],
        },
      },
    },
    assetsInlineLimit: 0,
  },
  worker: {
    format: 'iife', // Forzamos formato clásico (iife) para Workers
  },
});