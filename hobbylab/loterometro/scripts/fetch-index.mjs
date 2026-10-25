// Walks the BOE daily summaries (open data API, /datosabiertos/api/boe/sumario/{date}) and keeps the entries about the
// Lotería Nacional: prize programmes, official lists of winning numbers and the draws announced. Writes one file per year,
// .cache/index/YYYY.jsonl, and remembers the days already read in YYYY.done, so it can be stopped and resumed.
//   node scripts/fetch-index.mjs [fromYear] [toYear] [workers]
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIR = join(ROOT, '.cache', 'index');
const [from = 1960, to = 2013, workers = 4] = process.argv.slice(2).map(Number);
const UA = { accept: 'application/json', 'user-agent': 'loterometro (+https://jordijoan.es/hobbylab/)' };
const KEEP = /loter[ií]a|loter[ií]as|programa de premios|extracciones realizadas|resultado premiados|n[uú]meros premiados/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await mkdir(DIR, { recursive: true });

function* items(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj.titulo === 'string' && typeof obj.identificador === 'string') yield obj;
  for (const v of Object.values(obj)) yield* items(v);
}

async function summary(ds) {
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${ds}`, { headers: UA });
      if (r.status === 404) return null;            // no BOE that day
      if (r.ok) return await r.json();
      if (r.status === 500) return 'error';          // a few days fail in the API; left for a later run
    } catch {}
    await sleep(2000 * i);
  }
  return 'error';
}

async function htmlDay(ds) {
  try {
    const r = await fetch(`https://www.boe.es/boe/dias/${ds.slice(0, 4)}/${ds.slice(4, 6)}/${ds.slice(6, 8)}/`, { headers: { 'user-agent': UA['user-agent'] } });
    if (!r.ok) return null;
    const page = await r.text(), out = [];
    for (const m of page.matchAll(/<li class="dispo">\s*<p>([\s\S]*?)<\/p>[\s\S]*?txt\.php\?id=(BOE-[A-Z]-\d{4}-\d+)/g)) {
      const title = m[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).trim();
      if (!KEEP.test(title)) continue;
      const pdf = (page.slice(m.index, m.index + m[0].length + 600).match(/href="([^"]+\.pdf)"/) || [])[1];
      out.push(JSON.stringify({ date: ds, id: m[2], title, pdf: pdf ? new URL(pdf, 'https://www.boe.es').href : null }));
    }
    return out;
  } catch { return null; }
}

const today = new Date().toISOString().slice(0, 10);
for (let y = from; y <= to; y++) {
  const doneFile = join(DIR, `${y}.done`), outFile = join(DIR, `${y}.jsonl`);
  const done = new Set(existsSync(doneFile) ? (await readFile(doneFile, 'utf8')).split('\n').filter(Boolean) : []);
  const days = [];
  for (let d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d = new Date(d.getTime() + 864e5)) {
    const iso = d.toISOString().slice(0, 10);
    if (iso > today) break;
    const ds = iso.replace(/-/g, '');
    if (!done.has(ds)) days.push(ds);
  }
  let hits = 0, failed = 0, next = 0;
  await Promise.all(Array.from({ length: workers }, async () => {
    while (next < days.length) {
      const ds = days[next++];
      const j = await summary(ds);
      if (j === 'error') {
        // a few summaries always fail in the API: read that day's HTML index page instead
        const lines = await htmlDay(ds);
        if (lines == null) { failed++; continue; }
        if (lines.length) { await appendFile(outFile, lines.join('\n') + '\n'); hits += lines.length; }
        await appendFile(doneFile, ds + '\n');
        continue;
      }
      if (j) {
        const seen = new Set(), lines = [];
        for (const it of items(j)) {
          if (seen.has(it.identificador) || !KEEP.test(it.titulo)) continue;
          seen.add(it.identificador);
          lines.push(JSON.stringify({ date: ds, id: it.identificador, title: it.titulo, pdf: it.url_pdf?.texto || it.url_pdf || null }));
        }
        if (lines.length) { await appendFile(outFile, lines.join('\n') + '\n'); hits += lines.length; }
      }
      await appendFile(doneFile, ds + '\n');
    }
  }));
  console.log(`${y}: ${days.length} days read, ${hits} entries kept${failed ? `, ${failed} days failed (run again)` : ''}`);
}
