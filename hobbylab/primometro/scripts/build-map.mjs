// Builds data/mapa-europa.json (one SVG path per country) from Natural Earth 1:50m admin-0 countries
// (public domain, naturalearthdata.com). Run once; the map does not change day to day.
//   node scripts/build-map.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const CACHE = join(ROOT, '.cache', 'ne50.geojson');

async function load() {
  try { return JSON.parse(await readFile(CACHE, 'utf8')); } catch {}
  const res = await fetch(SRC);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const txt = await res.text();
  await mkdir(join(ROOT, '.cache'), { recursive: true });
  await writeFile(CACHE, txt);
  return JSON.parse(txt);
}

// Lambert azimuthal equal-area, centred on Europe
const R = Math.PI / 180, L0 = 10 * R, P0 = 52 * R;
function project(lon, lat) {
  const l = lon * R, p = lat * R;
  const k = Math.sqrt(2 / (1 + Math.sin(P0) * Math.sin(p) + Math.cos(P0) * Math.cos(p) * Math.cos(l - L0)));
  return [k * Math.cos(p) * Math.sin(l - L0), -k * (Math.cos(P0) * Math.sin(p) - Math.sin(P0) * Math.cos(p) * Math.cos(l - L0))];
}
const BOX = { lon: [-25, 45], lat: [34, 71.5] };
const corners = [[-11, 35], [32, 35], [-11, 70], [32, 70], [10, 34], [10, 71]].map(([a, b]) => project(a, b));
const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const W = 1000, H = Math.round(W * (y1 - y0) / (x1 - x0));
const toPx = ([x, y]) => [(x - x0) / (x1 - x0) * W, (y - y0) / (y1 - y0) * H];

function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, bi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const KEEP_SMALL = new Set(['MT', 'LU', 'CY']);
function ringPath(ring, code) {
  if (!ring.some(([lon, lat]) => lon >= BOX.lon[0] && lon <= BOX.lon[1] && lat >= BOX.lat[0] && lat <= BOX.lat[1])) return '';
  let pts = ring.map(([lon, lat]) => toPx(project(lon, lat)));
  // a ring ends where it starts; simplify its two halves so the end points are distinct
  const mid = Math.floor(pts.length / 2);
  const tol = KEEP_SMALL.has(code) ? 0.15 : 0.55;
  pts = [...simplify(pts.slice(0, mid + 1), tol).slice(0, -1), ...simplify(pts.slice(mid), tol)]
    .map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  if (pts.length < 3) return '';
  const xsR = pts.map(p => p[0]), ysR = pts.map(p => p[1]);
  if (!KEEP_SMALL.has(code) && Math.max(...xsR) - Math.min(...xsR) < 1.2 && Math.max(...ysR) - Math.min(...ysR) < 1.2) return ''; // specks
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += `l${Math.round((pts[i][0] - pts[i - 1][0]) * 10) / 10} ${Math.round((pts[i][1] - pts[i - 1][1]) * 10) / 10}`;
  return d + 'z';
}

const g = await load();
const countries = {};
for (const f of g.features) {
  const p = f.properties;
  const code = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  if (!code || code === '-99') continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
  let d = '';
  for (const poly of polys) for (const ring of poly) d += ringPath(ring, code);
  if (d) countries[code] = { d, n: p.NAME_ES || p.NAME };
}
// frame around the euro area members, with a margin
const EURO = 'AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
for (const k of EURO) {
  for (const seg of countries[k].d.split('M').slice(1)) {
    let [x, y] = seg.split('l')[0].split(' ').map(Number);
    const upd = () => { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); };
    upd();
    for (const rel of seg.split('l').slice(1)) { const [dx, dy] = rel.replace('z', '').split(' ').map(Number); x += dx; y += dy; upd(); }
  }
}
const pad = 14;
const focus = [bx0 - pad, by0 - pad, bx1 - bx0 + 2 * pad, by1 - by0 + 2 * pad].map(v => Math.round(v));
const doc = { w: W, h: H, focus, source: 'Fronteras: Natural Earth (dominio público), escala 1:50m, simplificadas.', countries };
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data', 'mapa-europa.json'), JSON.stringify(doc) + '\n');
console.log(`countries ${Object.keys(countries).length}, ${W}x${H}, ${Math.round(JSON.stringify(doc).length / 1024)} KB`);
