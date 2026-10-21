// Poll of polls for one election.
//   - each pollster counts once: its most recent poll
//   - weight = 0.5^(age / HALF_LIFE) * sqrt(sample / 1000), sample clamped to 300..3000 (800 if unknown)
//   - the average restarts after every election (a "cycle")
//   - a party missing from a poll is left out of that poll's weight, not counted as zero
//   - seats: weighted mean of each pollster's seat midpoint, rounded to the chamber size (largest remainder)
export const HALF_LIFE = 30;
const DAY = 86400000;
export const dayNum = s => Math.round(Date.parse(s + 'T00:00:00Z') / DAY);
export const dayStr = n => new Date(n * DAY).toISOString().slice(0, 10);

function weight(p, t) {
  const n = Math.min(Math.max(p.n || 800, 300), 3000);
  return Math.pow(0.5, (t - p.dn) / HALF_LIFE) * Math.sqrt(n / 1000);
}

// polls sorted by date, already restricted to one cycle
function latestPerPollster(polls, t) {
  const m = new Map();
  for (const p of polls) {
    if (p.dn > t) break;
    m.set(p.pk, p);
  }
  return [...m.values()];
}

// parties carried by under 5% of the total weight (e.g. only by a stale poll) are left out
export const MIN_COVERAGE = 0.05;
// the min-max spread shown next to each average only looks at recent polls
export const RANGE_DAYS = 60;

export function voteAverage(polls, t) {
  const used = latestPerPollster(polls, t).map(p => ({ p, w: weight(p, t) }));
  const W = used.reduce((a, u) => a + u.w, 0);
  const recent = used.some(u => t - u.p.dn <= RANGE_DAYS) ? u => t - u.p.dn <= RANGE_DAYS : () => true;
  const acc = new Map();
  for (const u of used) {
    const { p, w } = u;
    for (const x of p.p) {
      if (x.v == null) continue;
      const a = acc.get(x.k) || { num: 0, den: 0, min: Infinity, max: -Infinity, n: 0 };
      a.num += w * x.v; a.den += w;
      if (recent(u)) {
        a.n++;
        if (x.v < a.min) a.min = x.v;
        if (x.v > a.max) a.max = x.v;
      }
      acc.set(x.k, a);
    }
  }
  const out = {};
  for (const [k, a] of acc) {
    if (!(a.den > 0) || a.den / W < MIN_COVERAGE) continue;
    out[k] = { v: a.num / a.den, min: a.n ? a.min : null, max: a.n ? a.max : null, n: a.n, cov: a.den / W };
  }
  return { used, parties: out };
}

const mid = s => (s[0] + s[1]) / 2;

export function seatAverage(polls, t, total) {
  const withSeats = latestPerPollster(polls.filter(p => p.p.some(x => x.s)), t);
  if (!withSeats.length) return null;
  const acc = new Map();
  let wsum = 0;
  const keys = new Set();
  withSeats.forEach(p => p.p.forEach(x => x.s && keys.add(x.k)));
  const anyRecent = withSeats.some(p => t - p.dn <= RANGE_DAYS);
  for (const p of withSeats) {
    const w = weight(p, t);
    wsum += w;
    const isRecent = !anyRecent || t - p.dn <= RANGE_DAYS;
    const lo = p.p.reduce((a, x) => a + (x.s ? x.s[0] : 0), 0);
    const hi = p.p.reduce((a, x) => a + (x.s ? x.s[1] : 0), 0);
    // a poll that allocates the whole chamber gives zero to any party it leaves out
    const complete = total && lo <= total + 1 && hi >= total - 1;
    for (const k of keys) {
      const x = p.p.find(y => y.k === k && y.s);
      if (!x && !complete) continue;
      const a = acc.get(k) || { num: 0, den: 0, min: Infinity, max: -Infinity };
      const v = x ? mid(x.s) : 0;
      a.num += w * v; a.den += w;
      if (isRecent) {
        a.min = Math.min(a.min, x ? x.s[0] : 0);
        a.max = Math.max(a.max, x ? x.s[1] : 0);
      }
      acc.set(k, a);
    }
  }
  const raw = [...acc].filter(([, a]) => a.den / wsum >= MIN_COVERAGE)
    .map(([k, a]) => ({ k, x: a.num / a.den, min: Number.isFinite(a.min) ? a.min : null, max: Number.isFinite(a.max) ? a.max : null }))
    .filter(r => r.x > 0.05 || r.max > 0);
  const sum = raw.reduce((a, r) => a + r.x, 0);
  let target = total || Math.round(sum);
  // partial seat lists (older summaries) leave the rest of the chamber unassigned
  const assignable = Math.min(target, Math.round(sum));
  const scale = sum > 0 && sum > target ? target / sum : 1;
  raw.forEach(r => { r.x *= scale; r.s = Math.floor(r.x); });
  let left = assignable - raw.reduce((a, r) => a + r.s, 0);
  [...raw].sort((a, b) => (b.x - b.s) - (a.x - a.s)).forEach(r => { if (left > 0) { r.s++; left--; } });
  const seats = raw.filter(r => r.s > 0 || r.max > 0).map(r => ({ k: r.k, s: r.s, x: +r.x.toFixed(2), min: r.min, max: r.max }));
  const assigned = seats.reduce((a, r) => a + r.s, 0);
  return { seats, total: target, unassigned: Math.max(0, target - assigned), pollsters: withSeats.length };
}

// cycle start for day t: last election strictly before t
export function cycleStart(dates, t) {
  let s = -Infinity;
  for (const d of dates) if (d < t && d > s) s = d;
  return s;
}

export function series(polls, electionDays) {
  const days = [...new Set(polls.map(p => p.dn))].sort((a, b) => a - b);
  const out = [];
  for (const t of days) {
    const cs = cycleStart(electionDays, t);
    const cyc = polls.filter(p => p.dn > cs && p.dn <= t);
    const { parties } = voteAverage(cyc, t);
    const row = {};
    for (const [k, a] of Object.entries(parties)) row[k] = Math.round(a.v * 10) / 10;
    out.push({ t, row });
  }
  return out;
}
