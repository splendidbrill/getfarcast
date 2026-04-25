import { promises as fs } from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.resolve(__dirname);
const srcDir = path.resolve(rootDir, 'src');
const outDir = path.resolve(rootDir, 'dist');

function copyManifestPlugin() {
  return {
    name: 'copy-extension-manifest',
    async writeBundle() {
      await fs.copyFile(
        path.resolve(rootDir, 'manifest.json'),
        path.resolve(outDir, 'manifest.json')
      );
    }
  };
}

function copyPopupHtmlPlugin() {
  return {
    name: 'copy-popup-html',
    async writeBundle() {
      await fs.copyFile(
        path.resolve(outDir, 'src/popup/index.html'),
        path.resolve(outDir, 'popup/index.html')
      );
    }
  };
}

function getEntryFileName(name: string) {
  switch (name) {
    case 'background/service-worker':
      return 'background/service-worker.js';
    default:
      return 'assets/[name].js';
  }
}

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [react(), copyManifestPlugin(), copyPopupHtmlPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        'popup/index': path.resolve(srcDir, 'popup/index.html'),
        'background/service-worker': path.resolve(srcDir, 'background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => getEntryFileName(chunkInfo.name),
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'popup/index.css';
          }

          return 'assets/[name][extname]';
        }
      }
    }
  }
});
