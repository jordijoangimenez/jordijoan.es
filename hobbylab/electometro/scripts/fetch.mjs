// Downloads posts from the Electográfica Blogger feed into .cache/posts/<id>.json.
//   node scripts/fetch.mjs          incremental: posts updated since the last run (minus a safety margin)
//   node scripts/fetch.mjs --full   every post
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FEED = 'https://www.electografica.com/feeds/posts/default';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CACHE = join(ROOT, '.cache', 'posts');
// kept in data/ (committed) so the scheduled job can fetch incrementally on a fresh runner
const STATE = join(ROOT, 'data', 'fetch-state.json');
const PAGE = 150;
const MARGIN_MS = 3 * 24 * 3600 * 1000;

const full = process.argv.includes('--full');

async function getJson(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'promedio-encuestas (+https://github.com/jordijoangimenez)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
}

function slim(e) {
  const id = e.id.$t.split('post-').pop();
  const link = (e.link || []).find(l => l.rel === 'alternate');
  return {
    id,
    url: link ? link.href : null,
    title: e.title.$t,
    published: e.published.$t,
    updated: e.updated.$t,
    labels: (e.category || []).map(c => c.term),
    content: e.content ? e.content.$t : '',
  };
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  let state = {};
  try { state = JSON.parse(await readFile(STATE, 'utf8')); } catch {}

  const params = new URLSearchParams({ alt: 'json', 'max-results': String(PAGE) });
  if (!full && state.lastUpdated) {
    params.set('orderby', 'updated');
    params.set('updated-min', new Date(Date.parse(state.lastUpdated) - MARGIN_MS).toISOString());
  } else {
    params.set('orderby', 'published');
  }

  let start = 1, total = null, saved = 0, newest = state.lastUpdated || '';
  while (true) {
    params.set('start-index', String(start));
    const json = await getJson(`${FEED}?${params}`);
    const entries = json.feed.entry || [];
    if (total === null) total = Number(json.feed['openSearch$totalResults'].$t);
    for (const e of entries) {
      const p = slim(e);
      await writeFile(join(CACHE, `${p.id}.json`), JSON.stringify(p));
      if (p.updated > newest) newest = p.updated;
      saved++;
    }
    process.stdout.write(`\r${saved}/${total}`);
    // Blogger caps responses by size, so a short page does not mean the end
    if (entries.length === 0 || start + entries.length > total) break;
    start += entries.length;
  }
  process.stdout.write('\n');
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(STATE, JSON.stringify({ lastUpdated: newest, lastRun: new Date().toISOString() }, null, 2) + '\n');
  console.log(`saved ${saved} posts (${full ? 'full' : 'incremental'})`);
}

main().catch(err => { console.error(err); process.exit(1); });
