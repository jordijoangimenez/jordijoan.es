// Daily update: fetch new/changed posts, rebuild the data, and refuse to continue if the result looks broken.
//   node scripts/update.mjs
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const run = script => execFileSync(process.execPath, [join(ROOT, 'scripts', script)], { stdio: 'inherit', cwd: ROOT });
const count = async () => { try { return JSON.parse(await readFile(join(ROOT, 'data', 'polls.json'), 'utf8')).length; } catch { return 0; } };

const before = await count();
run('fetch.mjs');
run('build.mjs');
const after = await count();
console.log(`polls: ${before} -> ${after}`);

// A parser or feed problem should never silently wipe data: stop before anything is committed.
if (before > 0 && after < before * 0.98) {
  console.error(`Poll count dropped from ${before} to ${after}; not publishing.`);
  process.exit(1);
}
const idx = JSON.parse(await readFile(join(ROOT, 'data', 'elections.json'), 'utf8'));
const congreso = idx.elections.find(e => e.id === 'es-congreso');
if (!congreso || congreso.n < 50) { console.error('Congreso average looks empty; not publishing.'); process.exit(1); }
console.log('ok');
