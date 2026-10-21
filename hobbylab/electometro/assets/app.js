const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const KIND = {
  congreso: 'Congreso', 'congreso-ccaa': 'Congreso (circunscripción)', autonomicas: 'Autonómicas', municipales: 'Municipales',
  forales: 'Forales', cabildo: 'Cabildos', consell: 'Consells', europeas: 'Europeas', legislativas: 'Elecciones nacionales',
  presidenciales: 'Presidenciales', regionales: 'Regionales',
};
const fmt = (v, d = 1) => v == null ? '–' : v.toFixed(d).replace('.', ',');
const fdate = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const FALLBACK = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#e34948', '#008300'];

function el(tag, attrs = {}, kids = []) {
  const e = tag === 'svg' || attrs.svg ? document.createElementNS(NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'svg' || v == null) continue;
    if (k === 'text') e.textContent = v; else if (k === 'class') e.setAttribute('class', v); else e.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) if (c != null) e.append(c);
  return e;
}
const S = (tag, attrs, kids) => el(tag, { ...attrs, svg: 1 }, kids);
const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); };

const state = { index: null, doc: null, scope: 'cycle', hidden: new Set(), showAll: false, tab: 'all', q: '' };
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

// ---------- theme ----------
$('theme').onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  if (state.doc) render();
};
try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}

// ---------- data ----------
async function getJson(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }

async function load(id, coal = []) {
  document.body.classList.add('loading');
  try {
    state.doc = await getJson(`data/e/${id}.json`);
    state.hidden = new Set();
    state.showAll = false;
    state.coal = new Set(coal.filter(k => state.doc.parties[k])); state.allMins = false;
    render();
    $('pval').textContent = label(state.index.elections.find(e => e.id === id) || state.doc);
  } catch (err) {
    $('hero').textContent = 'No se pudo cargar esta elección.';
  }
  document.body.classList.remove('loading');
}
const label = e => (e.kind === 'congreso' || e.kind === 'legislativas' || e.kind === 'europeas' || e.kind === 'presidenciales' || e.kind === 'congreso-ccaa' || e.kind === 'autonomicas' || e.kind === 'regionales')
  ? `${e.name} · ${KIND[e.kind] || e.kind}` : `${e.name} · ${KIND[e.kind] || e.kind}`;

