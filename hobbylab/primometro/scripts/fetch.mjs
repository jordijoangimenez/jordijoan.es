// Downloads from the ECB Data Portal and writes data/primometro.json:
//   - 10-year government bond yields of the euro area countries (monthly, IRS dataset,
//     Maastricht convergence criterion series)
//   - ECB key interest rates (daily, FM dataset), kept as the dates on which they changed
// The job refuses to write if the download looks incomplete, so a bad day never blanks the site.
//   node scripts/fetch.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = join(ROOT, 'data', 'primometro.json');
const API = 'https://data-api.ecb.europa.eu/service/data';

// euro area members and the month they adopted the euro (before that, a gap with Germany includes currency risk)
const EURO = {
  AT: ['Austria', '1999-01'], BE: ['Bélgica', '1999-01'], DE: ['Alemania', '1999-01'], ES: ['España', '1999-01'],
  FI: ['Finlandia', '1999-01'], FR: ['Francia', '1999-01'], IE: ['Irlanda', '1999-01'], IT: ['Italia', '1999-01'],
  LU: ['Luxemburgo', '1999-01'], NL: ['Países Bajos', '1999-01'], PT: ['Portugal', '1999-01'], GR: ['Grecia', '2001-01'],
  SI: ['Eslovenia', '2007-01'], CY: ['Chipre', '2008-01'], MT: ['Malta', '2008-01'], SK: ['Eslovaquia', '2009-01'],
  EE: ['Estonia', '2011-01'], LV: ['Letonia', '2014-01'], LT: ['Lituania', '2015-01'], HR: ['Croacia', '2023-01'],
  BG: ['Bulgaria', '2026-01'],
};

