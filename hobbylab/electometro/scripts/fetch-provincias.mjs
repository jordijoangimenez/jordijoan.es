// Official Congreso results by province (latest general election), read from votomunicipal.es,
// which republishes Ministerio del Interior (Infoelectoral) data. Writes data/provincias.json.
//   node scripts/fetch-provincias.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { decode, stripTags } from './lib/text.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://votomunicipal.es';
const SLUGS = ('almeria cadiz cordoba granada huelva jaen malaga sevilla huesca teruel zaragoza asturias baleares las-palmas ' +
  'santa-cruz-de-tenerife cantabria albacete ciudad-real cuenca guadalajara toledo burgos leon palencia salamanca segovia soria ' +
  'valladolid zamora avila barcelona girona lleida tarragona badajoz caceres a-coruna lugo ourense pontevedra madrid navarra ' +
  'alava bizkaia gipuzkoa murcia la-rioja alicante castellon valencia ceuta melilla').split(' ');
const es = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

async function page(slug) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(`${BASE}/${slug}/`, { headers: { 'user-agent': 'promedio-encuestas (+https://github.com/jordijoangimenez)' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (e) { if (i >= 3) throw e; await new Promise(r => setTimeout(r, 2000 * i)); }
  }
}

function parse(slug, html) {
  const code = html.match(/data-geo="\/mapas\/geo-(\d{2})\.json/)?.[1];
  const name = stripTags(html.match(/<h1[^>]*>(.*?)<small/s)?.[1] || '').replace(/^Provincia de\s+/, '');
  const text = stripTags(html);
  const seats = +(text.match(/(\d+)\s+diputados/)?.[1] || 0);
  const electors = es(text.match(/([\d.]+)\s+electores residentes/)?.[1]);
  const turnout = es(text.match(/([\d,]+)\s*%\s+participaci/)?.[1]);
  const date = text.match(/Elecciones generales del (\d{1,2} de \w+ de \d{4})/g)?.find(d => !d.includes('2026'));
  const tbl = html.match(/<table class="tabla">(.*?)<\/table>/s)?.[1] || '';
  const rows = [...tbl.matchAll(/<tr>\s*<th scope="row"><i class="punto" style="--c:(#[0-9a-f]+)"><\/i><abbr title="([^"]*)">([^<]*)<\/abbr><\/th>\s*<td class="n">([^<]*)<\/td>\s*<td class="n"><b>([^<]*)<\/b><\/td>\s*<td class="n">([^<]*)<\/td>\s*<td class="n">([^<]*)<\/td>/g)]
    .map(m => ({ n: decode(m[3]).trim(), f: decode(m[2]).trim(), c: m[1], v: es(m[4]), p: es(m[5]), s: m[6].trim() ? +m[6] : 0, pe: es(m[7]) }));
  return { slug, code, name, seats, electors, turnout, date, rows };
}

const out = [];
for (const slug of SLUGS) {
  const p = parse(slug, await page(slug));
  const problems = [];
  if (!p.code) problems.push('no code'); if (!p.rows.length) problems.push('no rows');
  if (p.rows.reduce((a, r) => a + r.s, 0) !== p.seats) problems.push(`seats ${p.rows.reduce((a, r) => a + r.s, 0)} != ${p.seats}`);
  if (problems.length) console.log('!!', slug, problems.join(', '));
  out.push(p);
  await new Promise(r => setTimeout(r, 350));
}
const total = {};
for (const p of out) for (const r of p.rows) { const t = (total[r.n] ??= { v: 0, s: 0 }); t.v += r.v; t.s += r.s; }
console.log('provinces', out.length, 'seats', out.reduce((a, p) => a + p.seats, 0));
console.log(Object.entries(total).filter(([, t]) => t.s).map(([n, t]) => `${n} ${t.s}`).join(', '));
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data', 'provincias.json'), JSON.stringify({
  election: '2023-07-23',
  source: 'Fuente: Ministerio del Interior, Infoelectoral (resultados oficiales); límites municipales: Instituto Geográfico Nacional. Los porcentajes de provincia y España incluyen el voto de residentes en el extranjero (CERA), salvo la participación.',
  via: 'https://votomunicipal.es', fetched: new Date().toISOString().slice(0, 10), provinces: out,
}) + '\n');
