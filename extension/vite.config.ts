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

function getEntryFileName(name: string) {
  switch (name) {
    case 'background/service-worker':
      return 'background/service-worker.js';
    case 'content/twitter':
      return 'content/twitter.js';
    case 'content/reddit':
      return 'content/reddit.js';
    case 'content/linkedin':
      return 'content/linkedin.js';
    default:
      return 'assets/[name].js';
  }
}

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        'popup/index': path.resolve(srcDir, 'popup/index.html'),
        'background/service-worker': path.resolve(srcDir, 'background/service-worker.ts'),
        'content/twitter': path.resolve(srcDir, 'content/twitter.ts'),
        'content/reddit': path.resolve(srcDir, 'content/reddit.ts'),
        'content/linkedin': path.resolve(srcDir, 'content/linkedin.ts')
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
