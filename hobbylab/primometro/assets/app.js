const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, kids = []) {
  const e = attrs.svg ? document.createElementNS(NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'svg' || v == null || v === false) continue;
    if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) if (c != null) e.append(c);
  return e;
}
const S = (tag, attrs = {}, kids) => el(tag, { ...attrs, svg: 1 }, kids);
const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); };
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// ---------- formatting ----------
const nf2 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = v => v == null ? '–' : nf2.format(v) + ' %';
const bp = v => v == null ? '–' : `${Math.round(v)} pb`;
const sbp = v => v == null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(Math.round(v))} pb`;
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mShort = m => `${MES[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const mLong = m => `${MESL[+m.slice(5, 7) - 1]} de ${m.slice(0, 4)}`;
const dLong = d => `${+d.slice(8, 10)} ${MES[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
const tMonth = m => Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15);
const tDay = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const addMonths = (m, n) => { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); };

// ---------- state ----------
const RANGES = [['2a', '2 años'], ['5a', '5 años'], ['2007', 'Desde 2007'], ['euro', 'Desde 1999'], ['todo', 'Todo']];
const SLOTS = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];
const state = { D: null, map: null, country: 'ES', vs: 'DE', range: '2007', active: ['ES', 'IT', 'FR', 'PT'], slot: {}, mapMonth: null, playing: null, decAll: false, scale: 'mes', metric: 'prima' };

// a country keeps its colour for as long as it stays on the chart
function assignSlots() {
  for (const k of Object.keys(state.slot)) if (!state.active.includes(k)) delete state.slot[k];
  for (const k of state.active) if (!(k in state.slot)) {
    const used = new Set(Object.values(state.slot));
    state.slot[k] = SLOTS.find(s => !used.has(s)) || SLOTS[0];
  }
}
const colorOf = k => css(state.slot[k] || '--s1');

// ---------- data helpers ----------
let byMonth = {}; // area -> Map(month -> yield)
let inflBy = {};  // area -> Map(month -> annual HICP inflation)
function prep(D) {
  byMonth = {}; inflBy = {};
  for (const [k, rows] of Object.entries(D.yields)) byMonth[k] = new Map(rows);
  for (const [k, rows] of Object.entries(D.inflation || {})) inflBy[k] = new Map(rows);
}
const lastMonth = () => state.D.yields.DE.at(-1)[0];
const infl = (k, m) => inflBy[k]?.get(m) ?? null;
const lastInfl = () => state.D.inflation.U2.at(-1)[0];
const nf1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = v => v == null ? '–' : nf1.format(v) + ' %';
// what the map and the ranking show
const METRIC = {
  prima: { center: 0, val: (k, m) => (k === state.vs ? 0 : prem(k, m)), fmt: v => String(Math.round(v)), full: v => bp(v), last: () => lastMonth() },
  infl: { center: 2, val: (k, m) => infl(k, m), fmt: v => nf1.format(v), full: v => pct1(v), last: () => lastInfl() },
};
function prem(k, m) {
  const a = byMonth[k]?.get(m), b = byMonth[state.vs]?.get(m);
  return a == null || b == null ? null : (a - b) * 100;
}
function rangeStart() {
  const L = lastMonth();
  return { '2a': addMonths(L, -23), '5a': addMonths(L, -59), '2007': '2007-01', euro: '1999-01', todo: '1986-01' }[state.range];
}
const monthsIn = (from, to) => { const out = []; for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m); return out; };
const rateAt = (series, d) => { let v = null; for (const [t, x] of series) { if (t <= d) v = x; else break; } return v; };
const cname = k => k === 'U2' ? 'Media de la zona euro' : state.D.countries[k]?.n || k;
const refName = () => state.vs === 'DE' ? 'Alemania' : 'la media de la zona euro';
const inEuro = (k, m) => state.D.countries[k] && m >= state.D.countries[k].euro;

// ---------- tooltip ----------
const tip = $('tip');
function showTip(e, build) {
  clear(tip); build(tip); tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
  if (y + r.height > innerHeight - 8) y = innerHeight - r.height - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
const hideTip = () => { tip.hidden = true; };
const tipRow = (color, name, value) => el('div', { class: 'r' }, [el('i', { class: 'key', style: `background:${color}` }), el('span', { class: 'n', text: name }), el('span', { class: 'v', text: value })]);

// ---------- colour scale for the map ----------
// Continuous heat scale above the reference (pale yellow -> orange -> dark red, monotone in lightness)
// and a one-hue blue below it. Two domains:
//   'mes'  the month's own range, so today's small spreads still read apart (default)
//   'fija' a square-root scale up to 600 pb, the same every month, so playback shows 2012 as 2012
const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
const FIXED_MAX = 600, FIXED_NEG = 150;
function oklch(L, C, h) {
  for (let c = C; c >= 0; c -= 0.005) {
    const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    if (lin.every(x => x >= -0.0005 && x <= 1.0005)) {
      const g = x => { x = Math.min(1, Math.max(0, x)); return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055) * 255); };
      return '#' + lin.map(x => g(x).toString(16).padStart(2, '0')).join('');
    }
  }
  return '#808080';
}
const heat = t => { const d = isDark(); return oklch(d ? 0.91 - 0.39 * t : 0.95 - 0.57 * t, 0.08 + 0.10 * t, 100 - 72 * t); };
const cold = t => { const d = isDark(); return oklch(d ? 0.86 - 0.30 * t : 0.90 - 0.40 * t, 0.05 + 0.09 * t, 255); };
// warm above the centre (0 pb for the premium, the ECB's 2 % target for inflation), blue below it
const FIXED = { prima: { max: FIXED_MAX, neg: FIXED_NEG, ticks: [0, 50, 100, 200, 400, 600] }, infl: { max: 10, neg: 3, ticks: [2, 3, 4, 6, 8, 10] } };
const niceUp = (v, metric) => {
  const s = metric === 'infl' ? (v <= 2 ? 0.5 : 1) : v <= 50 ? 10 : v <= 150 ? 25 : v <= 400 ? 50 : 100;
  return Math.max(s, Math.ceil(v / s) * s);
};
function makeScale(values, metric = 'prima') {
  const c = METRIC[metric].center, fija = state.scale === 'fija', floor = metric === 'infl' ? 0.5 : 10;
  const max = fija ? FIXED[metric].max - c : niceUp(Math.max(floor, ...values.map(v => v - c)), metric);
  const neg = fija ? FIXED[metric].neg : niceUp(Math.max(floor, ...values.map(v => c - v)), metric);
  const tPos = d => { const x = Math.min(Math.max(d, 0), max) / max; return fija ? Math.sqrt(x) : x; };
  const tNeg = d => { const x = Math.min(Math.max(d, 0), neg) / neg; return fija ? Math.sqrt(x) : x; };
  return { kind: fija ? 'fija' : 'mes', metric, center: c, max, neg,
    fill: v => (v >= c ? heat(tPos(v - c)) : cold(tNeg(c - v))),
    pos: v => tPos(v - c),
    // inflation ticks on whole (or half) percentages; the premium in quarters of its range
    ticks: fija ? FIXED[metric].ticks : metric === 'infl'
      ? Array.from({ length: Math.round(max / (max <= 2 ? 0.5 : 1)) + 1 }, (_, i) => c + i * (max <= 2 ? 0.5 : 1))
      : [0, 0.25, 0.5, 0.75, 1].map(f => c + f * max) };
}
let scale = null;
const fillOf = v => scale.fill(v);

// ---------- controls ----------
function buildControls() {
  const sel = $('country'); clear(sel);
  Object.entries(state.D.countries).filter(([k]) => k !== state.vs).sort((a, b) => a[1].n.localeCompare(b[1].n, 'es'))
    .forEach(([k, c]) => sel.append(el('option', { value: k, text: c.n })));
  sel.value = state.country;
  sel.onchange = () => { setCountry(sel.value); };
  const rg = $('ranges'); clear(rg);
  for (const [k, n] of RANGES) {
    const b = el('button', { 'aria-pressed': String(state.range === k), text: n });
    b.onclick = () => { state.range = k; rg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); writeHash(); renderTrend(); renderDecisions(); };
    rg.append(b);
  }
  document.querySelectorAll('[data-vs]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.vs === state.vs));
    b.onclick = () => {
      state.vs = b.dataset.vs;
      document.querySelectorAll('[data-vs]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      if (state.vs === 'DE' && state.country === 'DE') state.country = 'ES';
      state.active = state.active.filter(k => k !== state.vs);
      buildControls(); writeHash(); renderAll();
    };
  });
}
function setCountry(k) {
  state.country = k;
  if (!state.active.includes(k)) { state.active = [k, ...state.active].slice(0, 8); }
  $('country').value = k;
  writeHash(); renderAll();
}

// ---------- hero ----------
function renderHero() {
  const h = $('hero'); clear(h);
  const k = state.country, L = lastMonth();
  const now = prem(k, L), m1 = prem(k, addMonths(L, -1)), m12 = prem(k, addMonths(L, -12));
  let max = null;
  for (const m of monthsIn(inEuro(k, '2099-01') ? state.D.countries[k].euro : '1999-01', L)) { const v = prem(k, m); if (v != null && (!max || v > max.v)) max = { v, m }; }
  const dfr = state.D.rates.dfr.at(-1);
  const left = el('div', {}, [
    el('p', { class: 'eyebrow', text: `Prima de riesgo de ${cname(k)} frente a ${refName()} · ${mLong(L)}` }),
    el('p', { class: 'hero-num' }, [now == null ? '–' : String(Math.round(now)), el('small', { text: 'pb' })]),
    el('p', { class: 'sub', text: `Bono a 10 años: ${pct(byMonth[k]?.get(L))} · ${state.vs === 'DE' ? 'Alemania' : 'Zona euro'}: ${pct(byMonth[state.vs]?.get(L))} · media mensual del BCE` }),
  ]);
  const tile = (l, v, d) => el('div', { class: 'tile' }, [el('div', { class: 'l', text: l }), el('div', { class: 'v', text: v }), d ? el('div', { class: 'd', text: d }) : null]);
  const tiles = el('div', { class: 'tiles' }, [
    tile('Hace un mes', sbp(now != null && m1 != null ? now - m1 : null), m1 != null ? bp(m1) : ''),
    tile('Hace un año', sbp(now != null && m12 != null ? now - m12 : null), m12 != null ? bp(m12) : ''),
    tile('Máximo desde el euro', max ? bp(max.v) : '–', max ? mShort(max.m) : ''),
    tile('Tipo de depósito BCE', pct(dfr[1]), `desde el ${dLong(dfr[0])}`),
    tile(`Inflación ${k === 'U2' ? 'zona euro' : cname(k)}`, pct1(infl(k, lastInfl())), `${k === 'U2' ? '' : 'zona euro ' + pct1(infl('U2', lastInfl())) + ' · '}${mShort(lastInfl())}`),
  ]);
  h.append(left, tiles);
}

// ---------- line charts (premium + ECB rates, shared crosshair) ----------
function axisYears(svg, t0, t1, xs, H, m) {
  const y0 = new Date(t0).getUTCFullYear() + 1, y1 = new Date(t1).getUTCFullYear();
  const span = y1 - y0 + 1, every = span > 24 ? 4 : span > 12 ? 2 : 1;
  if (span <= 2) {
    for (let i = 0; i <= 4; i++) { const t = t0 + (t1 - t0) * i / 4, d = new Date(t).toISOString(); svg.append(S('text', { x: xs(t), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === 4 ? 'end' : 'middle', class: 'tick', text: mShort(d.slice(0, 7)) })); }
    return;
  }
  for (let y = y0; y <= y1; y++) if ((y - y0) % every === 0) svg.append(S('text', { x: xs(Date.UTC(y, 0, 1)), y: H - 6, 'text-anchor': 'middle', class: 'tick', text: String(y) }));
}
function niceStep(range, target) {
  const raw = range / target, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f > 5 ? 10 : f > 2 ? 5 : f > 1 ? 2 : 1) * p;
}

function renderTrend() {
  assignSlots();
  const from = rangeStart(), to = lastMonth();
  const months = monthsIn(from, to);
  $('trendTitle').textContent = `Prima de riesgo frente a ${refName()}`;

  // legend: toggle countries, add more from a list
  const lg = $('legend'); clear(lg);
  for (const k of state.active) {
    const b = el('button', { 'aria-pressed': 'true', title: 'Quitar de la gráfica' }, [el('i', { class: 'key', style: `background:${colorOf(k)}` }), cname(k), el('span', { class: 'v', text: bp(prem(k, to)) }), ' ×']);
    b.onclick = () => { if (state.active.length > 1) { state.active = state.active.filter(x => x !== k); writeHash(); renderTrend(); } };
    lg.append(b);
  }
  if (state.active.length < 8) {
    const add = el('select', { 'aria-label': 'Añadir país a la gráfica' }, [el('option', { value: '', text: '+ Añadir país' }),
      ...Object.entries(state.D.countries).filter(([k]) => k !== state.vs && !state.active.includes(k)).sort((a, b) => a[1].n.localeCompare(b[1].n, 'es')).map(([k, c]) => el('option', { value: k, text: c.n }))]);
    add.onchange = () => { if (add.value) { state.active.push(add.value); writeHash(); renderTrend(); } };
    lg.append(add);
  }

  const holder = $('spreadChart'), rh = $('ratesChart');
  clear(holder); clear(rh);
  const W = Math.max(320, holder.clientWidth || 900);
  const narrow = W < 560;
  const m = { l: 44, r: narrow ? 12 : 118, t: 12, b: 24 };
  // the axis runs to today: ECB rates are daily, bond yields lag by about a month
  const today = new Date().toISOString().slice(0, 10);
  const t0 = tMonth(months[0]), t1 = Math.max(tMonth(months.at(-1)), tDay(today));
  const xs = t => m.l + (t - t0) / Math.max(1, t1 - t0) * (W - m.l - m.r);

  // premium chart
  const H = narrow ? 260 : 340;
  const vals = state.active.flatMap(k => months.map(mm => prem(k, mm)).filter(v => v != null));
  let lo = Math.min(0, ...vals), hi = Math.max(50, ...vals);
  const step = niceStep(hi - lo, 5);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const ys = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': `Prima de riesgo de ${state.active.map(cname).join(', ')} frente a ${refName()}` });
  for (let v = lo; v <= hi + 1e-9; v += step) {
    svg.append(S('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v), class: v === 0 ? 'zero-line' : 'grid-line' }));
    svg.append(S('text', { x: m.l - 6, y: ys(v) + 4, 'text-anchor': 'end', class: 'tick', text: String(Math.round(v)) }));
  }
  axisYears(svg, t0, t1, xs, H, m);
  const ends = [];
  for (const k of state.active) {
    const col = colorOf(k);
    // two paths: before joining the euro (faint) and after
    let pre = '', post = '', penPre = false, penPost = false, last = null;
    months.forEach((mm, i) => {
      const v = prem(k, mm);
      if (v == null) { penPre = penPost = false; return; }
      const pt = `${xs(tMonth(mm)).toFixed(1)},${ys(v).toFixed(1)}`;
      const euro = inEuro(k, mm);
      if (euro) { post += (penPost ? 'L' : 'M') + pt; penPost = true; if (penPre) { pre += 'L' + pt; } penPre = false; }
      else { pre += (penPre ? 'L' : 'M') + pt; penPre = true; penPost = false; }
      last = [mm, v];
    });
    if (pre) svg.append(S('path', { d: pre, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-opacity': 0.35, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (post) svg.append(S('path', { d: post, fill: 'none', stroke: col, 'stroke-width': k === state.country ? 2.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (last && last[0] === to) {
      svg.append(S('circle', { cx: xs(tMonth(to)), cy: ys(last[1]), r: 4, fill: col, stroke: css('--surface'), 'stroke-width': 2 }));
      ends.push({ k, y: ys(last[1]), v: last[1] });
    }
  }
  if (!narrow) {
    // the selected country is labelled first; others only where they do not touch a placed label
    const placed = [];
    for (const e of [...ends].sort((a, b) => (b.k === state.country) - (a.k === state.country))) {
      if (placed.some(y => Math.abs(y - e.y) < 14)) continue;
      placed.push(e.y);
      svg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [cname(e.k) + ' ', S('tspan', { text: String(Math.round(e.v)) })]));
    }
  }
  holder.append(svg);

  // ECB deposit rate (step line, daily) with annual inflation (monthly) on the same % axis
  const RH = narrow ? 200 : 230;
  const k0 = state.country;
  const dayFrom = months[0] + '-01';
  const inflMonths = monthsIn(from, lastInfl() > to ? lastInfl() : to);
  const lines = [
    { id: 'ea', name: 'Inflación zona euro', color: css('--muted'), v: mm => infl('U2', mm) },
    ...(k0 !== 'U2' ? [{ id: 'cty', name: `Inflación ${cname(k0)}`, color: colorOf(k0), v: mm => infl(k0, mm) }] : []),
  ];
  const rv = [rateAt(state.D.rates.dfr, dayFrom) ?? 0, ...state.D.rates.dfr.filter(([d]) => d >= dayFrom).map(r => r[1]),
    ...lines.flatMap(l => inflMonths.map(l.v).filter(v => v != null))];
  let rlo = Math.min(0, ...rv), rhi = Math.max(1, ...rv);
  const rstep = niceStep(rhi - rlo, 4); rlo = Math.floor(rlo / rstep) * rstep; rhi = Math.ceil(rhi / rstep) * rstep;
  const rys = v => m.t + (rhi - v) / (rhi - rlo) * (RH - m.t - m.b);
  const rsvg = S('svg', { viewBox: `0 0 ${W} ${RH}`, height: RH, role: 'img', 'aria-label': `Tipo de depósito del BCE e inflación de ${cname(k0)} y de la zona euro` });
  for (let v = rlo; v <= rhi + 1e-9; v += rstep) {
    rsvg.append(S('line', { x1: m.l, x2: W - m.r, y1: rys(v), y2: rys(v), class: Math.abs(v) < 1e-9 ? 'zero-line' : 'grid-line' }));
    rsvg.append(S('text', { x: m.l - 6, y: rys(v) + 4, 'text-anchor': 'end', class: 'tick', text: nf2.format(v).replace(/,00$/, '') }));
  }
  // the ECB's 2 % inflation target as a labelled hairline
  if (2 >= rlo && 2 <= rhi) rsvg.append(S('line', { x1: m.l, x2: W - m.r, y1: rys(2), y2: rys(2), class: 'target-line' }));
  axisYears(rsvg, t0, t1, xs, RH, m);
  const rEnds = [];
  for (const l of lines) {
    let d = '', pen = false, last = null;
    for (const mm of inflMonths) {
      const v = l.v(mm);
      if (v == null) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${xs(tMonth(mm)).toFixed(1)},${rys(v).toFixed(1)}`; pen = true; last = v;
    }
    rsvg.append(S('path', { d, fill: 'none', stroke: l.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (last != null) rEnds.push({ name: l.id === 'ea' ? 'Zona euro' : cname(k0), v: last, y: rys(last), unit: '%' });
  }
  let v = rateAt(state.D.rates.dfr, dayFrom);
  let dd = `M${m.l},${rys(v ?? 0).toFixed(1)}`;
  for (const [day, x] of state.D.rates.dfr) {
    const t = tDay(day);
    if (day < dayFrom || t > t1) continue;
    dd += `H${xs(t).toFixed(1)}V${rys(x).toFixed(1)}`; v = x;
  }
  dd += `H${(W - m.r).toFixed(1)}`;
  rsvg.append(S('path', { d: dd, fill: 'none', stroke: css('--ink'), 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  rEnds.push({ name: 'Depósito BCE', v, y: rys(v) });
  if (!narrow) {
    // three labels at most: spread them just enough to stay legible, keeping their order
    rEnds.sort((a, b) => a.y - b.y);
    for (let i = 1; i < rEnds.length; i++) if (rEnds[i].y - rEnds[i - 1].y < 14) rEnds[i].y = rEnds[i - 1].y + 14;
    for (const e of rEnds) rsvg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [e.name + ' ', S('tspan', { text: nf1.format(e.v) })]));
  }
  rh.append(rsvg);
  const key = $('ratesKey'); clear(key);
  key.append(el('span', {}, [el('i', { style: `background:${css('--ink')};height:2.5px` }), 'Tipo de depósito del BCE']));
  for (const l of lines) key.append(el('span', {}, [el('i', { style: `background:${l.color}` }), l.name]));
  key.append(el('span', {}, [el('i', { style: `background:${css('--muted')};height:1px;opacity:.6` }), 'Objetivo de inflación del BCE (2 %)']));
  key.append(el('span', { text: 'Tramo más claro en la prima: antes de que el país adoptara el euro.' }));

  // shared crosshair
  const guides = [svg, rsvg].map(s => { const g = S('line', { class: 'guide', visibility: 'hidden' }); s.append(g); return g; });
  let cur = months.length - 1;
  const at = (i, ev) => {
    cur = Math.max(0, Math.min(months.length - 1, i));
    const mm = months[cur], x = xs(tMonth(mm));
    guides.forEach((g, j) => { g.setAttribute('x1', x); g.setAttribute('x2', x); g.setAttribute('y1', m.t); g.setAttribute('y2', (j ? RH : H) - m.b); g.setAttribute('visibility', 'visible'); });
    const r = svg.getBoundingClientRect();
    const e = ev || { clientX: r.left + x * r.width / W, clientY: r.top + 30 };
    showTip(e, t => {
      t.append(el('div', { class: 'h', text: mLong(mm) }));
      state.active.map(k => [k, prem(k, mm)]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => t.append(tipRow(colorOf(k), cname(k) + (inEuro(k, mm) ? '' : ' (antes del euro)'), bp(v))));
      t.append(el('div', { class: 'sep' }));
      const day = mm + '-15', dep = rateAt(state.D.rates.dfr, day), ea = infl('U2', mm), ci = infl(k0, mm);
      t.append(tipRow(css('--ink'), 'Depósito BCE', pct(dep)));
      t.append(tipRow(css('--muted'), 'Inflación zona euro', pct1(ea)));
      if (k0 !== 'U2') t.append(tipRow(colorOf(k0), `Inflación ${cname(k0)}`, pct1(ci)));
      if (dep != null && ea != null) t.append(tipRow('transparent', 'Tipo real (depósito − inflación zona euro)', pct1(dep - ea)));
    });
  };
  const near = (ev, s, w) => { const r = s.getBoundingClientRect(); const px = (ev.clientX - r.left) * w / r.width; let b = 0, bd = 1e12; months.forEach((mm, i) => { const d = Math.abs(xs(tMonth(mm)) - px); if (d < bd) { bd = d; b = i; } }); return b; };
  for (const [s, h] of [[svg, H], [rsvg, RH]]) {
    const hit = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: h - m.t - m.b, class: 'hit', tabindex: 0, 'aria-label': 'Valores por mes; usa las flechas izquierda y derecha' });
    hit.onpointermove = ev => at(near(ev, s, W), ev);
    hit.onpointerleave = () => { hideTip(); guides.forEach(g => g.setAttribute('visibility', 'hidden')); };
    hit.onkeydown = ev => { if (ev.key === 'ArrowLeft') { at(cur - 1); ev.preventDefault(); } if (ev.key === 'ArrowRight') { at(cur + 1); ev.preventDefault(); } };
    hit.onblur = () => { hideTip(); guides.forEach(g => g.setAttribute('visibility', 'hidden')); };
    s.append(hit);
  }

  // table view
  const det = $('trendTable'); [...det.children].slice(1).forEach(c => c.remove());
  const rows = months.slice(-24).reverse();
  const tbl = el('table', { class: 't' }, [
    el('thead', {}, [el('tr', {}, [el('th', { text: 'Mes' }), ...state.active.map(k => el('th', { text: `${cname(k)} (pb)` })), el('th', { text: 'Depósito BCE' }), el('th', { text: `Inflación ${cname(k0)}` }), el('th', { text: 'Inflación zona euro' })])]),
    el('tbody', {}, rows.map(mm => el('tr', {}, [el('td', { text: mShort(mm) }), ...state.active.map(k => el('td', { text: bp(prem(k, mm)) })), el('td', { text: pct(rateAt(state.D.rates.dfr, mm + '-15')) }), el('td', { text: pct1(infl(k0, mm)) }), el('td', { text: pct1(infl('U2', mm)) })]))),
  ]);
  det.append(el('div', { class: 'table-wrap' }, [tbl]));
}

// ---------- map + ranking (same month) ----------
const mapLast = () => METRIC[state.metric].last();
const mapMonthNow = () => { const L = mapLast(); return state.mapMonth && state.mapMonth <= L ? state.mapMonth : L; };
const metricHint = () => state.metric === 'infl' ? 'inflación anual (IPCA) · objetivo del BCE: 2 %' : `prima frente a ${refName()}`;

function renderMap() {
  const card = $('mapCard'); clear(card);
  const isPrima = state.metric === 'prima', MT = METRIC[state.metric];
  const M = state.map, all = monthsIn('1999-01', mapLast());
  const mm = mapMonthNow();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: `Mapa · ${mLong(mm)}` }), el('span', { class: 'hint', text: metricHint() })]));
  const mseg = el('div', { class: 'seg scale-seg', role: 'group', 'aria-label': 'Qué muestra el mapa' });
  for (const [k, n] of [['prima', 'Prima de riesgo'], ['infl', 'Inflación']]) {
    const b = el('button', { 'aria-pressed': String(state.metric === k), text: n });
    b.onclick = () => { state.metric = k; writeHash(); renderMap(); renderRank(); };
    mseg.append(b);
  }
  card.append(mseg);
  const ctl = el('div', { class: 'map-ctl' });
  const play = el('button', { class: 'play', 'aria-label': state.playing ? 'Pausar' : 'Reproducir la evolución', text: state.playing ? '❚❚' : '▶' });
  const slider = el('input', { type: 'range', min: 0, max: all.length - 1, value: all.indexOf(mm), 'aria-label': 'Mes del mapa', 'aria-valuetext': mLong(mm) });
  const lbl = el('span', { class: 'month', text: mShort(mm) });
  ctl.append(play, slider, lbl);
  card.append(ctl);
  const seg = el('div', { class: 'seg scale-seg', role: 'group', 'aria-label': 'Escala de colores' });
  for (const [k, n] of [['mes', 'Escala de este mes'], ['fija', 'Comparable en el tiempo']]) {
    const b = el('button', { 'aria-pressed': String(state.scale === k), text: n });
    b.onclick = () => { state.scale = k; renderMap(); };
    seg.append(b);
  }
  card.append(seg);
  slider.oninput = () => { stop(); state.mapMonth = all[+slider.value]; renderMap(); renderRank(); };
  play.onclick = () => {
    if (state.playing) { stop(); renderMap(); return; }
    // playback only makes sense on a scale that stays the same from month to month
    state.scale = 'fija';
    if (mapMonthNow() === mapLast()) state.mapMonth = '2007-01';
    state.playing = setInterval(() => {
      const i = all.indexOf(state.mapMonth);
      if (i >= all.length - 1) { stop(); renderMap(); return; }
      state.mapMonth = all[i + 1]; renderMap(); renderRank();
    }, 120);
    renderMap();
  };

  scale = makeScale(Object.keys(state.D.countries).filter(k => !isPrima || k !== state.vs).map(k => MT.val(k, mm)).filter(v => v != null), state.metric);
  // framed on the euro area members
  const svg = S('svg', { viewBox: M.focus.join(' '), class: 'map-svg', role: 'group', 'aria-label': `Mapa: ${isPrima ? 'prima de riesgo' : 'inflación'}, ${mLong(mm)}` });
  for (const [code, c] of Object.entries(M.countries)) {
    if (state.D.countries[code]) continue;
    svg.append(S('path', { d: c.d, class: 'ctx' }));
  }
  for (const code of Object.keys(state.D.countries)) {
    const c = M.countries[code]; if (!c) continue;
    const isRef = isPrima && code === state.vs;
    const v = MT.val(code, mm);
    const p = S('path', { d: c.d, class: 'cty' + (code === state.country ? ' sel' : '') + (isRef ? ' ref' : '') + (v == null ? ' nodata' : ''),
      fill: isRef ? null : v == null ? null : fillOf(v), tabindex: 0, role: 'button',
      'aria-label': `${cname(code)}: ${isRef ? 'referencia' : v == null ? 'sin datos' : MT.full(v)}` });
    const tipF = e => showTip(e, t => {
      t.append(el('div', { class: 'h', text: `${cname(code)} · ${mShort(mm)}` }));
      if (isRef) t.append(el('div', { text: 'Referencia (0 pb)' }));
      else if (v == null) t.append(el('div', { text: 'Sin datos ese mes' }));
      else if (isPrima) {
        t.append(tipRow(fillOf(v), 'Prima', bp(v)));
        t.append(tipRow(css('--axis'), 'Bono a 10 años', pct(byMonth[code].get(mm))));
        t.append(tipRow(css('--axis'), 'Inflación', pct1(infl(code, mm))));
        if (!inEuro(code, mm)) t.append(el('div', { class: 'h', text: 'Aún no usaba el euro' }));
      } else {
        t.append(tipRow(fillOf(v), 'Inflación anual', pct1(v)));
        t.append(tipRow(css('--axis'), 'Zona euro', pct1(infl('U2', mm))));
        const pr = prem(code, mm);
        if (pr != null && code !== state.vs) t.append(tipRow(css('--axis'), 'Prima de riesgo', bp(pr)));
      }
    });
    p.onpointermove = tipF; p.onpointerleave = hideTip;
    p.onclick = () => { if (!isRef) setCountry(code); };
    p.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && !isRef) { e.preventDefault(); setCountry(code); } };
    svg.append(p);
    // Malta is a few pixels wide: ring it and give it a pointer target big enough to hit
    if (code === 'MT') {
      const [x, y] = c.d.slice(1).split('l')[0].split(' ').map(Number);
      const ring = S('circle', { cx: x - 2, cy: y - 1, r: 11, class: 'small-ring' });
      ring.onpointermove = tipF; ring.onpointerleave = hideTip; ring.onclick = p.onclick;
      svg.append(ring);
    }
  }
  // the selected country on top so its outline is not hidden by neighbours
  const sel = svg.querySelector('.cty.sel'); if (sel) svg.append(sel);
  card.append(el('div', { class: 'map-wrap' }, [svg]));
  // gradient legend with ticks placed on the same scale as the fills
  const stops = Array.from({ length: 13 }, (_, i) => `${heat(i / 12)} ${(i / 12 * 100).toFixed(1)}%`).join(', ');
  const tickTxt = t => (isPrima ? String(Math.round(t)) : nf1.format(t).replace(/,0$/, ''));
  const ticks = el('div', { class: 'ramp-ticks' }, scale.ticks.map((t, i) => el('span', { style: `left:${(scale.pos(t) * 100).toFixed(1)}%`, class: i === 0 ? 'first' : i === scale.ticks.length - 1 ? 'last' : '', text: `${tickTxt(t)}${i === scale.ticks.length - 1 && scale.kind === 'fija' ? '+' : ''}` })));
  const what = isPrima ? 'Prima en pb' : 'Inflación anual en %, desde el objetivo del 2 %';
  const ramp = el('div', { class: 'ramp-box' }, [el('div', { class: 'ramp-title', text: `${what}${scale.kind === 'mes' ? ' · escala ajustada a este mes' : ' · misma escala todos los meses'}` }),
    el('div', { class: 'ramp', style: `background:linear-gradient(90deg, ${stops})` }), ticks]);
  card.append(ramp);
  const lg = el('div', { class: 'map-legend' });
  const below = isPrima ? `Por debajo de la referencia (hasta −${scale.neg} pb)` : `Por debajo del 2 % (hasta ${nf1.format(2 - scale.neg)} %)`;
  lg.append(el('span', {}, [el('i', { style: `background:linear-gradient(90deg, ${cold(0.15)}, ${cold(1)})` }), below]));
  if (isPrima) lg.append(el('span', {}, [el('i', { class: 'ref-key' }), state.vs === 'DE' ? 'Alemania (referencia)' : 'Referencia: media zona euro']));
  lg.append(el('span', {}, [el('i', { class: 'ctx-key' }), 'Fuera del euro o sin datos']));
  card.append(lg);
  card.append(el('p', { class: 'note', text: `${M.source} Pulsa un país para verlo en detalle; ▶ reproduce la evolución desde 2007 con la escala comparable.` }));
}
function stop() { if (state.playing) { clearInterval(state.playing); state.playing = null; } }

