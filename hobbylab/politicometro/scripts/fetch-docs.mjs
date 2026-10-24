// Downloads every official document listed under `docs` in config/parties.json into .cache/<id>.pdf (once) and
// extracts its text page by page into .cache/<id>.json: { pages: ["...", ...] }, one line break per PDF line.
//   node scripts/fetch-docs.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CACHE = join(ROOT, '.cache');
const { parties } = JSON.parse(await readFile(join(ROOT, 'config', 'parties.json'), 'utf8'));
await mkdir(CACHE, { recursive: true });

async function extract(pdfPath) {
  const doc = await getDocument({ data: new Uint8Array(await readFile(pdfPath)), useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    let text = '', lastY = null;
    for (const it of tc.items) {
      if (!('str' in it)) continue;
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) text += '\n';
      text += it.str;
      if (it.hasEOL) text += '\n';
      lastY = y;
    }
    pages.push(text.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim());
  }
  return pages;
}

for (const p of parties) for (const d of p.docs || []) {
  const pdf = join(CACHE, d.id + '.pdf'), txt = join(CACHE, d.id + '.json');
  if (!existsSync(pdf)) {
    const res = await fetch(d.url, { headers: { 'user-agent': 'politicometro (+https://jordijoan.es/hobbylab/politicometro/)' } });
    if (!res.ok) { console.error(`${d.id}: HTTP ${res.status} for ${d.url}`); process.exitCode = 1; continue; }
    await writeFile(pdf, Buffer.from(await res.arrayBuffer()));
  }
  if (!existsSync(txt)) {
    const pages = await extract(pdf);
    await writeFile(txt, JSON.stringify({ pages }, null, 1));
    console.log(`${d.id}: ${pages.length} pages, ${pages.reduce((a, s) => a + s.length, 0)} characters`);
  } else console.log(`${d.id}: cached`);
}
