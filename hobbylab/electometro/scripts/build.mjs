// Parses cached posts into data/polls.json, then writes the averages the site reads:
//   data/elections.json   one row per election (for the picker)
//   data/e/<id>.json      polls, current average, seats and trend for one election
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { extract } from './lib/extract.mjs';
import { classify, KIND_NAMES } from './lib/classify.mjs';
import { slug, partyKey } from './lib/text.mjs';
import { dayNum, dayStr, voteAverage, seatAverage, series, cycleStart, HALF_LIFE } from './lib/aggregate.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CACHE = join(ROOT, '.cache', 'posts');
const DATA = join(ROOT, 'data');
const POLLS = join(DATA, 'polls.json');

// Spanish general elections before the blog's posts carried "Última elección"
const KNOWN_ELECTIONS = { 'es-congreso': ['2011-11-20', '2015-12-20', '2016-06-26', '2019-04-28', '2019-11-10', '2023-07-23'] };

const r1 = x => Math.round(x * 10) / 10;

function toRecord(post) {
  const c = classify(post);
  if (c.skip) return null;
  const e = extract(post);
  if (e.parties.length < 2) return null;
  const rec = {
    id: post.id, u: post.url, t: post.title, d: e.date, ds: e.dateSource, pub: post.published.slice(0, 10),
    e: c.id, kd: c.kind, cc: c.country, a: c.area, tpl: e.tpl,
    p: e.parties.map(x => {
      const o = { n: x.n, k: x.k };
      if (x.f && x.f !== x.n) o.f = x.f;
      if (x.c) o.c = x.c;
      // the cards print 0 when a pollster gives no figure for a party: treat it as missing
      if (x.v != null && x.v > 0) o.v = x.v;
      if (x.s) o.s = x.s;
      if (x.rv != null) o.rv = x.rv;
      if (x.rs != null) o.rs = x.rs;
      if (x.amb) o.amb = 1;
      if (x.o != null) o.o = Math.round(x.o * 1000) / 1000;
      return o;
    }).filter(o => o.v != null || o.s),
  };
  if (rec.p.length < 2) return null;
  const opt = { d0: e.start, po: e.pollster, cl: e.client, m: e.method, n: e.sample, T: e.total, M: e.majority, le: e.lastElection, an: e.areaName, r: c.region, par: c.parent };
  for (const [k, v] of Object.entries(opt)) if (v != null && v !== '') rec[k] = v;
  if (e.partial) rec.pa = 1;
  if (c.flags.internal) rec.fi = 1;
  if (c.flags.result) rec.fr = 1;
  if (c.flags.exit) rec.fx = 1;
  return rec;
}

const add = (a, b) => (a == null ? b : b == null ? a : Math.round((a + b) * 10) / 10);

// Same party under several names in one election: full names used as keys in seat tables, and the
// hand-kept merges in config/aliases.json. Entries that end up on one key within a poll are added up.
function normaliseParties(recs, alias) {
  const fullToKey = new Map();
  for (const r of recs) for (const x of r.p) if (x.f && x.v != null) fullToKey.set(partyKey(x.f), x.k);
  for (const r of recs) {
    const out = [];
    for (const x0 of r.p) {
      let k = x0.k;
      if (x0.v == null && fullToKey.has(k)) k = fullToKey.get(k);
      k = alias.merge?.[k] || k;
      const x = { ...x0, k };
      const y = out.find(z => z.k === k);
      if (!y) { out.push(x); continue; }
      y.v = add(y.v, x.v);
      if (x.s) y.s = y.s ? [y.s[0] + x.s[0], y.s[1] + x.s[1]] : x.s;
      y.rv = add(y.rv, x.rv);
      y.rs = add(y.rs, x.rs);
      y.c = y.c || x.c;
      for (const f of ['v', 'rv', 'rs']) if (y[f] == null) delete y[f];
    }
    r.p = out;
  }
}

