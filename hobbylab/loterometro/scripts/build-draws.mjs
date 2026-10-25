// Turns the BOE index (.cache/index/YYYY.jsonl, from fetch-index.mjs) into one record per Lotería Nacional draw:
// its date, kind (ordinary, Thursday, extraordinary, special, Zodíaco, Los Millones; Navidad and Niño by their dates),
// and the BOE notices about it: the prize programme published before the draw and, up to 1991, the official list
// of winning numbers published after it. Writes .cache/draws.json for fetch-docs.mjs and build.mjs.
//   node scripts/build-draws.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const IDX = join(ROOT, '.cache', 'index');
const MONTHS = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const OTHER_GAMES = /primitiva|bono-?loto|euromill|lototurf|qu[ií]ntuple|apuesta deportiva|apuestas deportivas|quiniela|rifa|t[oó]mbola/i;
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// "día 16 de mayo de 1970", "días 6, 13, 20 y 27 de enero; 3, 10, 17 y 24 de febrero de 2005"
function datesIn(text, fallbackYear) {
  const out = [];
  text = text.replace(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)de\b/gi, '$1 de');   // "octubrede 1996" in some titles
  const tail = text.match(/\bd[ií]as?\b([\s\S]*)$/i) || text.match(/celebra\w*\b([\s\S]*)$/i);
  if (!tail) return out;
  const re = /((?:\d{1,2}\s*(?:,|y|e)\s*)*\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)(?:\s+(?:(?:de|del)\s+)?(\d{4}))?/gi;
  let m; const pending = [];
  while ((m = re.exec(tail[1]))) {
    const mon = MONTHS[m[2].toLowerCase()];
    if (!mon) continue;
    const days = m[1].split(/\s*(?:,|\by\b|\be\b)\s*/).map(Number).filter(Boolean);
    pending.push({ mon, days, year: m[3] ? +m[3] : null });
  }
  // a year given at the end of a list applies to the months before it
  let year = fallbackYear;
  for (let i = pending.length - 1; i >= 0; i--) { if (pending[i].year) year = pending[i].year; pending[i].year = pending[i].year || year; }
  for (const p of pending) for (const d of p.days) if (d >= 1 && d <= 31) out.push(iso(p.year, p.mon, d));
  return out;
}

function kindOf(title, date) {
  const t = title.toLowerCase(), md = date.slice(5);
  if (/zod[ií]aco/.test(t)) return 'zodiaco';
  if (/millones/.test(t)) return 'millones';
  if (/jueves/.test(t)) return 'jueves';
  if (/navidad/.test(t)) return 'navidad';
  if (/ni[ñn]o/.test(t) || ((md === '01-05' || md === '01-06') && /extraordinario|especial|nacional|sorteo/.test(t))) return 'nino';
  if (/extraordinario/.test(t)) return 'extraordinario';
  if (/especial/.test(t)) return 'especial';
  return 'ordinario';
}
const placeOf = title => {
  const m = title.match(/celebra(?:r|rá|do)\s+en\s+([A-ZÁÉÍÓÚ][\wáéíóúñ]+(?:\s+(?:de\s+)?[A-ZÁÉÍÓÚ][\wáéíóúñ]+)*)/);
  return m && !/^(el|la)$/i.test(m[1]) ? m[1] : null;
};

const draws = new Map();
const draw = (date, kind) => {
  if (!draws.has(date)) draws.set(date, { date, kind, place: null, programme: [], results: [] });
  const d = draws.get(date);
  if (kind && (d.kind === 'ordinario' || !d.kind)) d.kind = kind;
  return d;
};
let unparsed = [];
const orphanResults = [];
for (const f of (await readdir(IDX)).filter(f => f.endsWith('.jsonl')).sort()) {
  for (const line of (await readFile(join(IDX, f), 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    const x = JSON.parse(line);
    if (OTHER_GAMES.test(x.title) || /correcci[oó]n de (errores|erratas)/i.test(x.title)) continue;
    const pubYear = +x.date.slice(0, 4);
    const notice = { id: x.id, pub: iso(x.date.slice(0, 4), x.date.slice(4, 6), x.date.slice(6, 8)), pdf: x.pdf };
    if (/(programa|prospecto) de premios/i.test(x.title)) {
      const ds = datesIn(x.title.replace(/^Resoluci[oó]n de \d+ de \w+ de \d{4},?/i, ''), pubYear);
      if (!ds.length) { unparsed.push(x.title); continue; }
      for (const d of ds) {
        const dr = draw(d, kindOf(x.title, d));
        dr.programme.push(notice);
        dr.place = dr.place || placeOf(x.title);
      }
    } else if (/extracciones realizadas|resultado premiados|premios mayores/i.test(x.title)) {
      let ds = datesIn(x.title.replace(/^Resoluci[oó]n de \d+ de \w+ de \d{4},?/i, ''), pubYear);
      if (!ds.length) {
        // "celebrado dicho día": the date of the resolution itself
        const r = x.title.match(/Resoluci[oó]n de (\d{1,2}) de ([a-záéíóú]+),? (?:de )?(\d{4})/i);
        if (r && MONTHS[r[2].toLowerCase()]) ds = [iso(r[3], MONTHS[r[2].toLowerCase()], r[1])];
      }
      if (!ds.length) { orphanResults.push(notice); continue; }
      const dr = draw(ds[0], kindOf(x.title, ds[0]));
      dr.results.push(notice);
      dr.place = dr.place || placeOf(x.title);
    }
  }
}
// results notices without any date: the latest draw in the week before publication that has no results yet
for (const n of orphanResults) {
  const lo = new Date(Date.parse(n.pub) - 7 * 864e5).toISOString().slice(0, 10);
  const cand = [...draws.values()].filter(d => d.date < n.pub && d.date >= lo && !d.results.length).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (cand) cand.results.push(n); else unparsed.push('results without a draw, published ' + n.pub);
}
const list = [...draws.values()].map(d => ({ ...d, kind: d.kind || 'ordinario' })).sort((a, b) => a.date.localeCompare(b.date));
// the Christmas draw: held on 22 December, or on the 20th-23rd when the 22nd falls on a Sunday
for (let y = +list[0].date.slice(0, 4); y <= +list.at(-1).date.slice(0, 4); y++) {
  if (list.some(d => d.kind === 'navidad' && d.date.startsWith(y + '-'))) continue;
  const c = list.filter(d => d.date >= `${y}-12-20` && d.date <= `${y}-12-23` && !['jueves', 'zodiaco'].includes(d.kind))
    .sort((a, b) => Math.abs(+a.date.slice(8) - 22) - Math.abs(+b.date.slice(8) - 22))[0];
  if (c) c.kind = 'navidad';
}
await writeFile(join(ROOT, '.cache', 'draws.json'), JSON.stringify(list, null, 1));
const by = {};
for (const d of list) { const k = d.date.slice(0, 3) + '0s'; by[k] = by[k] || { draws: 0, prog: 0, res: 0 }; by[k].draws++; if (d.programme.length) by[k].prog++; if (d.results.length) by[k].res++; }
console.log(`${list.length} draws; by decade:`, JSON.stringify(by));
const kinds = {}; for (const d of list) kinds[d.kind] = (kinds[d.kind] || 0) + 1;
console.log('kinds:', JSON.stringify(kinds));
console.log(`${unparsed.length} notices without a date:\n  ` + unparsed.slice(0, 12).join('\n  '));
