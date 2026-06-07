import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Popup UI page
        popup: resolve(__dirname, 'src/popup/popup.html'),
        // Background service worker (no DOM, pure JS)
        background: resolve(__dirname, 'src/background/background.ts'),
        // Content script injected into all pages
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        // Keep entry point file names predictable for manifest.json
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
