import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../..');
for (const file of ['Suporte.html', 'Apps/Suporte/suporte.css', 'Apps/Suporte/suporte.js']) {
  const target = path.join(dir, 'site', file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, file), target);
}
console.log('Suporte preparado para publicação.');
