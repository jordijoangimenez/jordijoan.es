// Downloads the BOE notices listed in .cache/draws.json and keeps their text in .cache/text/<BOE id>.txt:
//   - results notices (official lists of winning numbers, up to 1991): the PDF, read with pdf.js (its OCR text layer);
//   - prize programmes from 1995 on: the BOE's own HTML text (txt.php). Older programmes only exist as scans.
// Already downloaded notices are skipped, so the script can be stopped and run again.
//   node scripts/fetch-docs.mjs [workers]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TEXT = join(ROOT, '.cache', 'text');
const workers = +(process.argv[2] || 3);
const UA = { 'user-agent': 'loterometro (+https://jordijoan.es/hobbylab/)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
await mkdir(TEXT, { recursive: true });

async function get(url) {
  for (let i = 1; i <= 4; i++) {
    try { const r = await fetch(url, { headers: UA }); if (r.ok) return Buffer.from(await r.arrayBuffer()); if (r.status === 404) return null; } catch {}
    await sleep(2000 * i);
  }
  return null;
}
async function pdfText(buf) {
  const doc = await getDocument({ data: new Uint8Array(buf), useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    let text = '', lastY = null;
    for (const it of tc.items) {
      if (!('str' in it)) continue;
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) text += '\n';
      text += it.str; if (it.hasEOL) text += '\n'; lastY = y;
    }
    pages.push(text);
  }
  return pages.join('\n\f\n');
}
function htmlText(buf) {
  const html = buf.toString('utf8');
  const m = html.match(/<div id="textoxslt">([\s\S]*?)<\/div>\s*<\/div>/);
  if (!m) return null;
  return m[1].replace(/<\/(p|h\d|tr|li|div)>/gi, '\n').replace(/<td[^>]*>/gi, ' | ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

const draws = JSON.parse(await readFile(join(ROOT, '.cache', 'draws.json'), 'utf8'));
const jobs = new Map();
for (const d of draws) {
  for (const n of d.results) jobs.set(n.id, { n, how: 'pdf' });
  if (d.date >= '1995-01-01') for (const n of d.programme) jobs.set(n.id, { n, how: 'html' });
}
const todo = [...jobs.values()].filter(j => !existsSync(join(TEXT, j.n.id + '.txt')));
console.log(`${jobs.size} notices, ${todo.length} to fetch`);
let next = 0, ok = 0, bad = 0;
await Promise.all(Array.from({ length: workers }, async () => {
  while (next < todo.length) {
    const { n, how } = todo[next++];
    try {
      let text = null;
      if (how === 'html') { const b = await get(`https://www.boe.es/diario_boe/txt.php?id=${n.id}`); text = b && htmlText(b); }
      else if (n.pdf) { const b = await get(n.pdf); text = b && await pdfText(b); }
      if (text) { await writeFile(join(TEXT, n.id + '.txt'), text); ok++; } else bad++;
    } catch { bad++; }
    if ((ok + bad) % 200 === 0) console.log(`${ok + bad} / ${todo.length}`);
  }
}));
console.log(`done: ${ok} saved, ${bad} without text`);