// ---------- picker ----------
// Three pages share this script: España (index.html), Autonómicas and Internacional
const SECTION = document.body.dataset.section || 'es';
const inSection = e => SECTION === 'es' ? e.country === 'es' && e.kind !== 'autonomicas' : SECTION === 'aut' ? e.kind === 'autonomicas' : e.country !== 'es';
const GROUPS = {
  es: [['Congreso de los Diputados', e => e.id === 'es-congreso'], ['Municipales', e => e.kind === 'municipales'],
    ['Forales, cabildos y consells', e => ['forales', 'cabildo', 'consell'].includes(e.kind)],
    ['Congreso por circunscripción', e => e.kind === 'congreso-ccaa'], ['Parlamento Europeo', e => e.kind === 'europeas']],
  aut: [['Parlamentos autonómicos', () => true]],
  intl: [['Elecciones nacionales', e => e.kind === 'legislativas' || e.kind === 'presidenciales'], ['Parlamento Europeo', e => e.kind === 'europeas'], ['Regionales y locales', e => e.kind === 'regionales' || e.kind === 'municipales']],
}[SECTION];
const defaultId = () => SECTION === 'es' ? 'es-congreso' : [...state.index.elections.filter(inSection)].sort((a, b) => b.total - a.total)[0].id;
function buildPicker() {
  const q = $('psearch').value.trim().toLowerCase();
  const list = $('plist'); clear(list);
  let any = false;
  for (const [name, f] of GROUPS) {
    const items = state.index.elections.filter(e => inSection(e) && f(e) && (!q || label(e).toLowerCase().includes(q)))
      .sort((a, b) => b.total - a.total).slice(0, q ? 60 : 40);
    if (!items.length) continue;
    any = true;
    list.append(el('li', { class: 'grp', role: 'presentation', text: name }));
    for (const e of items) {
      const li = el('li', { role: 'option', 'aria-selected': String(e.id === state.doc?.id), class: e.id === state.doc?.id ? 'current' : '' },
        [el('span', { text: label(e) }), el('span', { class: 'meta', text: `${e.total} enc.` })]);
      li.onclick = () => { location.hash = e.id; closePicker(); };
      list.append(li);
    }
  }
  if (!any) list.append(el('li', { class: 'empty', text: 'Sin resultados' }));
}
function closePicker() { $('ppanel').hidden = true; $('pbtn').setAttribute('aria-expanded', 'false'); }
$('pbtn').onclick = () => {
  const open = $('ppanel').hidden;
  $('ppanel').hidden = !open; $('pbtn').setAttribute('aria-expanded', String(open));
  if (open) { $('psearch').value = ''; buildPicker(); $('psearch').focus(); }
};
$('psearch').oninput = buildPicker;
document.addEventListener('click', e => { if (!e.target.closest('.picker')) closePicker(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });

$('scope-cycle').onclick = () => setScope('cycle');
$('scope-all').onclick = () => setScope('all');
function setScope(s) { state.scope = s; $('scope-cycle').setAttribute('aria-pressed', String(s === 'cycle')); $('scope-all').setAttribute('aria-pressed', String(s === 'all')); if (state.doc) render(); }

// ---------- helpers ----------
const pcol = (d, k, i = 0) => d.parties[k]?.c || FALLBACK[i % FALLBACK.length];
const pname = (d, k) => d.parties[k]?.n || k;

function cycleStartIdx(d) {
  const since = d.now?.since;
  if (state.scope === 'all' || !since) return 0;
  const i = d.series.t.findIndex(t => t > since);
  return i < 0 ? 0 : i;
}

// ---------- hemicycle ----------
const cur = { seats: [], hemi: null };
function applyCoal() {
  if (!cur.hemi) return;
  const on = state.coal && state.coal.size > 0;
  cur.hemi.classList.toggle('focus', on);
  cur.seats.forEach(c => c.classList.toggle('on', on && state.coal.has(c.dataset.k)));
}
function layout(N) {
  // rows of seats on concentric arcs; seats per row proportional to radius
  const rows = Math.max(2, Math.round(Math.sqrt(N / 3.2)));
  const r0 = 0.38, r1 = 1;
  const radii = Array.from({ length: rows }, (_, i) => rows === 1 ? r1 : r0 + (r1 - r0) * i / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  let counts = radii.map(r => Math.round(N * r / sum));
  let diff = N - counts.reduce((a, b) => a + b, 0);
  for (let i = rows - 1; diff !== 0; i = (i - 1 + rows) % rows) { counts[i] += Math.sign(diff); diff -= Math.sign(diff); }
  const pts = [];
  radii.forEach((r, ri) => {
    const n = counts[ri];
    for (let j = 0; j < n; j++) { const a = Math.PI * (1 - (n === 1 ? 0.5 : j / (n - 1))); pts.push({ a, r, x: Math.cos(a) * r, y: -Math.sin(a) * r }); }
  });
  pts.sort((p, q) => q.a - p.a || p.r - q.r);
  const rowGap = (r1 - r0) / Math.max(1, rows - 1);
  return { pts, rowGap };
}

function renderSeats(d) {
  const card = $('seatsCard'); clear(card);
  const sa = d.now?.seats;
  if (!sa) { card.hidden = true; $('grid').classList.add('no-seats'); return; }
  card.hidden = false; $('grid').classList.remove('no-seats');
  const N = sa.total;
  const order = [...sa.seats].sort((a, b) => (d.parties[a.k]?.pos ?? 2) - (d.parties[b.k]?.pos ?? 2) || b.s - a.s);
  const { pts, rowGap } = layout(N);
  const R = 300, pad = 14, rad = Math.min(11, Math.max(2.4, rowGap * R * 0.42));
  const W = 2 * R + 2 * pad, H = R + 2 * pad + 20;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Hemiciclo de ${N} escaños` });
  const seats = []; let idx = 0;
  const cols = {};
  order.forEach((s, i) => { cols[s.k] = pcol(d, s.k, i); });
  const g = S('g');
  for (const s of order) for (let i = 0; i < s.s && idx < pts.length; i++, idx++) {
    const p = pts[idx];
    const c = S('circle', { cx: pad + R + p.x * R, cy: pad + R + p.y * R, r: rad, fill: cols[s.k], class: 'seat', 'data-k': s.k });
    g.append(c); seats.push(c);
  }
  for (; idx < pts.length; idx++) { const p = pts[idx]; g.append(S('circle', { cx: pad + R + p.x * R, cy: pad + R + p.y * R, r: rad, fill: 'var(--unassigned)', class: 'seat' })); }
  svg.append(g);
  const cx = pad + R, cy = pad + R;
  svg.append(S('text', { x: cx, y: cy - 22, 'text-anchor': 'middle', class: 'center-num', text: String(N) }));
  svg.append(S('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', class: 'center-lbl', text: `escaños · mayoría ${d.M || Math.floor(N / 2) + 1}` }));
  const hemi = el('div', { class: 'hemi' }, [svg]);

  const list = el('ul', { class: 'seat-list' });
  const prev = d.prev?.s || {};
  [...sa.seats].sort((a, b) => b.s - a.s).forEach((s, i) => {
    const dl = prev[s.k] != null ? s.s - prev[s.k] : null;
    const li = el('li', { tabindex: 0, 'data-k': s.k }, [
      el('span', { class: 'dot', style: `background:${cols[s.k]}` }),
      el('span', { class: 'nm', text: pname(d, s.k) }),
      el('span', { class: 'num', text: String(s.s) }),
      el('span', { class: 'rng', text: s.min != null && s.max != null && s.max > s.min ? `${s.min}–${s.max}` : '' }),
    ]);
    const on = () => { hemi.classList.add('focus'); seats.forEach(c => c.classList.toggle('on', c.dataset.k === s.k)); li.classList.add('on'); };
    const off = () => { li.classList.remove('on'); applyCoal(); };
    li.onpointerenter = on; li.onpointerleave = off; li.onfocus = on; li.onblur = off;
    if (dl != null && dl !== 0) li.title = `${dl > 0 ? '+' : ''}${dl} frente a la última elección`;
    list.append(li);
  });
  if (sa.unassigned) list.append(el('li', { class: 'total' }, [el('span'), el('span', { class: 'nm', text: 'Sin asignar' }), el('span', { class: 'num', text: String(sa.unassigned) }), el('span')]));
  seats.forEach(c => {
    c.onpointermove = e => showTip(e, t => { t.append(el('div', { class: 'h', text: pname(d, c.dataset.k) })); t.append(el('div', { class: 'big', text: String(sa.seats.find(s => s.k === c.dataset.k).s) })); });
    c.onpointerleave = hideTip;
  });
  cur.seats = seats; cur.hemi = hemi;
  applyCoal();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Parlamento' }), el('span', { class: 'hint', text: `media de ${sa.pollsters} casas · horquilla = mín.–máx. recientes` })]),
    el('div', { class: 'seats-body' }, [hemi, list]));
}

// "Última encuesta publicada: 19/10/2026 (trabajo de campo hasta el 14/10/2026)."
function lastPoll(d) {
  const f = fdate(d.now.d);
  return d.now.pub && d.now.pub !== d.now.d ? `Última encuesta publicada el ${fdate(d.now.pub)} (trabajo de campo hasta el ${f}).` : `Última encuesta: ${f}.`;
}

// ---------- votes ----------
function renderVotes(d) {
  const card = $('votesCard'); clear(card);
  const votes = d.now?.votes || [];
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Estimación de voto' }), el('span', { class: 'hint', text: '%' })]));
  if (!votes.length) { card.append(el('p', { class: 'empty-note', text: 'Sin datos de voto.' })); return; }
  const shown = votes.slice(0, 12), rest = votes.slice(12);
  const max = Math.max(...shown.map(v => Math.max(v.v, v.max ?? 0, d.prev?.v?.[v.k] ?? 0))) * 1.05;
  const bars = el('div', { class: 'bars' });
  shown.forEach((v, i) => {
    const pr = d.prev?.v?.[v.k];
    const track = el('div', { class: 'track' }, [el('div', { class: 'fill', style: `width:${v.v / max * 100}%;background:${pcol(d, v.k, i)}` })]);
    if (v.min != null && v.max != null && v.max > v.min) track.append(el('div', { class: 'range', style: `left:${v.min / max * 100}%;width:${(v.max - v.min) / max * 100}%` }));
    if (pr != null && pr > 0) track.append(el('div', { class: 'prev', style: `left:calc(${pr / max * 100}% - 1px)` }));
    const dl = pr != null ? v.v - pr : null;
    const row = el('div', { class: 'bar-row' }, [el('span', { class: 'nm', title: pname(d, v.k), text: pname(d, v.k) }), track,
      el('span', { class: 'val' }, [fmt(v.v), dl != null ? el('small', { text: `${dl >= 0 ? '+' : '−'}${fmt(Math.abs(dl))}` }) : null])]);
    bars.append(row);
  });
  card.append(bars);
  const key = el('div', { class: 'bars-key' }, [el('span', {}, [el('i', { class: 'k-range' }), 'mín.–máx. de las últimas encuestas'])]);
  if (d.prev?.v && Object.keys(d.prev.v).length) key.append(el('span', {}, [el('i', { class: 'k-prev' }), `última elección${d.prev.d ? ' (' + fdate(d.prev.d) + ')' : ''}`]));
  card.append(key);
  if (rest.length) card.append(el('p', { class: 'others', text: 'Otros: ' + rest.map(v => `${pname(d, v.k)} ${fmt(v.v)}`).join(' · ') }));
  const nu = d.now.used.filter(u => u.w >= 0.005).length;
  card.append(el('p', { class: 'others', text: `${nu} casas · ${lastPoll(d)}${d.now.since ? ' · desde las elecciones del ' + fdate(d.now.since) : ''}.` }));
}

// ---------- coalitions ----------
const PRESETS = {
  'es-congreso': [['PP + VOX', ['PP', 'VOX']], ['PP + VOX + UPN + CCa', ['PP', 'VOX', 'UPN', 'CCA']],
    ['Bloque de la investidura de 2023', ['PSOE', 'SUMAR', 'PODEMOS', 'ERC', 'JUNTS', 'EH BILDU', 'EAJ PNV', 'BNG', 'CCA']]],
};
// the latest seat estimate of each pollster currently in the average
function pollsterSeats(d) {
  const T = d.now.seats.total, byId = new Map(d.polls.map(p => [p.id, p]));
  const out = [];
  for (const u of d.now.used) {
    if (u.w < 0.005) continue;
    const p = byId.get(u.id); if (!p) continue;
    const m = {}; let lo = 0;
    for (const x of p.p) if (x[2] != null) { m[x[0]] = (x[2] + (x[3] ?? x[2])) / 2; lo += x[2]; }
    if (lo >= 0.9 * T) out.push(m);
  }
  return out;
}
function minimalCoalitions(parties, M) {
  const ps = parties.slice(0, 14), res = [];
  for (let mask = 1; mask < (1 << ps.length); mask++) {
    let sum = 0, n = 0;
    for (let i = 0; i < ps.length; i++) if (mask & (1 << i)) { sum += ps[i].s; n++; }
    if (sum < M) continue;
    let minimal = true;
    for (let i = 0; i < ps.length && minimal; i++) if ((mask & (1 << i)) && sum - ps[i].s >= M) minimal = false;
    if (minimal) res.push({ keys: ps.filter((_, i) => mask & (1 << i)).map(p => p.k), sum, n });
  }
  return res.sort((a, b) => a.n - b.n || a.sum - b.sum);
}
function renderCoal(d) {
  const card = $('coalCard'); clear(card);
  const sa = d.now?.seats;
  if (!sa) { card.hidden = true; return; }
  card.hidden = false;
  const M = d.M || Math.floor(sa.total / 2) + 1;
  const parties = sa.seats.filter(s => s.s > 0).sort((a, b) => b.s - a.s);
  const bySeat = Object.fromEntries(parties.map(p => [p.k, p]));
  const polls = pollsterSeats(d);
  const mins = minimalCoalitions(parties, M);
  const coal = state.coal;
  mins.forEach(c => { const n = polls.filter(m => c.keys.reduce((a, k) => a + (m[k] || 0), 0) >= M).length; c.f = n; });
  mins.sort((a, b) => a.n - b.n || b.f - a.f || a.sum - b.sum);
  const total = [...coal].reduce((a, k) => a + (bySeat[k]?.s || 0), 0);
  const lo = [...coal].reduce((a, k) => a + (bySeat[k]?.min ?? bySeat[k]?.s ?? 0), 0);
  const hi = [...coal].reduce((a, k) => a + (bySeat[k]?.max ?? bySeat[k]?.s ?? 0), 0);
  const freq = keys => { if (!polls.length) return null; const n = polls.filter(m => keys.reduce((a, k) => a + (m[k] || 0), 0) >= M).length; return [n, polls.length]; };
  const rerender = () => { renderCoal(d); applyCoal(); };

  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Coaliciones y mayorías' }), el('span', { class: 'hint', text: `mayoría absoluta: ${M} de ${sa.total} escaños · elige partidos para sumarlos` })]));
  const pre = (PRESETS[d.id] || []).map(([name, ks]) => [name, ks.filter(k => bySeat[k])]).filter(x => x[1].length);
  const pbox = el('div', { class: 'presets' }, [pre.length ? 'Atajos:' : null]);
  pre.forEach(([name, ks]) => { const b = el('button', { text: name }); b.onclick = () => { state.coal = new Set(ks); rerender(); }; pbox.append(b); });
  const clr = el('button', { text: 'Limpiar' }); clr.onclick = () => { state.coal = new Set(); rerender(); }; pbox.append(clr);
  const chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Partidos' });
  parties.forEach((p, i) => {
    const b = el('button', { class: 'chip', 'aria-pressed': String(coal.has(p.k)) },
      [el('i', { class: 'dot', style: `background:${pcol(d, p.k, i)}` }), pname(d, p.k), el('span', { class: 'n', text: String(p.s) })]);
    b.onclick = () => { coal.has(p.k) ? coal.delete(p.k) : coal.add(p.k); rerender(); };
    chips.append(b);
  });
  card.append(pbox, chips);

  const maj = total >= M;
  const f = coal.size ? freq([...coal]) : null;
  const res = el('div', { class: 'coal-result' + (maj ? ' maj' : '') });
  if (!coal.size) res.append(el('div', { class: 'verdict', text: 'Elige partidos para sumar sus escaños.' }));
  else {
    res.append(el('div', { class: 'big', text: String(total) }),
      el('div', {}, [el('div', { class: 'verdict', text: maj ? `${maj && total - M ? 'Mayoría absoluta (+' + (total - M) + ')' : 'Mayoría absoluta justa'}` : `Faltan ${M - total} escaños para la mayoría` })]));
    const more = [];
    if (lo !== hi) more.push(`horquilla entre encuestas recientes: ${lo}–${hi}`);
    if (f) more.push(`alcanza la mayoría en ${f[0]} de ${f[1]} encuestas`);
    more.push(`${fmt([...coal].reduce((a, k) => a + (d.now.votes.find(v => v.k === k)?.v || 0), 0))}% de voto`);
    res.append(el('div', { class: 'more', text: more.join(' · ') }));
    const meter = el('div', { class: 'meter', role: 'img', 'aria-label': `${total} de ${M} escaños necesarios` }, [el('i', { style: `width:${Math.min(100, total / sa.total * 100)}%` }), el('b', { style: `left:${M / sa.total * 100}%` })]);
    res.append(meter);
  }
  card.append(res);

  card.append(el('h3', { class: 'sub-h', text: mins.length ? `Mayorías mínimas posibles (${mins.length})` : 'Ninguna combinación de los 14 mayores partidos llega a la mayoría' }));
  if (mins.length) {
    const ul = el('ul', { class: 'minimal' });
    const shown = state.allMins ? mins : mins.slice(0, 12);
    shown.forEach(c => {
      const b = el('button', { 'aria-pressed': String(c.keys.length === coal.size && c.keys.every(k => coal.has(k))) }, [el('span', { class: 'names', text: c.keys.map(k => pname(d, k)).join(' + ') }), el('span', { class: 'sum', text: String(c.sum) }), polls.length ? el('span', { class: 'freq', text: `${c.f}/${polls.length} enc.` }) : null]);
      b.onclick = () => { state.coal = new Set(c.keys); rerender(); };
      ul.append(el('li', {}, [b]));
    });
    card.append(ul);
    if (mins.length > 12) { const mb = el('button', { class: 'show-more', text: state.allMins ? 'Mostrar menos' : `Mostrar las ${mins.length}` }); mb.onclick = () => { state.allMins = !state.allMins; rerender(); }; card.append(mb); }
    card.append(el('p', { class: 'others', text: 'Ordenadas por número de partidos y, a igualdad, por cuántas encuestas les dan mayoría. «Mínima» significa que ningún partido sobra. Son sumas aritméticas, no pactos previsibles; la lista no juzga si un pacto es plausible.' }));
  }
}

// ---------- result vs polls ----------
function renderFit(d) {
  const card = $('fitCard'); clear(card);
  const prev = d.prev;
  if (!prev || !d.now || !(Object.keys(prev.v).length || Object.keys(prev.s).length)) { card.hidden = true; return; }
  card.hidden = false;
  const when = prev.d ? fdate(prev.d) : 'última elección';
  const nowV = Object.fromEntries(d.now.votes.map(v => [v.k, v.v]));
  const nowS = Object.fromEntries((d.now.seats?.seats || []).map(s => [s.k, s.s]));
  const back = d.fit?.back;
  const keys = [...new Set([...Object.keys(prev.v), ...Object.keys(prev.s), ...Object.keys(nowV)])]
    .filter(k => (prev.v[k] ?? 0) >= 0.5 || (nowV[k] ?? 0) >= 0.5 || (prev.s[k] ?? 0) > 0)
    .sort((a, b) => Math.max(prev.v[b] ?? 0, nowV[b] ?? 0) - Math.max(prev.v[a] ?? 0, nowV[a] ?? 0)).slice(0, 14);
  const pedersen = keys.reduce((a, k) => a + Math.abs((nowV[k] ?? 0) - (prev.v[k] ?? 0)), 0) / 2;
  const moved = d.now.seats ? keys.reduce((a, k) => a + Math.abs((nowS[k] ?? 0) - (prev.s[k] ?? 0)), 0) / 2 : null;
  let mae = null;
  if (back) { const ks = Object.keys(prev.v).filter(k => prev.v[k] >= 1); if (ks.length) mae = ks.reduce((a, k) => a + Math.abs((back.v[k] ?? 0) - prev.v[k]), 0) / ks.length; }
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Resultado oficial frente a las encuestas' }), el('span', { class: 'hint', text: `elecciones del ${when} · cifras citadas por Electogrāfica` })]));
  const sum = el('div', { class: 'fit-sum' }, [
    el('div', {}, [el('b', { text: fmt(pedersen) + ' pts' }), el('span', { text: 'voto que ha cambiado de partido desde entonces (media actual)' })]),
  ]);
  if (moved != null) sum.append(el('div', {}, [el('b', { text: String(Math.round(moved)) }), el('span', { text: 'escaños que cambiarían de manos' })]));
  if (mae != null) sum.append(el('div', {}, [el('b', { text: fmt(mae) + ' pts' }), el('span', { text: `error medio de la media de las encuestas la víspera (${back.n} encuestas, partidos ≥1%)` })]));
  card.append(sum);
  const dcell = (v, dec = 1, unit = '') => el('td', { class: v == null ? '' : v > 0.05 ? 'pos' : v < -0.05 ? 'neg' : '', text: v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), dec) + unit });
  const hasBack = !!back;
  const head = ['Partido', 'Resultado %', 'Media hoy %', 'Dif.', 'σ casas', 'Esc. resultado', 'Esc. media hoy', 'Dif.'];
  if (hasBack) head.push('Media víspera %', 'Error víspera');
  const tbody = el('tbody');
  keys.forEach((k, i) => {
    const rv = prev.v[k], nv = nowV[k], rs = prev.s[k], ns = nowS[k], sd = d.fit?.sd?.[k];
    const tr = el('tr', {}, [el('td', { class: 'l who' }, [el('span', { class: 'dot', style: `display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:${pcol(d, k, i)}` }), pname(d, k)]),
      el('td', { text: fmt(rv) }), el('td', { text: fmt(nv) }), dcell(nv != null && rv != null ? nv - rv : null),
      el('td', { text: sd != null ? '±' + fmt(sd) : '–' }),
      el('td', { text: rs != null ? String(rs) : '–' }), el('td', { text: ns != null ? String(ns) : '–' }), dcell(ns != null && rs != null ? ns - rs : null, 0)]);
    if (hasBack) tr.append(el('td', { text: fmt(back.v[k]) }), dcell(back.v[k] != null && rv != null ? back.v[k] - rv : null));
    tbody.append(tr);
  });
  card.append(el('div', { class: 'table-wrap' }, [el('table', { class: 't' }, [el('thead', {}, [el('tr', {}, head.map((h, i) => el('th', { class: i === 0 ? 'l' : '', text: h })))]), tbody])]));
  const orphans = keys.filter(k => prev.v[k] == null && (nowV[k] ?? 0) >= 1).map(k => pname(d, k));
  if (orphans.length) card.append(el('p', { class: 'others', text: `Sin resultado propio (${orphans.join(', ')}): no concurrieron por separado en esa elección, por ejemplo dentro de una coalición, así que sus diferencias y la de su coalición de entonces no son comparables, y los totales de arriba las cuentan como cero.` }));
  card.append(el('p', { class: 'others', text: 'Dif. = media hoy menos resultado. «σ casas» es la dispersión entre las casas que entran en la media: si la diferencia con el resultado es menor que σ, las encuestas actuales son compatibles con repetir el resultado. Error víspera = media de las encuestas el día antes de las elecciones menos el resultado (negativo: las encuestas se quedaron cortas).' }));
}

// ---------- province map (official results, Congreso) ----------
const mapData = { prov: null, shapes: null, sel: null, mode: 'winner' };
// PSOE runs under regional names in some provinces
const GROUPED = { 'PSC': 'PSOE', 'PSdeG-PSOE': 'PSOE', 'PSE-EE': 'PSOE' };
const grp = n => GROUPED[n] || n;
function provRows(p) {
  const m = new Map();
  for (const r of p.rows) {
    const k = grp(r.n), t = m.get(k) || { n: k, v: 0, p: 0, s: 0, c: r.c };
    t.v += r.v; t.p += r.p; t.s += r.s; if (k === r.n || !m.has(k)) t.c = r.c; m.set(k, t);
  }
  return [...m.values()].sort((a, b) => b.v - a.v);
}
async function renderMap(d) {
  const card = $('mapCard');
  if (!card) return;
  if (SECTION !== 'es' || d.id !== 'es-congreso') { card.hidden = true; return; }
  card.hidden = false;
  if (!mapData.prov) {
    try { [mapData.prov, mapData.shapes] = await Promise.all([getJson('data/provincias.json'), getJson('data/mapa-espana.json')]); }
    catch { card.hidden = true; return; }
  }
  const { prov, shapes } = mapData;
  const rowsBy = new Map(prov.provinces.map(p => [p.code, { p, rows: provRows(p) }]));
  const color = new Map();
  for (const { rows } of rowsBy.values()) for (const r of rows) if (!color.has(r.n) || r.n === 'PSOE') color.set(r.n, r.c);
  const wins = {};
  for (const { rows } of rowsBy.values()) wins[rows[0].n] = (wins[rows[0].n] || 0) + 1;
  const natSeats = {};
  for (const { rows } of rowsBy.values()) for (const r of rows) natSeats[r.n] = (natSeats[r.n] || 0) + r.s;
  const choices = Object.keys(natSeats).filter(k => natSeats[k] > 0).sort((a, b) => natSeats[b] - natSeats[a]);
  const [dy, dm, dd] = prov.election.split('-');

  clear(card);
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Resultado oficial por provincia' }), el('span', { class: 'hint', text: `elecciones generales del ${dd}/${dm}/${dy}` })]));
  const sel = el('select', { id: 'mapMode', 'aria-label': 'Qué mostrar en el mapa' }, [el('option', { value: 'winner', text: 'Candidatura más votada' }), ...choices.map(k => el('option', { value: k, text: `% de voto: ${k}` }))]);
  sel.value = mapData.mode;
  card.append(el('div', { class: 'map-ctl' }, [el('label', {}, ['Mostrar ', sel])]));
  const svg = S('svg', { viewBox: `0 0 ${shapes.w} ${shapes.h}`, class: 'map-svg', role: 'group', 'aria-label': 'Mapa de España por provincias' });
  const panel = el('div', { class: 'map-panel', 'aria-live': 'polite' });
  const legend = el('div', { class: 'map-legend' });
  const maxPct = party => Math.max(...[...rowsBy.values()].map(({ rows }) => rows.find(r => r.n === party)?.p || 0));
  const fillFor = code => {
    const { rows } = rowsBy.get(code);
    if (mapData.mode === 'winner') return { fill: color.get(rows[0].n), op: 1 };
    const r = rows.find(x => x.n === mapData.mode), mx = maxPct(mapData.mode);
    return { fill: color.get(mapData.mode), op: r ? 0.12 + 0.88 * (r.p / mx) : 0.05 };
  };
  const show = code => {
    const { p, rows } = rowsBy.get(code);
    clear(panel);
    panel.append(el('h3', { text: p.name }), el('div', { class: 'sub', text: `${p.seats} diputados · participación ${fmt(p.turnout)}% · ${p.electors.toLocaleString('es')} electores` }));
    const t = el('table', {}, rows.slice(0, 8).map(r => el('tr', {}, [el('td', {}, [el('i', { class: 'dot', style: `background:${r.c}` }), r.n]), el('td', { text: fmt(r.p, 2) + '%' }), el('td', { text: r.s ? r.s + ' esc.' : '' })])));
    panel.append(t);
    if (p.rows.some(r => GROUPED[r.n])) panel.append(el('p', { class: 'others', text: 'PSOE incluye PSC, PSdeG-PSOE y PSE-EE.' }));
  };
  const paths = {};
  for (const code of Object.keys(shapes.prov)) {
    if (!rowsBy.has(code)) continue;
    const f = fillFor(code);
    const w = rowsBy.get(code).rows[0];
    const path = S('path', { d: shapes.prov[code], 'fill-rule': 'evenodd', fill: f.fill, 'fill-opacity': f.op, class: 'prov' + (mapData.sel === code ? ' sel' : ''), tabindex: 0, role: 'button',
      'aria-label': `${rowsBy.get(code).p.name}: ${w.n} ${fmt(w.p)}%` });
    path.onpointerenter = () => show(code); path.onfocus = () => show(code);
    path.onclick = () => { mapData.sel = code; Object.values(paths).forEach(x => x.classList.remove('sel')); path.classList.add('sel'); show(code); };
    path.onpointermove = e => showTip(e, t => { t.append(el('div', { class: 'h', text: rowsBy.get(code).p.name })); rowsBy.get(code).rows.slice(0, 3).forEach(r => t.append(el('div', { class: 'r' }, [el('i', { class: 'key', style: `background:${r.c}` }), el('span', { class: 'n', text: r.n }), el('span', { class: 'v', text: fmt(r.p) + '%' })]))); });
    path.onpointerleave = () => { hideTip(); if (mapData.sel) show(mapData.sel); };
    paths[code] = path; svg.append(path);
  }
  if (mapData.mode === 'winner') {
    Object.entries(wins).sort((a, b) => b[1] - a[1]).forEach(([n, c]) => legend.append(el('span', {}, [el('i', { style: `background:${color.get(n)}` }), `${n} · ${c} ${c === 1 ? 'provincia' : 'provincias'}`])));
  } else {
    legend.append(el('span', {}, ['0%', el('i', { class: 'ramp', style: `background:linear-gradient(90deg, color-mix(in srgb, ${color.get(mapData.mode)} 12%, transparent), ${color.get(mapData.mode)})` }), `${fmt(maxPct(mapData.mode))}%`]));
  }
  card.append(el('div', { class: 'map-body' }, [svg, panel]), legend);
  if (mapData.sel) show(mapData.sel); else panel.append(el('p', { class: 'others', text: 'Pasa el ratón, toca o enfoca una provincia para ver su resultado.' }));
  sel.onchange = () => { mapData.mode = sel.value; renderMap(d); };

  const det = el('details', { class: 'data' }, [el('summary', { text: 'Ver como tabla' })]);
  const head = el('tr', {}, ['Provincia', 'Diputados', 'Más votada', '%', 'Reparto de escaños'].map((h, i) => el('th', { class: i === 0 || i === 4 ? 'l' : '', text: h })));
  const body = el('tbody', {}, prov.provinces.slice().sort((a, b) => a.name.localeCompare(b.name, 'es')).map(p => { const rows = rowsBy.get(p.code).rows; return el('tr', {}, [el('td', { class: 'l', text: p.name }), el('td', { text: String(p.seats) }), el('td', { text: rows[0].n }), el('td', { text: fmt(rows[0].p, 2) }), el('td', { class: 'l', text: rows.filter(r => r.s).map(r => `${r.n} ${r.s}`).join(', ') })]); }));
  det.append(el('div', { class: 'table-wrap' }, [el('table', { class: 't' }, [el('thead', {}, [head]), body])]));
  card.append(det);
  card.append(el('p', { class: 'others', text: prov.source }), el('p', { class: 'others' }, ['Datos recopilados a través de ', el('a', { href: prov.via, rel: 'noopener', target: '_blank', text: 'votomunicipal.es' }), ` (${fdate(prov.fetched)}). Los límites están simplificados y no sirven para fines cartográficos ni jurídicos.`]));
}

// ---------- trend ----------
function renderTrend(d) {
  const card = $('trendCard'); clear(card);
  const i0 = cycleStartIdx(d);
  const T = d.series.t.slice(i0);
  const keys = Object.keys(d.series.lines).filter(k => d.series.lines[k].slice(i0).some(v => v != null && v >= 1))
    .sort((a, b) => (d.series.lines[b][d.series.lines[b].length - 1] ?? 0) - (d.series.lines[a][d.series.lines[a].length - 1] ?? 0));
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Evolución de la media' }), el('span', { class: 'hint', text: '% de voto; cada punto es la media tras una nueva encuesta' })]));
  if (T.length < 2 || !keys.length) { card.append(el('p', { class: 'empty-note', text: 'No hay suficientes encuestas para dibujar la evolución.' })); return; }
  const top = keys.slice(0, 8), extra = keys.slice(8, 30);
  const legend = el('div', { class: 'legend' });
  const lastVal = k => { const a = d.series.lines[k]; for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]; return null; };
  const draw = () => { renderTrendSvg(); };
  const mk = (k, i) => {
    const b = el('button', { 'aria-pressed': String(!state.hidden.has(k)) }, [el('i', { class: 'key', style: `background:${pcol(d, k, i)}` }), pname(d, k), el('span', { class: 'v', text: fmt(lastVal(k)) })]);
    b.onclick = () => { state.hidden.has(k) ? state.hidden.delete(k) : state.hidden.add(k); b.setAttribute('aria-pressed', String(!state.hidden.has(k))); draw(); };
    return b;
  };
  const visible = state.showAll ? keys.slice(0, 30) : top;
  visible.forEach((k, i) => legend.append(mk(k, i)));
  if (extra.length && !state.showAll) { const m = el('button', { class: 'more', text: `+${extra.length} partidos` }); m.onclick = () => { state.showAll = true; renderTrend(d); }; legend.append(m); }
  card.append(legend);
  const holder = el('div', { class: 'trend' }); card.append(holder);

  function renderTrendSvg() {
    clear(holder);
    const act = visible.filter(k => !state.hidden.has(k));
    const W = Math.max(320, holder.clientWidth || 800), H = W < 520 ? 280 : 360;
    const m = { l: 36, r: W < 520 ? 12 : 120, t: 14, b: 28 };
    const t0 = Date.parse(T[0]), t1 = Date.parse(T[T.length - 1]);
    const xs = t => m.l + (Date.parse(t) - t0) / Math.max(1, t1 - t0) * (W - m.l - m.r);
    const vmax = Math.max(10, ...act.flatMap(k => d.series.lines[k].slice(i0).map(v => v ?? 0)));
    const step = vmax > 40 ? 10 : vmax > 20 ? 5 : 2;
    const ymax = Math.ceil(vmax / step) * step;
    const ys = v => H - m.b - v / ymax * (H - m.t - m.b);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': 'Evolución de la media de encuestas' });
    for (let v = 0; v <= ymax; v += step) {
      svg.append(S('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v), class: v === 0 ? 'axis-line' : 'grid-line' }));
      svg.append(S('text', { x: m.l - 6, y: ys(v) + 4, 'text-anchor': 'end', class: 'tick', text: String(v) }));
    }
    const y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear();
    const span = y1 - y0, every = span > 12 ? 2 : 1;
    if (span === 0) {
      [0, 0.5, 1].forEach(f => { const t = new Date(t0 + f * (t1 - t0)); svg.append(S('text', { x: xs(t.toISOString().slice(0, 10)), y: H - 8, 'text-anchor': f === 0 ? 'start' : f === 1 ? 'end' : 'middle', class: 'tick', text: t.toISOString().slice(5, 10).split('-').reverse().join('/') })); });
    } else for (let y = y0 + 1; y <= y1; y += every) { const x = xs(`${y}-01-01`); svg.append(S('text', { x, y: H - 8, 'text-anchor': 'middle', class: 'tick', text: String(y) })); }
    for (const e of d.elections) if (e >= T[0] && e <= T[T.length - 1]) {
      svg.append(S('line', { x1: xs(e), x2: xs(e), y1: m.t, y2: H - m.b, class: 'el-line', 'stroke-dasharray': '0' }));
      svg.append(S('text', { x: xs(e) + 4, y: m.t + 8, class: 'el-lbl', text: 'elecciones' }));
    }
    const ends = [];
    act.forEach(k => {
      const vals = d.series.lines[k].slice(i0);
      let path = '', pen = false, last = null;
      vals.forEach((v, i) => { if (v == null) { pen = false; return; } path += `${pen ? 'L' : 'M'}${xs(T[i]).toFixed(1)},${ys(v).toFixed(1)}`; pen = true; last = [i, v]; });
      svg.append(S('path', { d: path, fill: 'none', stroke: pcol(d, k, visible.indexOf(k)), 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (last && last[0] >= vals.length - 3) { svg.append(S('circle', { cx: xs(T[last[0]]), cy: ys(last[1]), r: 4, fill: pcol(d, k, visible.indexOf(k)), stroke: 'var(--surface)', 'stroke-width': 2 })); ends.push({ k, y: ys(last[1]), v: last[1] }); }
    });
    if (m.r > 60) { // direct labels, only while they don't collide
      ends.sort((a, b) => a.y - b.y);
      let prevY = -99;
      for (const e of ends) if (e.y - prevY >= 14) { prevY = e.y; svg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [pname(d, e.k).slice(0, 14) + ' ', S('tspan', { class: 'v', text: fmt(e.v) })])); }
    }
    const guide = S('line', { y1: m.t, y2: H - m.b, class: 'guide', visibility: 'hidden' });
    svg.append(guide);
    const hit = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: 'hit', tabindex: 0, 'aria-label': 'Valores por fecha; usa las flechas' });
    let cur = T.length - 1;
    const at = (i, ev) => {
      cur = Math.max(0, Math.min(T.length - 1, i)); const x = xs(T[cur]);
      guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
      const rows = act.map(k => [k, d.series.lines[k][i0 + cur]]).filter(r => r[1] != null).sort((a, b) => b[1] - a[1]);
      const r = svg.getBoundingClientRect();
      const e = ev || { clientX: r.left + x * r.width / W, clientY: r.top + 40 };
      showTip(e, t => { t.append(el('div', { class: 'h', text: fdate(T[cur]) })); rows.slice(0, 10).forEach(([k, v]) => t.append(el('div', { class: 'r' }, [el('i', { class: 'key', style: `background:${pcol(d, k, visible.indexOf(k))}` }), el('span', { class: 'n', text: pname(d, k) }), el('span', { class: 'v', text: fmt(v) })]))); });
    };
    const near = ev => { const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * W / r.width; let b = 0, bd = 1e12; T.forEach((t, i) => { const dd = Math.abs(xs(t) - px); if (dd < bd) { bd = dd; b = i; } }); return b; };
    hit.onpointermove = ev => at(near(ev), ev);
    hit.onpointerleave = () => { hideTip(); guide.setAttribute('visibility', 'hidden'); };
    hit.onkeydown = ev => { if (ev.key === 'ArrowLeft') { at(cur - 1); ev.preventDefault(); } else if (ev.key === 'ArrowRight') { at(cur + 1); ev.preventDefault(); } };
    hit.onblur = () => { hideTip(); guide.setAttribute('visibility', 'hidden'); };
    svg.append(hit);
    holder.append(svg);
  }
  renderTrendSvg();
  card.append(tableDetails(d, keys.slice(0, 10), T, i0));
}
function tableDetails(d, keys, T, i0) {
  const det = el('details', { class: 'data' }, [el('summary', { text: 'Ver como tabla (últimas 15 fechas)' })]);
  const rows = T.slice(-15).map((t, j) => [t, ...keys.map(k => d.series.lines[k][i0 + T.length - 15 + j < i0 ? i0 : i0 + Math.max(0, T.length - 15) + j])]);
  const tbl = el('table', { class: 't' }, [el('thead', {}, [el('tr', {}, [el('th', { text: 'Fecha' }), ...keys.map(k => el('th', { text: pname(d, k) }))])]),
    el('tbody', {}, rows.reverse().map(r => el('tr', {}, [el('td', { text: fdate(r[0]) }), ...r.slice(1).map(v => el('td', { text: fmt(v) }))])))]);
  det.append(el('div', { class: 'table-wrap' }, [tbl]));
  return det;
}

// ---------- polls table ----------
function renderPolls(d) {
  const card = $('pollsCard'); clear(card);
  const used = new Map((d.now?.used || []).map(u => [u.id, u.w]));
  const polls = [...d.polls].reverse();
  const keys = (d.now?.votes || []).slice(0, 7).map(v => v.k);
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: 'Encuestas' }), el('span', { class: 'hint', text: `${d.polls.length} en total · en negrita las que entran hoy en la media` })]));
  const n = state.pollsShown || 25;
  const head = el('tr', {}, [el('th', { text: 'Fecha' }), el('th', { class: 'l', text: 'Empresa' }), ...keys.map(k => el('th', {}, [el('span', { class: 'dot', style: `background:${pcol(d, k)}` }), pname(d, k)])), el('th', { text: 'Peso' })]);
  const body = el('tbody');
  for (const p of polls.slice(0, n)) {
    const w = used.get(p.id);
    const tr = el('tr', { class: w == null ? 'excluded' : '' });
    tr.append(el('td', { text: fdate(p.d) }));
    const who = el('td', { class: 'l who' }, [el('a', { href: p.u || '#', rel: 'noopener', target: '_blank', text: p.po })]);
    if (p.fi) who.append(el('span', { class: 'badge', text: 'interna' })); if (p.fx) who.append(el('span', { class: 'badge', text: 'urna' })); if (p.pa) who.append(el('span', { class: 'badge', text: 'parcial' }));
    if (p.cl || p.n) who.append(el('small', { text: [p.cl, p.n ? p.n.toLocaleString('es') + ' ent.' : null].filter(Boolean).join(' · ') }));
    tr.append(who);
    for (const k of keys) { const x = p.p.find(y => y[0] === k); tr.append(el('td', {}, [x && x[1] != null ? fmt(x[1]) : '–', x && x[2] != null ? el('small', { text: x[3] != null && x[3] !== x[2] ? `${x[2]}–${x[3]}` : String(x[2]) }) : null])); }
    tr.append(el('td', { class: 'weight', text: w != null ? Math.round(w * 100) + '%' : '' }));
    body.append(tr);
  }
  card.append(el('div', { class: 'table-wrap' }, [el('table', { class: 't' }, [el('thead', {}, [head]), body])]));
  if (polls.length > n) { const b = el('button', { class: 'show-more', text: 'Mostrar más' }); b.onclick = () => { state.pollsShown = n + 50; renderPolls(d); }; card.append(b); }
}

// ---------- explore ----------
function renderExplore() {
  const tabs = { es: [['all', 'Todas'], ['congreso', 'Congreso'], ['municipales', 'Municipales'], ['forales', 'Forales'], ['congreso-ccaa', 'Circunscripciones']],
    aut: [], intl: [['all', 'Todas'], ['legislativas', 'Nacionales'], ['europeas', 'Europeas'], ['regionales', 'Regionales']] }[SECTION];
  const match = (e, t) => inSection(e) && (t === 'all' || e.kind === t);
  const q = state.q.toLowerCase();
  const tb = $('etabs'); clear(tb);
  tabs.forEach(([id, name]) => {
    const n = state.index.elections.filter(e => match(e, id)).length;
    const b = el('button', { role: 'tab', 'aria-selected': String(state.tab === id) }, [name, el('span', { class: 'n', text: n })]);
    b.onclick = () => { state.tab = id; renderExplore(); }; tb.append(b);
  });
  const box = $('ecards'); clear(box);
  const items = state.index.elections.filter(e => match(e, state.tab) && (!q || label(e).toLowerCase().includes(q))).sort((a, b) => b.last.localeCompare(a.last) || b.total - a.total).slice(0, 90);
  for (const e of items) {
    const old = e.last < new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
    const a = el('a', { class: 'mini' + (old ? ' old' : ''), href: '#' + e.id });
    a.append(el('div', { class: 't1', text: e.name }), el('div', { class: 't2', text: `${KIND[e.kind] || e.kind} · ${e.total} encuestas · ${fdate(e.last)}` }));
    if (e.sb) { const T = e.sb.reduce((s, x) => s + x[1], 0); a.append(el('div', { class: 'sb' }, e.sb.map(([n, s, c]) => el('i', { title: `${n} ${s}`, style: `flex:${s};background:${c || 'var(--axis)'}` })))); void T; }
    if (e.top[0]) a.append(el('div', { class: 'lead' }, [el('b', { text: e.top[0][1] }), ` ${fmt(e.top[0][2])}%` + (e.top[1] ? ` · ${e.top[1][1]} ${fmt(e.top[1][2])}%` : '')]));
    box.append(a);
  }
  if (!items.length) box.append(el('p', { class: 'empty-note', text: 'Sin resultados' }));
}
$('esearch').oninput = e => { state.q = e.target.value; renderExplore(); };

// ---------- main ----------
function render() {
  const d = state.doc;
  document.title = `${d.name} · Electómetro`;
  const hero = $('hero'); clear(hero);
  const nowD = d.now?.d;
  const stale = nowD && (Date.now() - Date.parse(nowD)) > 120 * 864e5;
  hero.append(el('p', { class: 'eyebrow', text: KIND[d.kind] || d.kind }), el('h1', { text: d.name }),
    el('p', { class: 'sub', text: d.now ? `Media de ${d.now.nCycle} encuestas${d.now.since ? ' desde las elecciones del ' + fdate(d.now.since) : ''}. ${lastPoll(d)}` : 'Esta elección solo tiene resultados, sin encuestas utilizables.' }));
  if (stale) hero.append(el('span', { class: 'stale', text: 'Datos antiguos: la última encuesta tiene más de cuatro meses.' }));
  renderSeats(d); renderVotes(d); renderCoal(d); renderFit(d); renderMap(d); renderTrend(d); renderPolls(d);
}
function route() {
  const [id, qs] = location.hash.slice(1).split('?');
  const c = new URLSearchParams(qs || '').get('c');
  const known = state.index.elections.find(e => e.id === id && inSection(e));
  load(known ? id : defaultId(), c ? c.split(',') : []);
}
let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => state.doc && renderTrend(state.doc), 150); });
addEventListener('hashchange', () => { if (location.hash === '#explorar' || location.hash === '#metodo') return; state.pollsShown = 0; route(); window.scrollTo(0, 0); });

(async () => {
  state.index = await getJson('data/elections.json');
  $('upd').textContent = 'Última actualización de los datos: ' + new Date(state.index.updated).toLocaleString('es');
  $('eheading').textContent = { es: 'Explorar elecciones en España', aut: 'Explorar parlamentos autonómicos', intl: 'Explorar elecciones internacionales' }[SECTION];
  renderExplore();
  $('etabs').hidden = !$('etabs').children.length;
  route();
})();
