// Builds data/sorteos.json (one record per draw) and data/summary.json from .cache/draws.json and the notice texts in
// .cache/text (from fetch-docs.mjs):
//   - from the results lists (up to 1991, OCR of the BOE scans): the first prize number, its amount and where it was sold.
//     A number only counts as confirmed when the same notice backs it up: the two approximations are the number ±1,
//     the hundred it falls in, or the endings of the smaller prizes. Otherwise it is kept as "read by OCR".
//   - from the prize programmes (from 1995, BOE text): series, tickets, price, tenths, money shared out, first prize.
//   node scripts/build.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TEXT = join(ROOT, '.cache', 'text');
const draws = JSON.parse(await readFile(join(ROOT, '.cache', 'draws.json'), 'utf8'));
const WIKI = existsSync(join(ROOT, '.cache', 'wiki-gordo.json')) ? JSON.parse(await readFile(join(ROOT, '.cache', 'wiki-gordo.json'), 'utf8')) : {};
// OCR slips in the names of the draws
const NAME_FIX = [[/Ni[fñ]+[ií]o|Nifio|Niiio/g, 'Niño'], [/Chuz|Crnz/g, 'Cruz'], [/^Dia /, 'Día '], [/Valentin\b/, 'Valentín'], [/Loteria\b/, 'Lotería'], [/Otono/, 'Otoño']];
const fixName = s => NAME_FIX.reduce((a, [re, to]) => a.replace(re, to), s);
const read = async id => existsSync(join(TEXT, id + '.txt')) ? (await readFile(join(TEXT, id + '.txt'), 'utf8')) : null;
const flat = s => s.replace(/-\s*\n\s*/g, '').replace(/\s+/g, ' ');
const num = s => s == null ? null : +String(s).replace(/[.\s]/g, '').replace(',', '.');
const WORDS = { una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20 };
const count = s => /^\d/.test(s) ? num(s) : WORDS[s.toLowerCase()] ?? null;
// OCR often reads digits as look-alike letters
const ocrDigits = s => s.replace(/[OoQD]/g, '0').replace(/[lIi|!]/g, '1').replace(/[Ss$]/g, '5').replace(/B/g, '8').replace(/[Zz]/g, '2').replace(/G/g, '6');
const titleCase = s => s.toLowerCase().replace(/(^|[\s«"(-])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());

// the part of a BOE page that belongs to the notice (a scanned page also carries its neighbours)
function cut(text, startRe) {
  const t = flat(text);
  const i = t.search(startRe);
  if (i < 0) return null;
  const rest = t.slice(i + 60);
  const j = rest.search(/RESOLUCI[OÓ0]N\b|ORDEN de|Lo que se anuncia|Lo que se hace p[uú]blico/i);
  return t.slice(Math.max(0, i - 400), i + 60 + (j < 0 ? rest.length : j));
}

function results(text, date) {
  const part = cut(text, /extracciones realizadas|premios mayores|n[uú]meros y poblaciones/i);
  if (!part) return null;
  const out = {};
  const nm = part.match(/SORTEO\s+(?:DEL?|DE\s+LA)\s*[«"“]([^»"”]{3,40})[»"”]/i);
  if (nm) out.name = fixName(titleCase(nm[1].trim()));
  const cur = date >= '2002-01-01' ? 'EUR' : 'ESP';
  // ordinary lists: "1 premio de 40.000.000 de pesetas para el billete número ... 61429"
  const m = part.match(/\b1\s*pr\S{0,2}m\S{0,2}o\s+de\s+([\dOo.,]{5,})\s*(?:de\s*)?p\S{0,3}s\S{0,3}t\S{0,2}s[\s\S]{0,40}?bil\S{0,3}et\S{0,2}\s*n\S{0,3}m\S{0,4}ro([\s\S]{0,160})/i);
  if (m) {
    const tok = (m[2].match(/[\dOoQDlIi|SsBZzG$]{4,6}(?=[^\dOoQDlIi|SsBZzG$]|$)/g) || []).map(ocrDigits).find(x => /^\d{4,5}$/.test(x));
    if (tok) {
      const n = tok.padStart(5, '0');
      out.num = n; out.amt = +ocrDigits(m[1]).replace(/\D/g, '') || null; out.cur = cur;
      const v = +n, checks = [];
      const ap = part.match(/aprox\S*[\s\S]{0,140}?n\S{0,3}m\S{0,4}ros?\s+([\dOoSlIB]{4,5})\s*y\s*([\dOoSlIB]{4,5})/i);
      if (ap && +ocrDigits(ap[1]) === v - 1 && +ocrDigits(ap[2]) === v + 1) checks.push('aproximaciones');
      const ce = part.match(/centenas?[\s\S]{0,140}?n\S{0,3}m\S{0,4}ros\s+([\dOoSlIB]{4,5})\s*al\s*([\dOoSlIB]{4,5})/i);
      if (ce && +ocrDigits(ce[1]) <= v && v <= +ocrDigits(ce[2]) && +ocrDigits(ce[2]) - +ocrDigits(ce[1]) === 99) checks.push('centena');
      const te = [...part.matchAll(/terminados?\s+como\s+el\s+primer\s+premio\s+en[\s.…]*([\dOoSlIB]{1,3})\b/gi)].map(x => ocrDigits(x[1]));
      if (te.length && te.every(e => /^\d+$/.test(e) && n.endsWith(e))) checks.push('terminaciones');
      out.ok = checks.length > 0;
      const w = part.slice(m.index, m.index + m[0].length + 260).match(/(?:Consignad[oa]s?|Vendid[oa]s?)\s+(?:a|en)\s+([^.;]{3,160})/i);
      if (w) {
        const places = w[1].split(/,|\s+y\s+/).map(s => s.trim()).filter(s => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+(?:[\s-](?:de\s+|del\s+|la\s+|las\s+|los\s+)?[A-ZÁÉÍÓÚÑa-záéíóúñü][a-záéíóúñü]+)*$/.test(s));
        if (places.length) out.where = places;
      }
      return out;
    }
  }
  // tables of the big draws (Navidad and the 1960s): "200.000.000 Número 15840" or "48677 37.500.000 Sueca"
  const pairs = [];
  for (const p of part.matchAll(/([\d.]{9,13})\s*N\S{0,2}m\S{0,2}ro\s*([\dOoSlIB]{4,5})\b/g)) pairs.push([+p[1].replace(/\D/g, ''), ocrDigits(p[2])]);
  for (const p of part.matchAll(/\b([\dOoSlIB]{4,5})\s+([\d.]{9,13})\s+[A-ZÁÉÍÓÚ]/g)) pairs.push([+p[2].replace(/\D/g, ''), ocrDigits(p[1])]);
  const best = pairs.filter(p => /^\d{4,5}$/.test(p[1]) && p[0] >= 1e6).sort((a, b) => b[0] - a[0])[0];
  if (best) { out.num = best[1].padStart(5, '0'); out.amt = best[0]; out.cur = cur; out.ok = false; }
  return Object.keys(out).length ? out : null;
}

function programme(text, date) {
  const t = flat(text);
  const out = {};
  const s = t.match(/constar[áa]\s+de\s+(\S+)\s+series?,?\s+de\s+([\d.]+)\s+billetes/i);
  if (s) { out.series = count(s[1]); out.tickets = num(s[2]); }
  const p = t.match(/al\s+precio\s+de\s+([\d.,]+)\s+(pesetas|euros)\s+el\s+billete,?\s+divididos?\s+en\s+d[ée]cimos\s+de\s+([\d.,]+)\s+(pesetas|euros)/i);
  if (p) { out.price = num(p[1]); out.tenth = num(p[3]); out.cur = /euro/i.test(p[2]) ? 'EUR' : 'ESP'; }
  const d = t.match(/distribuy[ée]ndose\s+([\d.,]+)\s+(pesetas|euros)\s+en\s+([\d.]+)\s+premios/i);
  if (d) { out.total = num(d[1]); out.prizes = num(d[3]); out.cur = out.cur || (/euro/i.test(d[2]) ? 'EUR' : 'ESP'); }
  // the first prize per series: "1 | De 300.000 euros (una extracción de 5 cifras)" in the tables, "1 premio de ..." before
  const f = t.match(/\b1\s*\|\s*De\s+([\d.,]+)\s+(?:pesetas|euros)\s*\(una\s+extracci[oó]n\s+de\s+5\s+cifras\)/i)
    || t.match(/premios\s+(?:para|de)\s+cada\s+serie[\s\S]{0,200}?\b1\s+premio\s+de\s+([\d.,]+)\s+(pesetas|euros)/i) || t.match(/\b1\s+premio\s+de\s+([\d.,]+)\s+(pesetas|euros)/i);
  if (f) out.first = num(f[1]);
  const sp = t.match(/Premio\s+especial\s+de\s+([\d.,]+)\s+(?:pesetas|euros)/i);
  if (sp) out.special = num(sp[1]);
  const nm = t.match(/SORTEO\s+(EXTRAORDINARIO\s+DE\s+[A-ZÁÉÍÓÚÑ ]{3,30}?|DEL?\s+[«"“][^»"”]{3,40}[»"”])(?=\s|\.|,)/);
  if (nm) out.name = fixName(titleCase(nm[1].replace(/^EXTRAORDINARIO\s+DE\s+/i, '').replace(/^DEL?\s+/i, '').replace(/[«»"“”]/g, '').trim()));
  const pl = t.match(/tendr[áa]\s+lugar\s+el\s+d[ií]a[^,]*?,?\s+(?:a\s+las\s+[\d.,:]+\s+horas,?\s+)?en\s+([^,.;]{4,90})/i);
  if (pl) out.where = pl[1].trim();
  return Object.keys(out).length ? out : null;
}

const out = [], stats = { results: 0, num: 0, confirmed: 0, prog: 0 };
for (const d of draws) {
  const rec = { d: d.date, k: d.kind };
  if (d.place) rec.pl = d.place;
  // a draw may have several results notices (a list and a table): keep a confirmed reading if there is one
  for (const n of d.results) {
    const t = await read(n.id); if (!t) continue;
    stats.results++;
    const r = results(t, d.date);
    if (r && (!rec.r || (r.ok && !rec.r.ok) || (r.num && !rec.r.num))) rec.r = r;
    if (r?.name && !rec.n) rec.n = r.name;
  }
  // the Christmas tables cannot be checked inside the notice: the number counts when Wikipedia's first prize for that
  // year is printed in the BOE notice itself
  const wn = WIKI[d.date.slice(0, 4)];
  if (d.kind === 'navidad' && wn && !(rec.r?.ok)) {
    for (const n of d.results) {
      const t = await read(n.id); if (!t) continue;
      const ft = flat(t);
      const bare = wn.replace(/^0+/, '');   // scans print "3772" for 03772
      if (new RegExp(`\\b${wn}\\b|\\b${wn.slice(0, 2)}[.,]${wn.slice(2)}\\b` + (bare.length >= 4 && bare !== wn ? `|\\b${bare}\\b` : '')).test(ft)) {
        rec.r = { ...(rec.r || {}), num: wn, ok: true, check: 'wikipedia', cur: d.date >= '2002-01-01' ? 'EUR' : 'ESP' };
        if (rec.r.amt && rec.r.num !== wn) delete rec.r.amt;
        delete rec.r.where;
        break;
      }
    }
  }
  if (rec.r?.num) { stats.num++; if (rec.r.ok) stats.confirmed++; }
  for (const n of d.programme) {
    if (d.date < '1995-01-01') break;
    const t = await read(n.id); if (!t) continue;
    const p = programme(t, d.date);
    if (p) { rec.p = p; stats.prog++; if (p.name && !rec.n) rec.n = p.name; break; }
  }
  rec.boe = { p: d.programme.map(n => n.id), r: d.results.map(n => n.id) };
  out.push(rec);
}
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data', 'sorteos.json'), JSON.stringify({ updated: new Date().toISOString().slice(0, 10), draws: out }) + '\n');
// a few hundred bytes for the Hobby Lab landing card: totals and the latest confirmed Christmas first prizes
const gordos = out.filter(d => d.k === 'navidad' && d.r?.ok).map(d => [d.d.slice(0, 4), d.r.num]);
await writeFile(join(ROOT, 'data', 'summary.json'), JSON.stringify({
  draws: out.length, from: out[0].d.slice(0, 4), to: out.at(-1).d.slice(0, 4),
  confirmed: out.filter(d => d.r?.ok).length, gordo: gordos.slice(-8)
}) + '\n');
console.log(`${out.length} draws; results read ${stats.results}, first prize found ${stats.num}, confirmed ${stats.confirmed}; programmes parsed ${stats.prog}`);
