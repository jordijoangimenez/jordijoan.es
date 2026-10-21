// Province outlines for the map. Source: municipal boundaries (Instituto Geográfico Nacional, simplified)
// as republished by votomunicipal.es. Municipal edges shared inside a province cancel out, leaving the
// province outline. Writes data/mapa-espana.json.   node scripts/build-map.mjs
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CACHE = join(ROOT, '.cache', 'geo-espana.json');

async function geo() {
  try { return JSON.parse((await readFile(CACHE, 'utf8')).replace(/^﻿/, '')); } catch {}
  const res = await fetch('https://votomunicipal.es/mapas/geo-espana.json', { headers: { 'user-agent': 'promedio-encuestas' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const txt = await res.text();
  await mkdir(join(ROOT, '.cache'), { recursive: true });
  await writeFile(CACHE, txt);
  return JSON.parse(txt);
}

// SVG path -> rings of absolute integer points
function rings(d) {
  const out = []; let cur = null, x = 0, y = 0;
  for (const m of d.matchAll(/([MmLlHhVvZz])([^MmLlHhVvZz]*)/g)) {
    const c = m[1], n = (m[2].match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (c === 'Z' || c === 'z') { if (cur) out.push(cur); cur = null; continue; }
    if (c === 'M' || c === 'm') {
      if (cur) out.push(cur);
      x = c === 'm' ? x + n[0] : n[0]; y = c === 'm' ? y + n[1] : n[1]; cur = [[x, y]];
      for (let i = 2; i + 1 < n.length; i += 2) { x = c === 'm' ? x + n[i] : n[i]; y = c === 'm' ? y + n[i + 1] : n[i + 1]; cur.push([x, y]); }
    } else if (c === 'L' || c === 'l') for (let i = 0; i + 1 < n.length; i += 2) { x = c === 'l' ? x + n[i] : n[i]; y = c === 'l' ? y + n[i + 1] : n[i + 1]; cur.push([x, y]); }
    else if (c === 'H' || c === 'h') for (const v of n) { x = c === 'h' ? x + v : v; cur.push([x, y]); }
    else if (c === 'V' || c === 'v') for (const v of n) { y = c === 'v' ? y + v : v; cur.push([x, y]); }
  }
  if (cur) out.push(cur);
  return out;
}

const g = await geo();
const byProv = {};
// code 53 is not a province: the source uses it for map furniture (the Canarias inset frame)
for (const [code, d] of Object.entries(g.m)) if (!code.startsWith('53')) (byProv[code.slice(0, 2)] ??= []).push(d);

const prov = {};
for (const [pc, paths] of Object.entries(byProv)) {
  const count = new Map();
  for (const d of paths) for (const r of rings(d)) {
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      const k = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? `${a}|${b}` : `${b}|${a}`;
      count.set(k, (count.get(k) || 0) + 1);
    }
  }
  const edges = [...count].filter(([, c]) => c % 2 === 1).map(([k]) => k.split('|').map(s => s.split(',').map(Number)));
  // chain edges into closed rings
  const at = new Map();
  edges.forEach((e, i) => e.forEach(p => { const key = p.join(','); (at.get(key) ?? at.set(key, []).get(key)).push(i); }));
  const used = new Array(edges.length).fill(false);
  let d = '';
  for (let i = 0; i < edges.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let [start, end] = edges[i];
    const pts = [start, end];
    for (;;) {
      const next = (at.get(end.join(',')) || []).find(j => !used[j]);
      if (next == null) break;
      used[next] = true;
      const [a, b] = edges[next];
      end = a[0] === end[0] && a[1] === end[1] ? b : a;
      pts.push(end);
    }
    d += 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
  }
  prov[pc] = d;
}
const doc = { w: g.w, h: g.h, prov, source: 'Límites municipales: Instituto Geográfico Nacional (IGN), simplificados; vía votomunicipal.es' };
await writeFile(join(ROOT, 'data', 'mapa-espana.json'), JSON.stringify(doc) + '\n');
const size = JSON.stringify(doc).length;
console.log('provinces', Object.keys(prov).length, 'size KB', Math.round(size / 1024), 'canvas', g.w, g.h);
