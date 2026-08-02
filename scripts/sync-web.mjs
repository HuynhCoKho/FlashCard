import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'www');
const files = ['index.html', 'styles.css', 'script.js', 'config.js', 'assets'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}

console.log('Đã đồng bộ giao diện vào www/.');