async function csv(path) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(`${API}/${path}${path.includes('?') ? '&' : '?'}format=csvdata`, { headers: { 'user-agent': 'primometro (+https://jordijoan.es/hobbylab/)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
      const lines = (await res.text()).trim().split(/\r?\n/);
      const head = lines[0].split(',');
      const ix = n => head.indexOf(n);
      const [iA, iP, iV] = [ix('REF_AREA'), ix('TIME_PERIOD'), ix('OBS_VALUE')];
      // values never contain commas in these series; titles (later columns) are not needed
      return lines.slice(1).map(l => l.split(',')).map(c => ({ area: c[iA], t: c[iP], v: c[iV] === '' ? null : Number(c[iV]) }))
        .filter(r => r.v != null && Number.isFinite(r.v));
    } catch (e) {
      if (i >= 4) throw e;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
}

// Eurostat dataset -> { area: [[period, value], ...] }. Eurostat writes Greece as EL; the euro area code
// differs by dataset (EA = changing composition where it exists), passed in as `ea`.
async function eurostat(dataset, params, codes, ea = 'EA') {
  const geo = codes.map(c => (c === 'GR' ? 'EL' : c === 'U2' ? ea : c));
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?format=JSON&${params}&` + geo.map(g => 'geo=' + g).join('&');
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'primometro (+https://jordijoan.es/hobbylab/)' } });
      if (!res.ok) throw new Error('Eurostat HTTP ' + res.status);
      const j = await res.json();
      // JSON-stat: one flat value array indexed by the product of the dimension positions
      const stride = {}; let s = 1;
      for (let k = j.id.length - 1; k >= 0; k--) { stride[j.id[k]] = s; s *= j.size[k]; }
      const geoIx = j.dimension.geo.category.index, timeIx = j.dimension.time.category.index;
      const out = {};
      for (const [g, gi] of Object.entries(geoIx)) {
        const code = g === 'EL' ? 'GR' : g === ea ? 'U2' : g;
        const rows = [];
        for (const [t, ti] of Object.entries(timeIx)) {
          const v = j.value[gi * stride.geo + ti * stride.time];
          if (v != null) rows.push([t, v]);
        }
        out[code] = rows.sort((a, b) => a[0].localeCompare(b[0]));
      }
      return out;
    } catch (e) {
      if (i >= 4) throw e;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
}

// daily series -> the days on which the value changed
function changes(rows) {
  const out = [];
  for (const r of rows.sort((a, b) => a.t.localeCompare(b.t))) if (!out.length || out[out.length - 1][1] !== r.v) out.push([r.t, r.v]);
  return out;
}

const yieldsRows = await csv(`IRS/M.${Object.keys(EURO).join('+')}+U2.L.L40.CI.0000.EUR.N.Z`);
const yields = {};
for (const r of yieldsRows) (yields[r.area] ??= []).push([r.t, Math.round(r.v * 1000) / 1000]);
for (const k in yields) yields[k].sort((a, b) => a[0].localeCompare(b[0]));

const [dfr, mrrFr, mrrMbr, mlf] = await Promise.all(['DFR', 'MRR_FR', 'MRR_MBR', 'MLFR'].map(k => csv(`FM/D.U2.EUR.4F.KR.${k}.LEV`)));
// main refinancing operations: fixed rate, except June 2000 - October 2008 when the ECB set a minimum bid rate
const mroByDay = new Map(mrrMbr.map(r => [r.t, r.v]));
for (const r of mrrFr) mroByDay.set(r.t, r.v);
const mro = [...mroByDay].map(([t, v]) => ({ t, v }));

const AREAS = [...Object.keys(EURO), 'U2'];
// HICP, annual rate of change, all items (ECOICOP ver. 2 dataset introduced in 2026, back-cast to 1997)
const infl = await eurostat('prc_hicp_minr', 'unit=RCH_A&coicop18=TOTAL', AREAS);
// the price index itself (2025 = 100), for inflation accumulated between two months
const hicp = await eurostat('prc_hicp_minr', 'unit=I25&coicop18=TOTAL', AREAS);
// general government net lending (+) / borrowing (−), % of GDP, annual, from the EDP notifications;
// the euro area aggregate here is the fixed EA20 composition
const deficitRows = await eurostat('gov_10dd_edpt1', 'na_item=B9&sector=S13&unit=PC_GDP', AREAS, 'EA20');
const deficit = Object.fromEntries(Object.entries(deficitRows).map(([k, rows]) => [k, rows.map(([y, v]) => [y, Math.round(v * 10) / 10])]));

const doc = {
  updated: null,
  source: 'Banco Central Europeo, ECB Data Portal: rendimiento de la deuda pública a 10 años (serie del criterio de convergencia, IRS) y tipos de interés oficiales del BCE (FM). Eurostat: inflación armonizada (IPCA), tasa anual (prc_hicp_minr).',
  sourceUrl: 'https://data.ecb.europa.eu/',
  countries: Object.fromEntries(Object.entries(EURO).map(([k, [n, euro]]) => [k, { n, euro }])),
  yields,
  inflation: infl,
  hicp,
  deficit,
  rates: { dfr: changes(dfr), mro: changes(mro), mlf: changes(mlf) },
};

// sanity checks before replacing yesterday's file
let old = null;
try { old = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
const problems = [];
for (const k of [...Object.keys(EURO), 'U2']) if (!yields[k]?.length) problems.push(`no yields for ${k}`);
if ((yields.DE || []).length < 300) problems.push('German series too short');
if (doc.rates.dfr.length < 30) problems.push('deposit rate history too short');
if (old) for (const k in old.yields) if ((yields[k]?.length || 0) < old.yields[k].length) problems.push(`${k} lost months`);
for (const k of [...Object.keys(EURO), 'U2']) if ((infl[k]?.length || 0) < 200) problems.push(`inflation series too short for ${k}`);
if (old?.inflation) for (const k in old.inflation) if ((infl[k]?.length || 0) < old.inflation[k].length) problems.push(`${k} lost inflation months`);
for (const k of AREAS) if ((deficit[k]?.length || 0) < 10) problems.push(`deficit series too short for ${k}`);
for (const k of AREAS) if ((hicp[k]?.length || 0) < 200) problems.push(`price index too short for ${k}`);
if (old?.deficit) for (const k in old.deficit) if ((deficit[k]?.length || 0) < old.deficit[k].length) problems.push(`${k} lost deficit years`);
if (problems.length) { console.error('Not updating: ' + problems.join('; ')); process.exit(1); }

const same = old && JSON.stringify({ ...old, updated: null }) === JSON.stringify(doc);
doc.updated = same ? old.updated : new Date().toISOString();
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(OUT, JSON.stringify(doc) + '\n');
const last = yields.DE[yields.DE.length - 1][0];
console.log(`${same ? 'no change' : 'updated'}: ${Object.keys(yields).length} yield series, last month ${last}; ${Object.keys(infl).length} inflation series, last month ${infl.U2.at(-1)[0]}; ${Object.keys(deficit).length} deficit series, last year ${deficit.U2.at(-1)[0]}; deposit rate ${doc.rates.dfr.at(-1).join(' = ')}`);
