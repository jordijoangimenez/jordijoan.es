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
const state = { D: null, map: null, country: 'ES', vs: 'DE', range: '2007', active: ['ES', 'IT', 'FR', 'PT'], slot: {}, mapMonth: null, playing: null, decAll: false };

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
function prep(D) {
  byMonth = {};
  for (const [k, rows] of Object.entries(D.yields)) byMonth[k] = new Map(rows);
}
const lastMonth = () => state.D.yields.DE.at(-1)[0];
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
const CLASSES = [[-Infinity, -50, 'Más de 50 pb por debajo'], [-50, 0, 'Hasta 50 pb por debajo'], [0, 50, '0–50 pb'], [50, 100, '50–100 pb'], [100, 200, '100–200 pb'], [200, 500, '200–500 pb'], [500, Infinity, '500 pb o más']];
const RAMP = {
  light: ['#4687d8', '#8ab4ea', '#ee9f87', '#e28061', '#d0603d', '#b64118', '#962a00'],
  dark: ['#69a1e8', '#3f6aa1', '#914f2f', '#b36139', '#d77343', '#ee8f63', '#feb391'],
};
const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
const classOf = v => CLASSES.findIndex(([a, b]) => v >= a && v < b);
const fillOf = v => RAMP[isDark() ? 'dark' : 'light'][classOf(v)];

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
    ends.sort((a, b) => a.y - b.y);
    let py = -99;
    for (const e of ends) if (e.y - py >= 14) { py = e.y; svg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [cname(e.k) + ' ', S('tspan', { text: String(Math.round(e.v)) })])); }
  }
  holder.append(svg);

  // ECB rates chart: step lines on the same time axis
  const RH = narrow ? 150 : 170;
  const series = [['dfr', 'Depósito', '--ink'], ['mro', 'Operaciones principales', '--muted']];
  const dayFrom = months[0] + '-01', dayTo = new Date().toISOString().slice(0, 10);
  const rv = series.flatMap(([k]) => [rateAt(state.D.rates[k], dayFrom) ?? 0, ...state.D.rates[k].filter(([d]) => d >= dayFrom).map(r => r[1])]);
  let rlo = Math.min(0, ...rv), rhi = Math.max(1, ...rv);
  const rstep = niceStep(rhi - rlo, 3); rlo = Math.floor(rlo / rstep) * rstep; rhi = Math.ceil(rhi / rstep) * rstep;
  const rys = v => m.t + (rhi - v) / (rhi - rlo) * (RH - m.t - m.b);
  const rsvg = S('svg', { viewBox: `0 0 ${W} ${RH}`, height: RH, role: 'img', 'aria-label': 'Tipos de interés oficiales del BCE' });
  for (let v = rlo; v <= rhi + 1e-9; v += rstep) {
    rsvg.append(S('line', { x1: m.l, x2: W - m.r, y1: rys(v), y2: rys(v), class: Math.abs(v) < 1e-9 ? 'zero-line' : 'grid-line' }));
    rsvg.append(S('text', { x: m.l - 6, y: rys(v) + 4, 'text-anchor': 'end', class: 'tick', text: nf2.format(v).replace(/,00$/, '') }));
  }
  axisYears(rsvg, t0, t1, xs, RH, m);
  const tEnd = t1;
  const rEnds = [];
  for (const [k, , c] of series) {
    let v = rateAt(state.D.rates[k], dayFrom);
    let d = `M${m.l},${rys(v ?? 0).toFixed(1)}`;
    for (const [day, x] of state.D.rates[k]) {
      const t = tDay(day);
      if (day < dayFrom || t > tEnd) continue;
      d += `H${xs(t).toFixed(1)}V${rys(x).toFixed(1)}`; v = x;
    }
    d += `H${(W - m.r).toFixed(1)}`;
    rsvg.append(S('path', { d, fill: 'none', stroke: css(c), 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    rEnds.push({ k, v, y: rys(v) });
  }
  if (!narrow) {
    // two labels only: if they would touch, put the higher rate above and the lower below
    const [a, b] = [...rEnds].sort((p, q) => p.y - q.y);
    if (b.y - a.y < 14) { const mid = (a.y + b.y) / 2; a.y = mid - 7; b.y = mid + 7; }
    for (const e of rEnds) rsvg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [(e.k === 'dfr' ? 'Depósito ' : 'Principal '), S('tspan', { text: nf2.format(e.v) })]));
  }
  rh.append(rsvg);
  const key = $('ratesKey'); clear(key);
  for (const [, n, c] of series) key.append(el('span', {}, [el('i', { style: `background:${css(c)}` }), n]));
  key.append(el('span', { text: 'Tramo más claro: antes de que el país adoptara el euro.' }));

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
      const day = mm + '-15';
      t.append(tipRow(css('--ink'), 'Depósito BCE', pct(rateAt(state.D.rates.dfr, day))));
      t.append(tipRow(css('--muted'), 'Op. principales', pct(rateAt(state.D.rates.mro, day))));
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
    el('thead', {}, [el('tr', {}, [el('th', { text: 'Mes' }), ...state.active.map(k => el('th', { text: cname(k) })), el('th', { text: 'Depósito BCE' })])]),
    el('tbody', {}, rows.map(mm => el('tr', {}, [el('td', { text: mShort(mm) }), ...state.active.map(k => el('td', { text: bp(prem(k, mm)) })), el('td', { text: pct(rateAt(state.D.rates.dfr, mm + '-15')) })]))),
  ]);
  det.append(el('div', { class: 'table-wrap' }, [tbl]));
}

