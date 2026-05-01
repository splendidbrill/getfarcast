import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const srcIcon = path.resolve(__dirname, '../../public/logo.png');
const outDir = path.resolve(__dirname, '../dist/icons');

const sizes = [16, 48, 128];

await fs.mkdir(outDir, { recursive: true });

await Promise.all(
  sizes.map((size) =>
    sharp(srcIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon${size}.png`))
  )
);

console.log('Icons generated:', sizes.map((s) => `icon${s}.png`).join(', '));