function renderRank() {
  const card = $('rankCard'); clear(card);
  const isPrima = state.metric === 'prima', MT = METRIC[state.metric];
  const mm = mapMonthNow();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Clasificación' }), el('span', { class: 'hint', text: `${mLong(mm)} · ${isPrima ? 'pb frente a ' + refName() : 'inflación anual, %'}` })]));
  const rows = Object.keys(state.D.countries).filter(k => !isPrima || k !== state.vs).map(k => [k, MT.val(k, mm)]).filter(r => r[1] != null).sort((a, b) => b[1] - a[1]);
  if (!rows.length) { card.append(el('p', { class: 'note', text: 'Sin datos para ese mes.' })); return; }
  const mx = Math.max(...rows.map(r => r[1]), 1), mn = Math.min(0, ...rows.map(r => r[1]));
  const span = mx - mn, zero = -mn / span * 100;
  const box = el('div', { class: 'rank' });
  for (const [k, v] of rows) {
    const w = Math.abs(v) / span * 100;
    const bar = el('div', { class: 'bar ' + (v >= 0 ? 'pos' : 'neg'), style: (v >= 0 ? `left:${zero}%;width:${w}%` : `left:${zero - w}%;width:${w}%`) + (scale ? `;background:${fillOf(v)}` : '') });
    const b = el('button', { class: k === state.country ? 'on' : '', title: `Ver ${cname(k)}` }, [el('span', { class: 'nm', text: cname(k) }),
      el('span', { class: 'track' }, [el('span', { class: 'zero', style: `left:${zero}%` }), bar]), el('span', { class: 'val', text: MT.fmt(v) })]);
    b.onclick = () => setCountry(k);
    box.append(b);
  }
  card.append(box);
  if (!isPrima) card.append(el('p', { class: 'note', text: `Zona euro: ${pct1(infl('U2', mm))}. Fuente: Eurostat.` }));
  if (mm !== mapLast()) card.append(el('p', { class: 'note', text: 'Mes elegido en el mapa. Mueve el control al final para ver el último dato.' }));
}