const pollsterKey = s => slug((s || '?').replace(/\(.*?\)|\[.*?\]/g, '').replace(/\bpoll\b/i, '')).replace(/-/g, '') || '?';
const mode = arr => {
  const m = new Map();
  for (const x of arr) if (x != null) m.set(x, (m.get(x) || 0) + 1);
  let best = null, bc = 0;
  for (const [k, c] of m) if (c > bc) { best = k; bc = c; }
  return best;
};

async function main() {
  let db = {};
  try { for (const r of JSON.parse(await readFile(POLLS, 'utf8'))) db[r.id] = r; } catch {}
  let files = [];
  try { files = await readdir(CACHE); } catch {}
  let parsed = 0, dropped = 0;
  for (const f of files) {
    const post = JSON.parse(await readFile(join(CACHE, f), 'utf8'));
    const rec = toRecord(post);
    if (rec) { db[post.id] = rec; parsed++; } else { delete db[post.id]; dropped++; }
  }
  const all = Object.values(db).sort((a, b) => a.d.localeCompare(b.d) || a.id.localeCompare(b.id));
  await mkdir(DATA, { recursive: true });
  await writeFile(POLLS, '[\n' + all.map(r => JSON.stringify(r)).join(',\n') + '\n]\n');
  console.log(`posts read ${files.length}: ${parsed} polls, ${dropped} without figures; database ${all.length} polls`);

  const aliases = JSON.parse(await readFile(join(ROOT, 'config', 'aliases.json'), 'utf8'));
  // work on copies: polls.json keeps the figures as published
  for (const r of all) r.p = r.p.map(x => ({ ...x }));

  // party colours seen anywhere, newest first, for summaries that carry none
  const globalColor = {};
  for (const r of all) for (const x of r.p) if (x.c) globalColor[x.k] = x.c;

  const byElection = new Map();
  for (const r of all) {
    if (!byElection.has(r.e)) byElection.set(r.e, []);
    byElection.get(r.e).push(r);
  }

  await rm(join(DATA, 'e'), { recursive: true, force: true });
  await mkdir(join(DATA, 'e'), { recursive: true });
  const index = [];
  const today = dayNum(new Date().toISOString().slice(0, 10));

  for (const [id, recs] of byElection) {
    if (!recs.some(r => !r.fr)) continue; // only result posts, no polls
    const alias = aliases[id] || {};
    normaliseParties(recs, alias);
    const latest = recs[recs.length - 1];
    const T = mode(recs.slice(-30).map(r => r.T)) || mode(recs.map(r => r.T));
    const M = mode(recs.slice(-30).map(r => r.M)) || (T ? Math.floor(T / 2) + 1 : null);

    // whole-number lists without "%" whose total matches the chamber are seat counts
    for (const r of recs) {
      if (T && r.p.every(x => x.amb) && Math.abs(r.p.reduce((a, x) => a + x.v, 0) - T) <= 1) {
        r.p.forEach(x => { x.s = [x.v, x.v]; delete x.v; delete x.amb; });
      }
    }

    // election days: "Última elección" seen in two or more posts, result posts, known dates
    const leCount = new Map();
    recs.forEach(r => r.le && leCount.set(r.le, (leCount.get(r.le) || 0) + 1));
    const elDays = new Set(KNOWN_ELECTIONS[id] || []);
    for (const [d, c] of leCount) if (c >= 2 || recs.length < 4) elDays.add(d);
    recs.filter(r => r.fr).forEach(r => elDays.add(r.d));
    const electionDays = [...elDays].map(dayNum).filter(d => d <= today).sort((a, b) => a - b);

    const polls = recs.filter(r => !r.fr && !r.fx && !r.fi).filter(r => r.p.reduce((a, x) => a + (x.v || 0), 0) <= 115)
      .map(r => ({ ...r, dn: dayNum(r.d), pk: pollsterKey(r.po) }));
    const results = recs.filter(r => r.fr);

    const parties = {};
    for (const r of recs) for (const x of r.p) {
      const prev = parties[x.k] || {};
      parties[x.k] = { n: x.n, c: x.c || prev.c || globalColor[x.k], f: x.f || prev.f };
    }
    for (const [k, label] of Object.entries(alias.names || {})) if (parties[k]) parties[k].n = label;
    // left-to-right seating position: median of the position in recent seat charts
    const posSamples = {};
    for (const r of recs.filter(r => r.p.some(x => x.o != null)).slice(-40)) {
      for (const x of r.p) if (x.o != null) (posSamples[x.k] ??= []).push(x.o);
    }
    for (const [k, arr] of Object.entries(posSamples)) {
      if (!parties[k]) continue;
      arr.sort((a, b) => a - b);
      parties[k].pos = Math.round(arr[Math.floor(arr.length / 2)] * 1000) / 1000;
    }
    for (const k in parties) if (!parties[k].c) delete parties[k].c;
    for (const k in parties) if (!parties[k].f) delete parties[k].f;

    let now = null;
    if (polls.length) {
      const tNow = polls[polls.length - 1].dn;
      const cs = cycleStart(electionDays, tNow + 1);
      const cyc = polls.filter(p => p.dn > cs);
      const va = voteAverage(cyc, tNow);
      const votes = Object.entries(va.parties).map(([k, a]) => ({ k, v: r1(a.v), min: a.min, max: a.max, n: a.n })).sort((a, b) => b.v - a.v);
      const sa = seatAverage(cyc, tNow, T);
      if (sa) sa.seats.sort((a, b) => b.s - a.s || b.x - a.x);
      const wsum = va.used.reduce((a, u) => a + u.w, 0);
      now = {
        d: dayStr(tNow), pub: recs.reduce((m, r) => (!r.fr && r.pub > m ? r.pub : m), ''), since: Number.isFinite(cs) ? dayStr(cs) : null, nCycle: cyc.length,
        votes, seats: sa,
        used: va.used.sort((a, b) => b.w - a.w).map(u => ({ id: u.p.id, po: u.p.po, d: u.p.d, w: +(u.w / wsum).toFixed(3) })),
      };
    }

    // previous result per party: the value most recent polls quote as the last election's
    let prev = null;
    const since = now && now.since ? now.since : '';
    const withRef = recs.filter(r => !r.fr && r.d > since && r.p.some(x => x.rv != null || x.rs != null)).slice(-20);
    if (withRef.length) {
      prev = { d: now && now.since, v: {}, s: {} };
      const keys = new Set(withRef.flatMap(r => r.p.map(x => x.k)));
      for (const k of keys) {
        const rv = mode(withRef.map(r => r.p.find(x => x.k === k)?.rv));
        const rs = mode(withRef.map(r => r.p.find(x => x.k === k)?.rs));
        if (rv != null) prev.v[k] = rv;
        if (rs != null) prev.s[k] = rs;
      }
    }

    // How the last official result fits the polls:
    //   now  = result vs today's average (with the spread between pollsters)
    //   back = the average on the eve of that election vs the result (a backtest)
    let fit = null;
    if (prev && now && now.since && (Object.keys(prev.v).length || Object.keys(prev.s).length)) {
      const tNow = dayNum(now.d);
      const cs0 = cycleStart(electionDays, tNow + 1);
      const va = voteAverage(polls.filter(p => p.dn > cs0), tNow);
      const sd = {};
      for (const k of Object.keys(va.parties)) {
        let sw = 0, m = va.parties[k].v, ss = 0;
        for (const u of va.used) { const x = u.p.p.find(y => y.k === k && y.v != null); if (x) { sw += u.w; ss += u.w * (x.v - m) ** 2; } }
        sd[k] = sw ? Math.sqrt(ss / sw) : 0;
      }
      const tB = dayNum(now.since) - 1;
      const csB = cycleStart(electionDays, dayNum(now.since));
      const cycB = polls.filter(p => p.dn > csB && p.dn <= tB);
      let back = null;
      if (cycB.length >= 3) {
        const vb = voteAverage(cycB, tB), sb = seatAverage(cycB, tB, T);
        back = {
          d: dayStr(tB), n: cycB.length, since: Number.isFinite(csB) ? dayStr(csB) : null,
          v: Object.fromEntries(Object.entries(vb.parties).map(([k, a]) => [k, r1(a.v)])),
          // only parties known from vote figures or the quoted result; stray seat-table headers are dropped
          s: sb ? Object.fromEntries(sb.seats.filter(s => vb.parties[s.k] || s.k in prev.v || s.k in prev.s).map(s => [s.k, s.s])) : null,
        };
      }
      fit = { sd: Object.fromEntries(Object.entries(sd).map(([k, v]) => [k, r1(v)])), back };
    }

    const ser = series(polls, electionDays);
    const lineKeys = new Set();
    ser.forEach(s => Object.keys(s.row).forEach(k => lineKeys.add(k)));
    const lines = {};
    for (const k of lineKeys) {
      const vals = ser.map(s => s.row[k] ?? null);
      if (Math.max(...vals.map(v => v ?? 0)) >= 0.5) lines[k] = vals;
    }

    const areaName = (['municipales', 'forales', 'cabildo', 'consell'].includes(latest.kd)
      && [...recs].reverse().find(r => r.an && r.an.length < 40 && !r.an.includes('·'))?.an) || latest.a;
    const doc = {
      id, name: areaName, kind: latest.kd, kindName: KIND_NAMES[latest.kd] || latest.kd, country: latest.cc,
      parent: latest.par || null, region: latest.r || null, T: T || null, M: M || null,
      elections: electionDays.map(dayStr), halfLife: HALF_LIFE,
      parties, now, prev, fit,
      series: { t: ser.map(s => dayStr(s.t)), lines },
      results: results.map(r => ({ id: r.id, u: r.u, d: r.d, p: r.p.map(x => [x.k, x.v ?? null, x.s ? x.s[0] : null]) })),
      polls: recs.filter(r => !r.fr).map(r => {
        const o = { id: r.id, u: r.u, d: r.d, po: r.po || '?', p: r.p.map(x => x.s ? [x.k, x.v ?? null, x.s[0], x.s[1]] : [x.k, x.v ?? null]) };
        for (const k of ['d0', 'cl', 'n', 'm', 'fi', 'fx', 'pa']) if (r[k] != null) o[k] = r[k];
        return o;
      }),
    };
    await writeFile(join(DATA, 'e', `${id}.json`), JSON.stringify(doc));
    index.push({
      id, name: areaName, kind: latest.kd, country: latest.cc, parent: latest.par || undefined, region: latest.r || undefined,
      n: now ? now.nCycle : 0, total: recs.filter(r => !r.fr).length, last: latest.d, seats: !!(now && now.seats),
      T: now && now.seats ? now.seats.total : T || undefined, M: M || undefined,
      top: now ? now.votes.slice(0, 3).map(v => [v.k, parties[v.k]?.n || v.k, v.v, parties[v.k]?.c || null]) : [],
      // seats left to right, for the small chamber bars on the overview
      sb: now && now.seats ? [...now.seats.seats].filter(s => s.s > 0)
        .sort((a, b) => (parties[a.k]?.pos ?? 2) - (parties[b.k]?.pos ?? 2) || b.s - a.s)
        .map(s => [parties[s.k]?.n || s.k, s.s, parties[s.k]?.c || null]) : undefined,
    });
  }
  index.sort((a, b) => b.last.localeCompare(a.last));
  // "updated" only moves when the data does, so days without news produce no change to commit
  let updated = new Date().toISOString();
  try {
    const old = JSON.parse(await readFile(join(DATA, 'elections.json'), 'utf8'));
    if (JSON.stringify(old.elections) === JSON.stringify(index)) updated = old.updated;
  } catch {}
  await writeFile(join(DATA, 'elections.json'), JSON.stringify({ updated, elections: index }));
  console.log(`elections ${index.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