// ---------- map + ranking (same month) ----------
function renderMap() {
  const card = $('mapCard'); clear(card);
  const M = state.map, all = monthsIn('1999-01', lastMonth());
  const mm = state.mapMonth || lastMonth();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: `Mapa · ${mLong(mm)}` }), el('span', { class: 'hint', text: `prima frente a ${refName()}` })]));
  const ctl = el('div', { class: 'map-ctl' });
  const play = el('button', { class: 'play', 'aria-label': state.playing ? 'Pausar' : 'Reproducir la evolución', text: state.playing ? '❚❚' : '▶' });
  const slider = el('input', { type: 'range', min: 0, max: all.length - 1, value: all.indexOf(mm), 'aria-label': 'Mes del mapa', 'aria-valuetext': mLong(mm) });
  const lbl = el('span', { class: 'month', text: mShort(mm) });
  ctl.append(play, slider, lbl);
  card.append(ctl);
  slider.oninput = () => { stop(); state.mapMonth = all[+slider.value]; renderMap(); renderRank(); };
  play.onclick = () => {
    if (state.playing) { stop(); renderMap(); return; }
    if ((state.mapMonth || lastMonth()) === lastMonth()) state.mapMonth = '2007-01';
    state.playing = setInterval(() => {
      const i = all.indexOf(state.mapMonth);
      if (i >= all.length - 1) { stop(); renderMap(); return; }
      state.mapMonth = all[i + 1]; renderMap(); renderRank();
    }, 120);
    renderMap();
  };

  // framed on the euro area members
  const svg = S('svg', { viewBox: M.focus.join(' '), class: 'map-svg', role: 'group', 'aria-label': `Mapa de la prima de riesgo, ${mLong(mm)}` });
  for (const [code, c] of Object.entries(M.countries)) {
    const has = state.D.countries[code] || code === state.vs;
    if (has) continue;
    svg.append(S('path', { d: c.d, class: 'ctx' }));
  }
  for (const code of Object.keys(state.D.countries)) {
    const c = M.countries[code]; if (!c) continue;
    const isRef = code === state.vs;
    const v = isRef ? 0 : prem(code, mm);
    const p = S('path', { d: c.d, class: 'cty' + (code === state.country ? ' sel' : '') + (isRef ? ' ref' : '') + (v == null ? ' nodata' : ''),
      fill: isRef ? null : v == null ? null : fillOf(v), tabindex: 0, role: 'button',
      'aria-label': `${cname(code)}: ${isRef ? 'referencia' : v == null ? 'sin datos' : bp(v)}` });
    const tipF = e => showTip(e, t => {
      t.append(el('div', { class: 'h', text: `${cname(code)} · ${mShort(mm)}` }));
      if (isRef) t.append(el('div', { text: 'Referencia (0 pb)' }));
      else if (v == null) t.append(el('div', { text: 'Sin datos ese mes' }));
      else {
        t.append(tipRow(fillOf(v), 'Prima', bp(v)));
        t.append(tipRow(css('--axis'), 'Bono a 10 años', pct(byMonth[code].get(mm))));
        if (!inEuro(code, mm)) t.append(el('div', { class: 'h', text: 'Aún no usaba el euro' }));
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
  const lg = el('div', { class: 'map-legend' });
  CLASSES.forEach(([, , n], i) => lg.append(el('span', {}, [el('i', { style: `background:${RAMP[isDark() ? 'dark' : 'light'][i]}` }), n])));
  lg.append(el('span', {}, [el('i', { class: 'ref-key' }), state.vs === 'DE' ? 'Alemania (referencia)' : 'Referencia: media zona euro']));
  lg.append(el('span', {}, [el('i', { class: 'ctx-key' }), 'Fuera del euro o sin datos']));
  card.append(lg);
  card.append(el('p', { class: 'note', text: `${M.source} Pulsa un país para verlo en detalle; ▶ reproduce la evolución desde 2007.` }));
}
function stop() { if (state.playing) { clearInterval(state.playing); state.playing = null; } }

function renderRank() {
  const card = $('rankCard'); clear(card);
  const mm = state.mapMonth || lastMonth();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Clasificación' }), el('span', { class: 'hint', text: `${mLong(mm)} · pb frente a ${refName()}` })]));
  const rows = Object.keys(state.D.countries).filter(k => k !== state.vs).map(k => [k, prem(k, mm)]).filter(r => r[1] != null).sort((a, b) => b[1] - a[1]);
  if (!rows.length) { card.append(el('p', { class: 'note', text: 'Sin datos para ese mes.' })); return; }
  const mx = Math.max(...rows.map(r => r[1]), 1), mn = Math.min(0, ...rows.map(r => r[1]));
  const span = mx - mn, zero = -mn / span * 100;
  const box = el('div', { class: 'rank' });
  for (const [k, v] of rows) {
    const w = Math.abs(v) / span * 100;
    const bar = el('div', { class: 'bar ' + (v >= 0 ? 'pos' : 'neg'), style: v >= 0 ? `left:${zero}%;width:${w}%` : `left:${zero - w}%;width:${w}%` });
    const b = el('button', { class: k === state.country ? 'on' : '', title: `Ver ${cname(k)}` }, [el('span', { class: 'nm', text: cname(k) }),
      el('span', { class: 'track' }, [el('span', { class: 'zero', style: `left:${zero}%` }), bar]), el('span', { class: 'val', text: String(Math.round(v)) })]);
    b.onclick = () => setCountry(k);
    box.append(b);
  }
  card.append(box);
  if (mm !== lastMonth()) card.append(el('p', { class: 'note', text: 'Mes elegido en el mapa. Mueve el control al final para ver el último dato.' }));
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
  const h = `#${state.country}?vs=${state.vs}&r=${state.range}&c=${state.active.join(',')}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}
function readHash() {
  const [k, qs] = location.hash.slice(1).split('?');
  const p = new URLSearchParams(qs || '');
  if (p.get('vs') === 'U2' || p.get('vs') === 'DE') state.vs = p.get('vs');
  if (RANGES.some(r => r[0] === p.get('r'))) state.range = p.get('r');
  if (k && state.D.countries[k] && k !== state.vs) state.country = k;
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