// ---------- ECB decisions and the premium around them ----------
function renderDecisions() {
  const card = $('decCard'); clear(card);
  const k = state.country, from = rangeStart();
  const L = lastMonth();
  const dec = [];
  const r = state.D.rates.dfr;
  for (let i = 1; i < r.length; i++) {
    const [d, v] = r[i], ch = (v - r[i - 1][1]) * 100;
    if (d.slice(0, 7) < from || d < '1999-02-01') continue;
    const before = addMonths(d.slice(0, 7), -1), after = addMonths(d.slice(0, 7), 3);
    const pb = prem(k, before), pa = after <= L ? prem(k, after) : null;
    dec.push({ d, v, ch, pb, pa });
  }
  dec.reverse();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Decisiones del BCE' }), el('span', { class: 'hint', text: `prima de ${cname(k)}: mes anterior y 3 meses después` })]));
  const avg = sel => { const xs = dec.filter(sel).filter(x => x.pb != null && x.pa != null).map(x => x.pa - x.pb); return xs.length ? [xs.reduce((a, b) => a + b, 0) / xs.length, xs.length] : null; };
  const up = avg(x => x.ch > 0), down = avg(x => x.ch < 0);
  card.append(el('div', { class: 'summary' }, [
    el('div', {}, [el('b', { text: up ? sbp(up[0]) : '–' }), el('span', { text: up ? `de media tras ${up[1]} subidas` : 'sin subidas en el periodo' })]),
    el('div', {}, [el('b', { text: down ? sbp(down[0]) : '–' }), el('span', { text: down ? `de media tras ${down[1]} bajadas` : 'sin bajadas en el periodo' })]),
  ]));
  const shown = state.decAll ? dec : dec.slice(0, 10);
  const tbl = el('table', { class: 't' }, [
    el('thead', {}, [el('tr', {}, ['Fecha', 'Depósito', 'Cambio', 'Prima antes', '3 meses después', 'Variación'].map(t => el('th', { text: t })))]),
    el('tbody', {}, shown.map(x => el('tr', {}, [el('td', { text: dLong(x.d) }), el('td', { text: pct(x.v) }),
      el('td', {}, [el('span', { class: 'arrow', 'aria-hidden': 'true', text: x.ch > 0 ? '▲' : '▼' }), sbp(x.ch)]),
      el('td', { text: bp(x.pb) }), el('td', { text: x.pa == null ? 'aún no' : bp(x.pa) }), el('td', { text: x.pb != null && x.pa != null ? sbp(x.pa - x.pb) : '–' })]))),
  ]);
  card.append(el('div', { class: 'table-wrap' }, [tbl]));
  if (dec.length > 10) { const b = el('button', { class: 'show-more', text: state.decAll ? 'Mostrar menos' : `Mostrar las ${dec.length}` }); b.onclick = () => { state.decAll = !state.decAll; renderDecisions(); }; card.append(b); }
  card.append(el('p', { class: 'note', text: 'Muestra lo que pasó, no por qué: en esos meses influyen muchos otros factores. El periodo elegido arriba filtra las decisiones.' }));
}

