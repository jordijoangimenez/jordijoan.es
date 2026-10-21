// Adds ?v=<content hash> to the CSS and JS links of every Hobby Lab page, so browsers fetch the new files
// as soon as they change instead of serving a cached copy. Run after editing any asset:
//   node hobbylab/stamp.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

const ROOT = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const pages = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'data' || e.name === 'scripts') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p); else if (e.name.endsWith('.html')) pages.push(p);
  }
}
await walk(ROOT);
let changed = 0;
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  let out = html;
  for (const m of html.matchAll(/(href|src)="([^"?#]+\.(?:css|js))(\?v=[0-9a-f]+)?"/g)) {
    const file = join(dirname(page), m[2]);
    let hash;
    try { hash = createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 10); } catch { continue; }
    out = out.replace(m[0], `${m[1]}="${m[2]}?v=${hash}"`);
  }
  if (out !== html) { await writeFile(page, out); changed++; }
}
console.log(`${pages.length} pages checked, ${changed} updated`);
