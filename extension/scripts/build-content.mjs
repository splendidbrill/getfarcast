import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');
const outDir = path.resolve(__dirname, '../dist');

for (const name of ['twitter', 'reddit', 'linkedin']) {
    await build({
        entryPoints: [path.resolve(srcDir, `content/${name}.ts`)],
        bundle: true,
        format: 'iife',
        outfile: path.resolve(outDir, `content/${name}.js`),
        target: 'chrome100',
        // Inline all dependencies — no external imports in the output
    });
    console.log(`  content/${name}.js built`);
}