// ---------- routing, theme ----------
function writeHash() {
  const h = `#${state.country}?vs=${state.vs}&r=${state.range}&c=${state.active.join(',')}${state.metric === 'infl' ? '&v=infl' : ''}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}
function readHash() {
  const [k, qs] = location.hash.slice(1).split('?');
  const p = new URLSearchParams(qs || '');
  if (p.get('vs') === 'U2' || p.get('vs') === 'DE') state.vs = p.get('vs');
  if (RANGES.some(r => r[0] === p.get('r'))) state.range = p.get('r');
  if (k && state.D.countries[k] && k !== state.vs) state.country = k;
  if (/^\d{4}-\d{2}$/.test(p.get('m') || '') && p.get('m') >= '1999-01' && p.get('m') <= lastMonth()) state.mapMonth = p.get('m');
  if (p.get('s') === 'fija' || p.get('s') === 'mes') state.scale = p.get('s');
  if (p.get('v') === 'infl' || p.get('v') === 'prima') state.metric = p.get('v');
  const c = (p.get('c') || '').split(',').filter(x => state.D.countries[x] && x !== state.vs);
  if (c.length) state.active = c.slice(0, 8);
  if (!state.active.includes(state.country)) state.active.unshift(state.country);
}
function renderAll() { renderHero(); renderMap(); renderRank(); renderTrend(); renderDecisions(); }
$('theme').onclick = () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  renderAll();
};
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderTrend, 150); });

(async () => {
  const [D, map] = await Promise.all(['data/primometro.json', 'data/mapa-europa.json'].map(u => fetch(u, { cache: 'no-cache' }).then(r => r.json())));
  state.D = D; state.map = map; prep(D);
  readHash(); buildControls(); renderAll(); writeHash();
  $('upd').textContent = `Datos actualizados el ${new Date(D.updated).toLocaleDateString('es-ES')}; último mes publicado por el BCE: ${mLong(lastMonth())}.`;
})();
