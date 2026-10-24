// Primómetro, in English or Spanish (../shared/lang.js): tr('Spanish', 'English') picks the page's language.
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const ES = (window.HLLang && window.HLLang.lang) === 'es';
const LOC = ES ? 'es-ES' : 'en-GB';
const tr = (es, en) => ES ? es : en;
const P = ES ? ' %' : '%'; // "2,5 %" in Spanish, "2.5%" in English
const REGION_EN = (() => { try { return new Intl.DisplayNames(['en-GB'], { type: 'region' }); } catch { return null; } })();
window.HLLang?.apply({ es: {
  _description: 'La prima de riesgo, la inflación, el déficit público y el PIB de cada país de la zona euro y su evolución junto a los tipos de interés del BCE, con datos oficiales del BCE y Eurostat.',
  nav_method: 'Método', theme: 'Cambiar tema', country: 'País', vs: 'Comparado con', ref: 'Referencia', germany: 'Alemania', ea_avg: 'Media de la zona euro',
  period: 'Periodo', bp_hint: 'puntos básicos (pb) = diferencia de rentabilidad del bono a 10 años × 100', t_rates: 'Tipo de depósito del BCE e inflación (%)',
  t_gdp: 'Crecimiento del PIB real (% anual)', t_def: 'Saldo público (% del PIB, anual)', table: 'Ver como tabla', method: 'Cómo se calcula',
  method_body: '<h3>Prima de riesgo</h3><p>Diferencia entre la rentabilidad del bono a 10 años de un país y la del bono alemán (o la media de la zona euro), en puntos básicos: 1 punto porcentual = 100 pb. Una prima alta significa que el mercado pide más interés a ese país que a Alemania.</p>' +
    '<h3>Datos mensuales</h3><p>El BCE publica para cada país la media mensual de la rentabilidad a 10 años (la serie del criterio de convergencia de Maastricht), con un mes de retraso aproximadamente. No es la prima diaria de los medios, que procede de proveedores de mercado de pago.</p>' +
    '<h3>Inflación</h3><p>Tasa anual del índice de precios de consumo armonizado (IPCA) de Eurostat, la medida que usa el BCE para su objetivo del 2 %. En el mapa, los colores cálidos indican inflación por encima del 2 % y los azules, por debajo. El tipo real es el tipo de depósito menos la inflación de la zona euro: si es negativo, el dinero en depósito pierde poder de compra.</p>' +
    '<h3>Inflación acumulada</h3><p>Cuánto han subido los precios desde el primer mes del periodo elegido, a partir del índice del IPCA de Eurostat (no sumando tasas anuales). La línea del depósito muestra cuánto habría crecido un depósito remunerado cada mes al tipo de depósito del BCE: si queda por debajo de los precios, ese ahorro perdió poder de compra.</p>' +
    '<h3>Déficit público</h3><p>Saldo de las administraciones públicas en % del PIB (capacidad o necesidad de financiación) según las notificaciones de déficit excesivo que publica Eurostat cada abril y octubre. Negativo es déficit; el límite de la UE es un déficit del 3 %. Son datos anuales: para los meses de 2026 se muestra el último año publicado.</p>' +
    '<h3>PIB</h3><p>Crecimiento anual del producto interior bruto en volumen (descontada la inflación) y crecimiento acumulado desde el primer año del periodo, a partir de la serie encadenada de Eurostat. El último trimestre muestra el crecimiento frente al mismo trimestre del año anterior, corregido de estacionalidad. En Irlanda y Malta el PIB se ve muy afectado por la contabilidad de grandes multinacionales.</p>' +
    '<h3>Tipos del BCE</h3><p>Facilidad de depósito, operaciones principales de financiación y facilidad marginal de crédito, en la fecha en que entra en vigor cada cambio. Entre 2000 y 2008 las operaciones principales se hacían a tipo variable; se muestra el tipo mínimo de puja.</p>' +
    '<h3>Antes del euro</h3><p>Hasta que un país adopta el euro, su diferencial con Alemania incluye el riesgo de tipo de cambio. Ese tramo se dibuja más claro.</p>' +
    '<h3>Países pequeños</h3><p>En países con poca deuda a largo plazo (por ejemplo Estonia, Lituania o Luxemburgo) la serie se basa en pocos bonos o en aproximaciones, y no siempre es comparable con la de los demás.</p>' +
    '<h3>Decisiones y prima</h3><p>La tabla de decisiones compara la prima del mes anterior a cada cambio de tipos con la de tres meses después. Muestra lo que pasó, no por qué: en esos meses influyen muchos otros factores.</p>',
  foot1: 'Fuentes: Banco Central Europeo, <a href="https://data.ecb.europa.eu/" rel="noopener">ECB Data Portal</a> (rentabilidad de la deuda y tipos de interés); <a href="https://ec.europa.eu/eurostat/" rel="noopener">Eurostat</a> (inflación, IPCA; déficit público; PIB). Este sitio es independiente y no está afiliado al BCE ni a Eurostat.',
  foot2: 'Un proyecto de', foot3: 'en'
} });
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
const nf2 = new Intl.NumberFormat(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BP = tr('pb', 'bp');
const pct = v => v == null ? '–' : nf2.format(v) + P;
const bp = v => v == null ? '–' : `${Math.round(v)} ${BP}`;
const sbp = v => v == null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(Math.round(v))} ${BP}`;
const MES = ES ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MESL = ES ? ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const mShort = m => `${MES[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const mLong = m => ES ? `${MESL[+m.slice(5, 7) - 1]} de ${m.slice(0, 4)}` : `${MESL[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const dLong = d => `${+d.slice(8, 10)} ${MES[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
const tMonth = m => Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15);
const tDay = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const addMonths = (m, n) => { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); };

// ---------- state ----------
const RANGES = [['2a', tr('2 años', '2 years')], ['5a', tr('5 años', '5 years')], ['2007', tr('Desde 2007', 'Since 2007')], ['euro', tr('Desde 1999', 'Since 1999')], ['todo', tr('Todo', 'All')]];
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
let hicpBy = {};  // area -> Map(month -> HICP index, 2025 = 100)
let defBy = {};   // area -> Map(year -> government balance, % of GDP; negative = deficit)
let gdpG = {}, gdpV = {}, gdpQ = {}; // real GDP: growth by year, volume by year, growth by quarter (year on year)
function prep(D) {
  byMonth = {}; inflBy = {}; hicpBy = {}; defBy = {}; gdpG = {}; gdpV = {}; gdpQ = {};
  const maps = (src, dst) => { for (const [k, rows] of Object.entries(src || {})) dst[k] = new Map(rows); };
  maps(D.yields, byMonth); maps(D.inflation, inflBy); maps(D.hicp, hicpBy); maps(D.deficit, defBy);
  maps(D.gdp?.growth, gdpG); maps(D.gdp?.volume, gdpV); maps(D.gdp?.quarter, gdpQ);
}
const lastGdpYear = () => state.D.gdp.growth.U2.at(-1)[0];
const gdpYear = m => { const y = m.slice(0, 4); return y > lastGdpYear() ? lastGdpYear() : y; };
const growth = (k, m) => gdpG[k]?.get(gdpYear(m)) ?? null;
const lastQuarter = k => { const rows = state.D.gdp.quarter[k]; return rows?.length ? rows.at(-1) : null; };
const qLabel = q => ES ? `${q.slice(5)} ${q.slice(0, 4)}`.replace('Q', 'T') : `${q.slice(5)} ${q.slice(0, 4)}`;
const sgn1 = v => v == null ? '–' : `${v > 0 ? '+' : ''}${nf1.format(v)}${P}`;
const lastMonth = () => state.D.yields.DE.at(-1)[0];
const infl = (k, m) => inflBy[k]?.get(m) ?? null;
const lastInfl = () => state.D.inflation.U2.at(-1)[0];
const lastDefYear = () => state.D.deficit.U2.at(-1)[0];
// a month's deficit is its calendar year's, or the latest year published
const defYear = m => { const y = m.slice(0, 4); return y > lastDefYear() ? lastDefYear() : y; };
const def = (k, m) => defBy[k]?.get(defYear(m)) ?? null;
const nf1 = new Intl.NumberFormat(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = v => v == null ? '–' : nf1.format(v) + P;
const balTxt = v => v == null ? '–' : v < 0 ? tr(`déficit del ${nf1.format(-v)} %`, `deficit of ${nf1.format(-v)}%`) : v > 0 ? tr(`superávit del ${nf1.format(v)} %`, `surplus of ${nf1.format(v)}%`) : tr('equilibrio', 'balanced');
// what the map and the ranking show; dir = +1 when higher is worse, −1 when lower is worse;
// the ranking lists the worst first, except GDP growth, which lists the fastest first
const METRIC = {
  prima: { center: 0, dir: 1, val: (k, m) => (k === state.vs ? 0 : prem(k, m)), fmt: v => String(Math.round(v)), full: v => bp(v), last: () => lastMonth() },
  infl: { center: 2, dir: 1, val: (k, m) => infl(k, m), fmt: v => nf1.format(v), full: v => pct1(v), last: () => lastInfl() },
  def: { center: -3, dir: -1, val: (k, m) => def(k, m), fmt: v => nf1.format(v), full: v => balTxt(v), last: () => lastMonth() },
  pib: { center: 0, dir: -1, desc: true, val: (k, m) => growth(k, m), fmt: v => `${v > 0 ? '+' : ''}${nf1.format(v)}`, full: v => sgn1(v), last: () => lastMonth() },
};
// legend wording: [what, centre, low end, high end]
const LEGEND = ES ? {
  prima: ['Prima en pb', 'referencia', 'por debajo de la referencia', 'más prima'],
  infl: ['Inflación anual en %', 'objetivo del 2 %', 'por debajo del objetivo', 'más inflación'],
  def: ['Saldo público en % del PIB', 'límite del −3 %', 'más déficit', 'menos déficit o superávit'],
  pib: ['Crecimiento del PIB real en %', 'sin crecimiento', 'caída del PIB', 'más crecimiento'],
} : {
  prima: ['Premium in bp', 'reference', 'below the reference', 'higher premium'],
  infl: ['Annual inflation in %', '2% target', 'below the target', 'more inflation'],
  def: ['Government balance in % of GDP', '−3% limit', 'bigger deficit', 'smaller deficit or surplus'],
  pib: ['Real GDP growth in %', 'no growth', 'GDP falls', 'more growth'],
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
const cname = k => {
  if (k === 'U2') return tr('Media de la zona euro', 'Euro area average');
  if (!ES && REGION_EN) { try { return REGION_EN.of(k); } catch {} }
  return state.D.countries[k]?.n || k;
};
const byName = (a, b) => cname(a[0]).localeCompare(cname(b[0]), LOC);
const refName = () => state.vs === 'DE' ? tr('Alemania', 'Germany') : tr('la media de la zona euro', 'the euro area average');
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
// distances from the centre covered by the comparable scale ("up" = the worse side)
const FIXED = {
  prima: { up: FIXED_MAX, down: FIXED_NEG, ticks: [0, 50, 100, 200, 400, 600] },
  infl: { up: 8, down: 3, ticks: [2, 3, 4, 6, 8, 10] },
  def: { up: 9, down: 6, ticks: [-3, -4, -6, -8, -10, -12] },
  pib: { up: 10, down: 8, ticks: [0, -2, -4, -6, -10] },
};
const niceUp = (v, metric) => {
  const s = metric === 'prima' ? (v <= 50 ? 10 : v <= 150 ? 25 : v <= 400 ? 50 : 100) : v <= 2 ? 0.5 : 1;
  return Math.max(s, Math.ceil(v / s) * s);
};
function makeScale(values, metric = 'prima') {
  const { center: c, dir } = METRIC[metric], fija = state.scale === 'fija', floor = metric === 'prima' ? 10 : 0.5;
  const dist = v => dir * (v - c); // > 0 on the worse side of the centre
  const max = fija ? FIXED[metric].up : niceUp(Math.max(floor, ...values.map(dist)), metric);
  const neg = fija ? FIXED[metric].down : niceUp(Math.max(floor, ...values.map(v => -dist(v))), metric);
  const tPos = d => { const x = Math.min(Math.max(d, 0), max) / max; return fija ? Math.sqrt(x) : x; };
  const tNeg = d => { const x = Math.min(Math.max(d, 0), neg) / neg; return fija ? Math.sqrt(x) : x; };
  const step = max <= 2 ? 0.5 : 1;
  return { kind: fija ? 'fija' : 'mes', metric, center: c, dir, max, neg, dist, tPos, tNeg,
    fill: v => (dist(v) >= 0 ? heat(tPos(dist(v))) : cold(tNeg(-dist(v)))),
    pos: v => tPos(dist(v)),
    // percentages on whole (or half) points; the premium in quarters of its range
    ticks: fija ? FIXED[metric].ticks : metric === 'prima'
      ? [0, 0.25, 0.5, 0.75, 1].map(f => c + f * max)
      : Array.from({ length: Math.round(max / step) + 1 }, (_, i) => c + dir * i * step) };
}
let scale = null;
const fillOf = v => scale.fill(v);

// ---------- controls ----------
function buildControls() {
  const sel = $('country'); clear(sel);
  Object.entries(state.D.countries).filter(([k]) => k !== state.vs).sort(byName)
    .forEach(([k]) => sel.append(el('option', { value: k, text: cname(k) })));
  sel.value = state.country;
  sel.onchange = () => { setCountry(sel.value); };
  const rg = $('ranges'); clear(rg);
  for (const [k, n] of RANGES) {
    const b = el('button', { 'aria-pressed': String(state.range === k), text: n });
    b.onclick = () => { state.range = k; rg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); writeHash(); renderTrend(); renderDecisions(); replay(['trend']); };
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
  replay(['hero', 'trend']);
}
// play the entrance again on cards already on screen (new country, period or map metric)
function replay(ids) {
  if (!window.HLMotion) return;
  for (const id of ids) { const c = $(id); if (c && c.classList.contains('hl-seen')) window.HLMotion.replay(c); }
}

// ---------- hero ----------
function renderHero() {
  const h = $('hero'); clear(h);
  const k = state.country, L = lastMonth();
  const now = prem(k, L), m1 = prem(k, addMonths(L, -1)), m12 = prem(k, addMonths(L, -12));
  let max = null;
  for (const m of monthsIn(inEuro(k, '2099-01') ? state.D.countries[k].euro : '1999-01', L)) { const v = prem(k, m); if (v != null && (!max || v > max.v)) max = { v, m }; }
  const dfr = state.D.rates.dfr.at(-1);
  const pills = [tr('Zona euro', 'Euro area'), `${Object.keys(state.D.countries).length} ${tr('países', 'countries')}`, tr('BCE · Eurostat', 'ECB · Eurostat'), `${tr('Datos hasta', 'Data to')} ${mShort(L)}`];
  const left = el('div', {}, [
    el('ul', { class: 'hl-pills', 'aria-label': tr('Datos clave', 'Key facts') }, pills.map(t => el('li', { text: t }))),
    el('p', { class: 'eyebrow', text: tr(`Prima de riesgo de ${cname(k)} frente a ${refName()} · ${mLong(L)}`, `Risk premium of ${cname(k)} against ${refName()} · ${mLong(L)}`) }),
    el('p', { class: 'hero-num' }, [now == null ? '–' : String(Math.round(now)), el('small', { text: BP })]),
    el('p', { class: 'sub', text: `${tr('Bono a 10 años', '10-year bond')}: ${pct(byMonth[k]?.get(L))} · ${state.vs === 'DE' ? tr('Alemania', 'Germany') : tr('Zona euro', 'Euro area')}: ${pct(byMonth[state.vs]?.get(L))} · ${tr('media mensual del BCE', 'ECB monthly average')}` }),
  ]);
  const tile = (l, v, d) => el('div', { class: 'tile' }, [el('div', { class: 'l', text: l }), el('div', { class: 'v', text: v }), d ? el('div', { class: 'd', text: d }) : null]);
  const tiles = el('div', { class: 'tiles' }, [
    tile(tr('Hace un mes', 'A month ago'), sbp(now != null && m1 != null ? now - m1 : null), m1 != null ? bp(m1) : ''),
    tile(tr('Hace un año', 'A year ago'), sbp(now != null && m12 != null ? now - m12 : null), m12 != null ? bp(m12) : ''),
    tile(tr('Máximo desde el euro', 'Highest since the euro'), max ? bp(max.v) : '–', max ? mShort(max.m) : ''),
    tile(tr('Tipo de depósito BCE', 'ECB deposit rate'), pct(dfr[1]), tr(`desde el ${dLong(dfr[0])}`, `since ${dLong(dfr[0])}`)),
    tile(ES ? `Inflación ${k === 'U2' ? 'zona euro' : cname(k)}` : `Inflation, ${k === 'U2' ? 'euro area' : cname(k)}`, pct1(infl(k, lastInfl())), `${k === 'U2' ? '' : tr('zona euro ', 'euro area ') + pct1(infl('U2', lastInfl())) + ' · '}${mShort(lastInfl())}`),
    tile(tr(`Saldo público ${lastDefYear()}`, `Government balance ${lastDefYear()}`), pct1(defBy[k]?.get(lastDefYear())), `${tr('% del PIB', '% of GDP')}${k === 'U2' ? '' : tr(' · zona euro ', ' · euro area ') + pct1(defBy.U2.get(lastDefYear()))}`),
    (() => { const q = lastQuarter(k); return tile(tr(`PIB ${lastGdpYear()}`, `GDP ${lastGdpYear()}`), sgn1(gdpG[k]?.get(lastGdpYear())), q ? `${qLabel(q[0])}: ${sgn1(q[1])} ${tr('interanual', 'year on year')}` : (k === 'U2' ? '' : tr('zona euro ', 'euro area ') + sgn1(gdpG.U2.get(lastGdpYear())))); })(),
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
  $('trendTitle').textContent = tr(`Prima de riesgo frente a ${refName()}`, `Risk premium against ${refName()}`);

  // legend: toggle countries, add more from a list
  const lg = $('legend'); clear(lg);
  for (const k of state.active) {
    const b = el('button', { 'aria-pressed': 'true', title: tr('Quitar de la gráfica', 'Remove from the chart') }, [el('i', { class: 'key', style: `background:${colorOf(k)}` }), cname(k), el('span', { class: 'v', text: bp(prem(k, to)) }), ' ×']);
    b.onclick = () => { if (state.active.length > 1) { state.active = state.active.filter(x => x !== k); writeHash(); renderTrend(); } };
    lg.append(b);
  }
  if (state.active.length < 8) {
    const add = el('select', { 'aria-label': tr('Añadir país a la gráfica', 'Add a country to the chart') }, [el('option', { value: '', text: tr('+ Añadir país', '+ Add country') }),
      ...Object.entries(state.D.countries).filter(([k]) => k !== state.vs && !state.active.includes(k)).sort(byName).map(([k]) => el('option', { value: k, text: cname(k) }))]);
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
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': tr(`Prima de riesgo de ${state.active.map(cname).join(', ')} frente a ${refName()}`, `Risk premium of ${state.active.map(cname).join(', ')} against ${refName()}`) });
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
    { id: 'ea', name: tr('Inflación zona euro', 'Euro area inflation'), color: css('--muted'), v: mm => infl('U2', mm) },
    ...(k0 !== 'U2' ? [{ id: 'cty', name: tr(`Inflación ${cname(k0)}`, `Inflation, ${cname(k0)}`), color: colorOf(k0), v: mm => infl(k0, mm) }] : []),
  ];
  const rv = [rateAt(state.D.rates.dfr, dayFrom) ?? 0, ...state.D.rates.dfr.filter(([d]) => d >= dayFrom).map(r => r[1]),
    ...lines.flatMap(l => inflMonths.map(l.v).filter(v => v != null))];
  let rlo = Math.min(0, ...rv), rhi = Math.max(1, ...rv);
  const rstep = niceStep(rhi - rlo, 4); rlo = Math.floor(rlo / rstep) * rstep; rhi = Math.ceil(rhi / rstep) * rstep;
  const rys = v => m.t + (rhi - v) / (rhi - rlo) * (RH - m.t - m.b);
  const rsvg = S('svg', { viewBox: `0 0 ${W} ${RH}`, height: RH, role: 'img', 'aria-label': tr(`Tipo de depósito del BCE e inflación de ${cname(k0)} y de la zona euro`, `ECB deposit rate and inflation in ${cname(k0)} and the euro area`) });
  for (let v = rlo; v <= rhi + 1e-9; v += rstep) {
    rsvg.append(S('line', { x1: m.l, x2: W - m.r, y1: rys(v), y2: rys(v), class: Math.abs(v) < 1e-9 ? 'zero-line' : 'grid-line' }));
    rsvg.append(S('text', { x: m.l - 6, y: rys(v) + 4, 'text-anchor': 'end', class: 'tick', text: nf2.format(v).replace(/[,.]00$/, '') }));
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
    if (last != null) rEnds.push({ name: l.id === 'ea' ? tr('Zona euro', 'Euro area') : cname(k0), v: last, y: rys(last), unit: '%' });
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
  rEnds.push({ name: tr('Depósito BCE', 'ECB deposit'), v, y: rys(v) });
  if (!narrow) {
    // three labels at most: spread them just enough to stay legible, keeping their order
    rEnds.sort((a, b) => a.y - b.y);
    for (let i = 1; i < rEnds.length; i++) if (rEnds[i].y - rEnds[i - 1].y < 14) rEnds[i].y = rEnds[i - 1].y + 14;
    for (const e of rEnds) rsvg.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [e.name + ' ', S('tspan', { text: nf1.format(e.v) })]));
  }
  rh.append(rsvg);
  const key = $('ratesKey'); clear(key);
  key.append(el('span', {}, [el('i', { style: `background:${css('--ink')};height:2.5px` }), tr('Tipo de depósito del BCE', 'ECB deposit rate')]));
  for (const l of lines) key.append(el('span', {}, [el('i', { style: `background:${l.color}` }), l.name]));
  key.append(el('span', {}, [el('i', { style: `background:${css('--muted')};height:1px;opacity:.6` }), tr('Objetivo de inflación del BCE (2 %)', 'ECB inflation target (2%)')]));
  key.append(el('span', { text: tr('Tramo más claro en la prima: antes de que el país adoptara el euro.', 'Lighter stretch of the premium: before the country adopted the euro.') }));

  const yAxis = (s, lo, hi, step, ysf, Hh, fmtTick) => {
    for (let v = lo; v <= hi + 1e-9; v += step) {
      s.append(S('line', { x1: m.l, x2: W - m.r, y1: ysf(v), y2: ysf(v), class: Math.abs(v) < 1e-9 ? 'zero-line' : 'grid-line' }));
      s.append(S('text', { x: m.l - 6, y: ysf(v) + 4, 'text-anchor': 'end', class: 'tick', text: fmtTick(v) }));
    }
    axisYears(s, t0, t1, xs, Hh, m);
  };
  // end labels, the selected country first, others only where they do not touch a placed label
  const endLabels = (s, ends, valFmt) => {
    if (narrow) return;
    const placed = [];
    for (const e of [...ends].sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0))) {
      if (placed.some(y => Math.abs(y - e.y) < 14)) continue;
      placed.push(e.y);
      s.append(S('text', { x: W - m.r + 10, y: e.y + 4, class: 'end-lbl' }, [e.name + ' ', S('tspan', { text: valFmt(e.v) })]));
    }
  };

  // inflation accumulated since the start of the period, and what a deposit at the ECB rate earned meanwhile
  const ch = $('cumChart'); clear(ch);
  const base = months.find(mm => hicpBy.U2?.has(mm)) || state.D.hicp.U2[0][0];
  $('cumTitle').textContent = tr(`Inflación acumulada desde ${mShort(base)} (%)`, `Accumulated inflation since ${mShort(base)} (%)`);
  const cMonths = monthsIn(base, lastInfl() > to ? lastInfl() : to);
  const cum = (k, mm) => { const a = hicpBy[k]?.get(base), b = hicpBy[k]?.get(mm); return a && b ? (b / a - 1) * 100 : null; };
  const depAcc = new Map(); { let f = 1; for (const mm of cMonths) { depAcc.set(mm, (f - 1) * 100); f *= 1 + (rateAt(state.D.rates.dfr, mm + '-15') || 0) / 100 / 12; } }
  const cumLines = [...state.active.map(k => ({ k, name: cname(k), color: colorOf(k), w: 2 })), { k: 'U2', name: tr('Zona euro', 'Euro area'), color: css('--muted'), w: 2 }];
  const CH = narrow ? 200 : 230;
  const cv = [...cumLines.flatMap(l => cMonths.map(mm => cum(l.k, mm)).filter(v => v != null)), ...depAcc.values()];
  let clo = Math.min(0, ...cv), chi = Math.max(5, ...cv);
  const cstep = niceStep(chi - clo, 4); clo = Math.floor(clo / cstep) * cstep; chi = Math.ceil(chi / cstep) * cstep;
  const cys = v => m.t + (chi - v) / (chi - clo) * (CH - m.t - m.b);
  const csvg = S('svg', { viewBox: `0 0 ${W} ${CH}`, height: CH, role: 'img', 'aria-label': tr(`Inflación acumulada desde ${mShort(base)}`, `Accumulated inflation since ${mShort(base)}`) });
  yAxis(csvg, clo, chi, cstep, cys, CH, v => String(Math.round(v)));
  const cEnds = [];
  const drawLine = (s, ysf, valOf, color, width, mlist) => {
    let d = '', pen = false, last = null;
    for (const mm of mlist) { const v = valOf(mm); if (v == null) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${xs(tMonth(mm)).toFixed(1)},${ysf(v).toFixed(1)}`; pen = true; last = v; }
    if (d) s.append(S('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    return last;
  };
  for (const l of cumLines) { const last = drawLine(csvg, cys, mm => cum(l.k, mm), l.color, l.w, cMonths); if (last != null) cEnds.push({ name: l.name, v: last, y: cys(last), first: l.k === k0 }); }
  const lastDep = drawLine(csvg, cys, mm => depAcc.get(mm), css('--ink'), 2.5, cMonths);
  cEnds.push({ name: tr('Depósito BCE', 'ECB deposit'), v: lastDep, y: cys(lastDep) });
  endLabels(csvg, cEnds, v => `${v >= 0 ? '+' : ''}${Math.round(v)}${P}`);
  ch.append(csvg);
  const ckey = $('cumKey'); clear(ckey);
  for (const l of cumLines) ckey.append(el('span', {}, [el('i', { style: `background:${l.color}` }), ES ? `Precios ${l.k === 'U2' ? 'zona euro' : l.name}` : `Prices, ${l.k === 'U2' ? 'euro area' : l.name}`]));
  ckey.append(el('span', {}, [el('i', { style: `background:${css('--ink')};height:2.5px` }), tr('Rendimiento acumulado al tipo de depósito del BCE', 'Accumulated return at the ECB deposit rate')]));

  // yearly values: one bar per year for the selected country, the euro area as a line with dots
  const yearX = y => xs(Date.UTC(+y, 6, 1));
  const barW = Math.max(3, Math.min(24, (xs(Date.UTC(2001, 0, 1)) - xs(Date.UTC(2000, 0, 1))) * 0.6));
  function yearBars({ host, keyHost, get, firstYear, lastYear, Hh, floorLo, floorHi, refLine, refName: refTxt, label, barTxt, unit }) {
    const hostEl = $(host); clear(hostEl);
    const yFirst = Math.max(+months[0].slice(0, 4), +firstYear), yLast = +lastYear;
    const years = []; for (let y = yFirst; y <= yLast; y++) years.push(String(y));
    const vals = [...years.map(y => get(k0, y)), ...years.map(y => get('U2', y))].filter(v => v != null);
    let lo = Math.min(floorLo, ...vals), hi = Math.max(floorHi, ...vals);
    const step = niceStep(hi - lo, 4); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const ysf = v => m.t + (hi - v) / (hi - lo) * (Hh - m.t - m.b);
    const s = S('svg', { viewBox: `0 0 ${W} ${Hh}`, height: Hh, role: 'img', 'aria-label': label });
    yAxis(s, lo, hi, step, ysf, Hh, v => String(Math.round(v)));
    if (refLine != null && refLine >= lo && refLine <= hi) s.append(S('line', { x1: m.l, x2: W - m.r, y1: ysf(refLine), y2: ysf(refLine), class: 'target-line' }));
    const r = Math.min(4, barW / 2);
    for (const y of years) {
      const v = get(k0, y); if (v == null || Math.abs(v) < 0.05) continue;
      const x = yearX(y) - barW / 2, y0 = ysf(0), y1 = ysf(v), rr = Math.min(r, Math.abs(y1 - y0));
      // square at the zero line, rounded at the data end
      const d = v < 0
        ? `M${x},${y0}V${y1 - rr}Q${x},${y1} ${x + rr},${y1}H${x + barW - rr}Q${x + barW},${y1} ${x + barW},${y1 - rr}V${y0}Z`
        : `M${x},${y0}V${y1 + rr}Q${x},${y1} ${x + rr},${y1}H${x + barW - rr}Q${x + barW},${y1} ${x + barW},${y1 + rr}V${y0}Z`;
      s.append(S('path', { d, fill: colorOf(k0) }));
    }
    let eaPath = '', eaLast = null;
    for (const y of years) { const v = get('U2', y); if (v == null) continue; eaPath += `${eaPath ? 'L' : 'M'}${yearX(y).toFixed(1)},${ysf(v).toFixed(1)}`; eaLast = v; }
    if (k0 !== 'U2') {
      s.append(S('path', { d: eaPath, fill: 'none', stroke: css('--muted'), 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      for (const y of years) { const v = get('U2', y); if (v != null) s.append(S('circle', { cx: yearX(y), cy: ysf(v), r: 3, fill: css('--muted'), stroke: css('--surface'), 'stroke-width': 1.5 })); }
    }
    const ends = [{ name: cname(k0), v: get(k0, String(yLast)), first: true }, ...(k0 !== 'U2' && eaLast != null ? [{ name: tr('Zona euro', 'Euro area'), v: eaLast }] : [])].filter(e => e.v != null).map(e => ({ ...e, y: ysf(e.v) }));
    endLabels(s, ends, v => `${v > 0 && unit === 'growth' ? '+' : ''}${nf1.format(v)}${P}`);
    hostEl.append(s);
    const k = $(keyHost); clear(k);
    k.append(el('span', {}, [el('i', { style: `background:${colorOf(k0)};height:10px;width:10px;border-radius:2px` }), `${cname(k0)} (${barTxt})`]));
    if (k0 !== 'U2') k.append(el('span', {}, [el('i', { style: `background:${css('--muted')}` }), tr('Zona euro (EA20)', 'Euro area (EA20)')]));
    if (refTxt) k.append(el('span', {}, [el('i', { style: `background:${css('--muted')};height:1px;opacity:.6` }), refTxt]));
    k.append(el('span', { text: tr(`Datos anuales hasta ${yLast}.`, `Yearly data to ${yLast}.`) }));
    return [s, Hh];
  }

  // real GDP growth, then real GDP accumulated since the start of the period
  const [gsvg, GH] = yearBars({ host: 'gdpChart', keyHost: 'gdpKey', get: (k, y) => gdpG[k]?.get(y) ?? null, firstYear: state.D.gdp.growth.U2[0][0], lastYear: lastGdpYear(),
    Hh: narrow ? 190 : 220, floorLo: -1, floorHi: 3, label: tr(`Crecimiento del PIB real de ${cname(k0)} y de la zona euro`, `Real GDP growth of ${cname(k0)} and the euro area`), barTxt: tr('barras', 'bars'), unit: 'growth' });
  const ah = $('gdpCumChart'); clear(ah);
  const gBase = String(Math.max(+months[0].slice(0, 4), +state.D.gdp.volume.U2[0][0]));
  $('gdpCumTitle').textContent = tr(`PIB real acumulado desde ${gBase} (%)`, `Accumulated real GDP since ${gBase} (%)`);
  const gYears = []; for (let y = +gBase; y <= +lastGdpYear(); y++) gYears.push(String(y));
  const gcum = (k, y) => { const a = gdpV[k]?.get(gBase), b = gdpV[k]?.get(y); return a && b ? (b / a - 1) * 100 : null; };
  const gLines = [...state.active.map(k => ({ k, name: cname(k), color: colorOf(k) })), { k: 'U2', name: tr('Zona euro', 'Euro area'), color: css('--muted') }];
  const AH = narrow ? 200 : 230;
  const av = gLines.flatMap(l => gYears.map(y => gcum(l.k, y)).filter(v => v != null));
  let alo = Math.min(0, ...av), ahi = Math.max(5, ...av);
  const astep = niceStep(ahi - alo, 4); alo = Math.floor(alo / astep) * astep; ahi = Math.ceil(ahi / astep) * astep;
  const ays = v => m.t + (ahi - v) / (ahi - alo) * (AH - m.t - m.b);
  const asvg = S('svg', { viewBox: `0 0 ${W} ${AH}`, height: AH, role: 'img', 'aria-label': tr(`PIB real acumulado desde ${gBase}`, `Accumulated real GDP since ${gBase}`) });
  yAxis(asvg, alo, ahi, astep, ays, AH, v => String(Math.round(v)));
  const aEnds = [];
  for (const l of gLines) {
    let d = '', last = null;
    for (const y of gYears) { const v = gcum(l.k, y); if (v == null) continue; d += `${d ? 'L' : 'M'}${yearX(y).toFixed(1)},${ays(v).toFixed(1)}`; last = v; }
    if (!d) continue;
    asvg.append(S('path', { d, fill: 'none', stroke: l.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (last != null) { asvg.append(S('circle', { cx: yearX(lastGdpYear()), cy: ays(last), r: 4, fill: l.color, stroke: css('--surface'), 'stroke-width': 2 })); aEnds.push({ name: l.name, v: last, y: ays(last), first: l.k === k0 }); }
  }
  endLabels(asvg, aEnds, v => `${v >= 0 ? '+' : ''}${Math.round(v)}${P}`);
  ah.append(asvg);
  const akey = $('gdpCumKey'); clear(akey);
  for (const l of gLines) akey.append(el('span', {}, [el('i', { style: `background:${l.color}` }), l.name]));
  akey.append(el('span', { text: tr(`Volumen encadenado, datos anuales hasta ${lastGdpYear()}.`, `Chain-linked volume, yearly data to ${lastGdpYear()}.`) }));

  // government balance, % of GDP
  const [dsvg, DH] = yearBars({ host: 'defChart', keyHost: 'defKey', get: (k, y) => defBy[k]?.get(y) ?? null, firstYear: state.D.deficit.U2[0][0], lastYear: lastDefYear(),
    Hh: narrow ? 190 : 220, floorLo: -4, floorHi: 1, refLine: -3, refName: tr('Límite de la UE: déficit del 3 %', 'EU limit: 3% deficit'), label: tr(`Saldo público de ${cname(k0)} y de la zona euro, % del PIB`, `Government balance of ${cname(k0)} and the euro area, % of GDP`), barTxt: tr('barras; negativo = déficit', 'bars; negative = deficit') });

  // shared crosshair across all the charts
  const charts = [[svg, H], [rsvg, RH], [csvg, CH], [gsvg, GH], [asvg, AH], [dsvg, DH]];
  const guides = charts.map(([s]) => { const g = S('line', { class: 'guide', visibility: 'hidden' }); s.append(g); return g; });
  let cur = months.length - 1;
  const at = (i, ev) => {
    cur = Math.max(0, Math.min(months.length - 1, i));
    const mm = months[cur], x = xs(tMonth(mm));
    guides.forEach((g, j) => { g.setAttribute('x1', x); g.setAttribute('x2', x); g.setAttribute('y1', m.t); g.setAttribute('y2', charts[j][1] - m.b); g.setAttribute('visibility', 'visible'); });
    const r = svg.getBoundingClientRect();
    const e = ev || { clientX: r.left + x * r.width / W, clientY: r.top + 30 };
    showTip(e, t => {
      t.append(el('div', { class: 'h', text: mLong(mm) }));
      state.active.map(k => [k, prem(k, mm)]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => t.append(tipRow(colorOf(k), cname(k) + (inEuro(k, mm) ? '' : tr(' (antes del euro)', ' (before the euro)')), bp(v))));
      t.append(el('div', { class: 'sep' }));
      const day = mm + '-15', dep = rateAt(state.D.rates.dfr, day), ea = infl('U2', mm), ci = infl(k0, mm);
      t.append(tipRow(css('--ink'), tr('Depósito BCE', 'ECB deposit'), pct(dep)));
      t.append(tipRow(css('--muted'), tr('Inflación zona euro', 'Euro area inflation'), pct1(ea)));
      if (k0 !== 'U2') t.append(tipRow(colorOf(k0), tr(`Inflación ${cname(k0)}`, `Inflation, ${cname(k0)}`), pct1(ci)));
      if (dep != null && ea != null) t.append(tipRow('transparent', tr('Tipo real (depósito − inflación zona euro)', 'Real rate (deposit − euro area inflation)'), pct1(dep - ea)));
      t.append(el('div', { class: 'sep' }));
      const sign = v => v == null ? '–' : `${v >= 0 ? '+' : ''}${nf1.format(v)}${P}`;
      t.append(el('div', { class: 'h', text: tr(`Desde ${mShort(base)}`, `Since ${mShort(base)}`) }));
      t.append(tipRow(colorOf(k0), tr(`Precios ${cname(k0)}`, `Prices, ${cname(k0)}`), sign(cum(k0, mm))));
      if (k0 !== 'U2') t.append(tipRow(css('--muted'), tr('Precios zona euro', 'Prices, euro area'), sign(cum('U2', mm))));
      t.append(tipRow(css('--ink'), tr('Depósito al tipo del BCE', 'Deposit at the ECB rate'), sign(depAcc.get(mm))));
      t.append(el('div', { class: 'sep' }));
      const gy = gdpYear(mm);
      t.append(el('div', { class: 'h', text: `${tr('PIB real', 'Real GDP')} ${gy}${mm.slice(0, 4) > lastGdpYear() ? tr(' (último publicado)', ' (latest published)') : ''}` }));
      t.append(tipRow(colorOf(k0), tr(`Crecimiento ${cname(k0)}`, `Growth, ${cname(k0)}`), sgn1(gdpG[k0]?.get(gy))));
      if (k0 !== 'U2') t.append(tipRow(css('--muted'), tr('Crecimiento zona euro', 'Growth, euro area'), sgn1(gdpG.U2?.get(gy))));
      t.append(tipRow(colorOf(k0), tr(`Acumulado desde ${gBase}`, `Accumulated since ${gBase}`), sgn1(gcum(k0, gy))));
      t.append(el('div', { class: 'sep' }));
      const yy = mm.slice(0, 4);
      t.append(el('div', { class: 'h', text: `${tr('Saldo público', 'Government balance')} ${yy > lastDefYear() ? lastDefYear() + tr(' (último publicado)', ' (latest published)') : yy}` }));
      t.append(tipRow(colorOf(k0), cname(k0), `${def(k0, mm) == null ? '–' : nf1.format(def(k0, mm)) + P + tr(' del PIB', ' of GDP')}`));
      if (k0 !== 'U2') t.append(tipRow(css('--muted'), tr('Zona euro', 'Euro area'), `${def('U2', mm) == null ? '–' : nf1.format(def('U2', mm)) + P}`));
    });
  };
  const near = (ev, s, w) => { const r = s.getBoundingClientRect(); const px = (ev.clientX - r.left) * w / r.width; let b = 0, bd = 1e12; months.forEach((mm, i) => { const d = Math.abs(xs(tMonth(mm)) - px); if (d < bd) { bd = d; b = i; } }); return b; };
  for (const [s, h] of charts) {
    const hit = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: h - m.t - m.b, class: 'hit', tabindex: 0, 'aria-label': tr('Valores por mes; usa las flechas izquierda y derecha', 'Values by month; use the left and right arrow keys') });
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
    el('thead', {}, [el('tr', {}, [el('th', { text: tr('Mes', 'Month') }), ...state.active.map(k => el('th', { text: `${cname(k)} (${BP})` })), el('th', { text: tr('Depósito BCE', 'ECB deposit') }), el('th', { text: tr(`Inflación ${cname(k0)}`, `Inflation, ${cname(k0)}`) }), el('th', { text: tr('Inflación zona euro', 'Euro area inflation') }), el('th', { text: tr(`Precios desde ${mShort(base)}`, `Prices since ${mShort(base)}`) }), el('th', { text: tr('PIB real (año)', 'Real GDP (year)') }), el('th', { text: tr('Saldo público (año)', 'Government balance (year)') })])]),
    el('tbody', {}, rows.map(mm => el('tr', {}, [el('td', { text: mShort(mm) }), ...state.active.map(k => el('td', { text: bp(prem(k, mm)) })), el('td', { text: pct(rateAt(state.D.rates.dfr, mm + '-15')) }), el('td', { text: pct1(infl(k0, mm)) }), el('td', { text: pct1(infl('U2', mm)) }),
      el('td', { text: cum(k0, mm) == null ? '–' : `+${nf1.format(cum(k0, mm))}${P}` }), el('td', { text: `${sgn1(growth(k0, mm))} (${gdpYear(mm)})` }), el('td', { text: def(k0, mm) == null ? '–' : `${nf1.format(def(k0, mm))}${P} (${defYear(mm)})` })]))),
  ]);
  det.append(el('div', { class: 'table-wrap' }, [tbl]));
}

// ---------- map + ranking (same month) ----------
const mapLast = () => METRIC[state.metric].last();
const mapMonthNow = () => { const L = mapLast(); return state.mapMonth && state.mapMonth <= L ? state.mapMonth : L; };
const metricHint = () => state.metric === 'infl' ? tr('inflación anual (IPCA) · objetivo del BCE: 2 %', 'annual inflation (HICP) · ECB target: 2%')
  : state.metric === 'def' ? tr('saldo público, % del PIB · límite de la UE: déficit del 3 %', 'government balance, % of GDP · EU limit: 3% deficit')
  : state.metric === 'pib' ? tr('crecimiento del PIB real, % anual', 'real GDP growth, % a year') : tr(`prima frente a ${refName()}`, `premium against ${refName()}`);
const mapTitle = mm => state.metric === 'def' ? `${tr('año', 'year')} ${defYear(mm)}` : state.metric === 'pib' ? `${tr('año', 'year')} ${gdpYear(mm)}` : mLong(mm);

function renderMap() {
  const card = $('mapCard'); clear(card);
  const isPrima = state.metric === 'prima', MT = METRIC[state.metric];
  const M = state.map, all = monthsIn('1999-01', mapLast());
  const mm = mapMonthNow();
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: `${tr('Mapa', 'Map')} · ${mapTitle(mm)}` }), el('span', { class: 'hint', text: metricHint() })]));
  const mseg = el('div', { class: 'seg scale-seg', role: 'group', 'aria-label': tr('Qué muestra el mapa', 'What the map shows') });
  for (const [k, n] of [['prima', tr('Prima de riesgo', 'Risk premium')], ['infl', tr('Inflación', 'Inflation')], ['def', tr('Déficit público', 'Public deficit')], ['pib', tr('PIB', 'GDP')]]) {
    const b = el('button', { 'aria-pressed': String(state.metric === k), text: n });
    b.onclick = () => { state.metric = k; writeHash(); renderMap(); renderRank(); replay(['mapCard', 'rankCard']); };
    mseg.append(b);
  }
  card.append(mseg);
  const ctl = el('div', { class: 'map-ctl' });
  const play = el('button', { class: 'play', 'aria-label': state.playing ? tr('Pausar', 'Pause') : tr('Reproducir la evolución', 'Play the evolution'), text: state.playing ? '❚❚' : '▶' });
  const slider = el('input', { type: 'range', min: 0, max: all.length - 1, value: all.indexOf(mm), 'aria-label': tr('Mes del mapa', 'Month on the map'), 'aria-valuetext': mLong(mm) });
  const lbl = el('span', { class: 'month', text: mShort(mm) });
  ctl.append(play, slider, lbl);
  card.append(ctl);
  const seg = el('div', { class: 'seg scale-seg', role: 'group', 'aria-label': tr('Escala de colores', 'Colour scale') });
  for (const [k, n] of [['mes', tr('Escala de este mes', "This month's scale")], ['fija', tr('Comparable en el tiempo', 'Comparable over time')]]) {
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
  const svg = S('svg', { viewBox: M.focus.join(' '), class: 'map-svg', role: 'group', 'aria-label': `${tr('Mapa', 'Map')}: ${metricHint()}, ${mLong(mm)}` });
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
      'aria-label': `${cname(code)}: ${isRef ? tr('referencia', 'reference') : v == null ? tr('sin datos', 'no data') : MT.full(v)}` });
    const tipF = e => showTip(e, t => {
      t.append(el('div', { class: 'h', text: `${cname(code)} · ${mShort(mm)}` }));
      if (isRef) t.append(el('div', { text: tr('Referencia (0 pb)', 'Reference (0 bp)') }));
      else if (v == null) t.append(el('div', { text: tr('Sin datos ese mes', 'No data that month') }));
      else if (isPrima) {
        t.append(tipRow(fillOf(v), tr('Prima', 'Premium'), bp(v)));
        t.append(tipRow(css('--axis'), tr('Bono a 10 años', '10-year bond'), pct(byMonth[code].get(mm))));
        t.append(tipRow(css('--axis'), tr('Inflación', 'Inflation'), pct1(infl(code, mm))));
        if (!inEuro(code, mm)) t.append(el('div', { class: 'h', text: tr('Aún no usaba el euro', 'Not yet using the euro') }));
      } else if (state.metric === 'infl') {
        t.append(tipRow(fillOf(v), tr('Inflación anual', 'Annual inflation'), pct1(v)));
        t.append(tipRow(css('--axis'), tr('Zona euro', 'Euro area'), pct1(infl('U2', mm))));
        const pr = prem(code, mm);
        if (pr != null && code !== state.vs) t.append(tipRow(css('--axis'), tr('Prima de riesgo', 'Risk premium'), bp(pr)));
      } else if (state.metric === 'pib') {
        t.append(el('div', { class: 'h', text: `${tr('Año', 'Year')} ${gdpYear(mm)}` }));
        t.append(tipRow(fillOf(v), tr('Crecimiento del PIB real', 'Real GDP growth'), sgn1(v)));
        t.append(tipRow(css('--axis'), tr('Zona euro', 'Euro area'), sgn1(growth('U2', mm))));
        const q = lastQuarter(code);
        if (q) t.append(tipRow(css('--axis'), tr(`Último trimestre (${qLabel(q[0])}, interanual)`, `Latest quarter (${qLabel(q[0])}, year on year)`), sgn1(q[1])));
      } else {
        t.append(el('div', { class: 'h', text: `${tr('Año', 'Year')} ${defYear(mm)}` }));
        t.append(tipRow(fillOf(v), tr('Saldo público', 'Government balance'), `${nf1.format(v)}${P}${tr(' del PIB', ' of GDP')}`));
        t.append(tipRow(css('--axis'), tr('Zona euro', 'Euro area'), `${nf1.format(def('U2', mm))}${P}`));
        const pr = prem(code, mm);
        if (pr != null && code !== state.vs) t.append(tipRow(css('--axis'), `${tr('Prima de riesgo', 'Risk premium')} (${mShort(mm)})`, bp(pr)));
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
  // two-sided legend: values grow left to right, the centre (reference, target or limit) in the middle,
  // warm on the worse side; positions use the same mapping as the fills
  const flip = scale.dir < 0;
  const lp = v => { const d = scale.dist(v); const p = d >= 0 ? 0.5 + 0.5 * scale.tPos(d) : 0.5 - 0.5 * scale.tNeg(-d); return flip ? 1 - p : p; };
  const stops = Array.from({ length: 25 }, (_, i) => {
    const p = i / 24, q = flip ? 1 - p : p;
    return `${q >= 0.5 ? heat((q - 0.5) * 2) : cold((0.5 - q) * 2)} ${(p * 100).toFixed(1)}%`;
  }).join(', ');
  const c = scale.center, lowEnd = c - (flip ? scale.max : scale.neg), highEnd = c + (flip ? scale.neg : scale.max);
  const tickTxt = t => (isPrima ? String(Math.round(t)) : `${t > 0 && state.metric !== 'infl' ? '+' : ''}${nf1.format(t).replace(/,0$/, '')}`);
  let tv = [lowEnd, c, highEnd, ...scale.ticks].filter((t, i, a) => a.findIndex(x => Math.abs(x - t) < 1e-9) === i).sort((a, b) => a - b);
  // keep the ends and the centre, then add inner ticks only where they do not crowd a kept one
  const must = t => t === lowEnd || t === highEnd || Math.abs(t - c) < 1e-9;
  const keep = tv.filter(must);
  for (const t of tv) if (!must(t) && keep.every(k => Math.abs(lp(k) - lp(t)) > 0.09)) keep.push(t);
  tv = keep.sort((a, b) => a - b);
  const sat = scale.kind === 'fija';
  const ticks = el('div', { class: 'ramp-ticks' }, tv.map(t => el('span', { style: `left:${(lp(t) * 100).toFixed(1)}%`, class: t === lowEnd ? 'first' : t === highEnd ? 'last' : '',
    text: `${t === lowEnd && sat ? '≤ ' : ''}${tickTxt(t)}${t === highEnd && sat ? '+' : ''}` })));
  const [what, centreTxt, lowTxt, highTxt] = LEGEND[state.metric];
  const ramp = el('div', { class: 'ramp-box' }, [
    el('div', { class: 'ramp-title', text: `${what} · ${tr('centro', 'centre')}: ${centreTxt} · ${scale.kind === 'mes' ? tr('escala ajustada a este mes', 'scale fitted to this month') : tr('misma escala todos los meses', 'same scale every month')}` }),
    el('div', { class: 'ramp', style: `background:linear-gradient(90deg, ${stops})` }), ticks,
    el('div', { class: 'ramp-ends' }, [el('span', { text: `← ${lowTxt}` }), el('span', { text: `${highTxt} →` })])]);
  card.append(ramp);
  const lg = el('div', { class: 'map-legend' });
  if (isPrima) lg.append(el('span', {}, [el('i', { class: 'ref-key' }), state.vs === 'DE' ? tr('Alemania (referencia)', 'Germany (reference)') : tr('Referencia: media zona euro', 'Reference: euro area average')]));
  lg.append(el('span', {}, [el('i', { class: 'ctx-key' }), tr('Fuera del euro o sin datos', 'Outside the euro or no data')]));
  card.append(lg);
  card.append(el('p', { class: 'note', text: ES ? `${M.source} Pulsa un país para verlo en detalle; ▶ reproduce la evolución desde 2007 con la escala comparable.` : 'Borders: Natural Earth (public domain), 1:50m scale, simplified. Click a country to see it in detail; ▶ plays the evolution since 2007 on the comparable scale.' }));
}
function stop() { if (state.playing) { clearInterval(state.playing); state.playing = null; } }

function renderRank() {
  const card = $('rankCard'); clear(card);
  const isPrima = state.metric === 'prima', MT = METRIC[state.metric];
  const mm = mapMonthNow();
  const what = isPrima ? tr('pb frente a ', 'bp against ') + refName() : state.metric === 'infl' ? tr('inflación anual, %', 'annual inflation, %') : state.metric === 'pib' ? tr('crecimiento del PIB real, %', 'real GDP growth, %') : tr('saldo público, % del PIB (negativo = déficit)', 'government balance, % of GDP (negative = deficit)');
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: tr('Clasificación', 'Ranking') }), el('span', { class: 'hint', text: `${mapTitle(mm)} · ${what}` })]));
  // worst first: highest premium or inflation, largest deficit
  const rows = Object.keys(state.D.countries).filter(k => !isPrima || k !== state.vs).map(k => [k, MT.val(k, mm)]).filter(r => r[1] != null).sort((a, b) => (MT.desc ? 1 : MT.dir) * (b[1] - a[1]));
  if (!rows.length) { card.append(el('p', { class: 'note', text: tr('Sin datos para ese mes.', 'No data for that month.') })); return; }
  const mx = Math.max(...rows.map(r => r[1]), 1), mn = Math.min(0, ...rows.map(r => r[1]));
  const span = mx - mn, zero = -mn / span * 100;
  const box = el('div', { class: 'rank' });
  for (const [k, v] of rows) {
    const w = Math.abs(v) / span * 100;
    const bar = el('div', { class: 'bar ' + (v >= 0 ? 'pos' : 'neg'), style: (v >= 0 ? `left:${zero}%;width:${w}%` : `left:${zero - w}%;width:${w}%`) + (scale ? `;background:${fillOf(v)}` : '') });
    const b = el('button', { class: k === state.country ? 'on' : '', title: `${tr('Ver', 'See')} ${cname(k)}` }, [el('span', { class: 'nm', text: cname(k) }),
      el('span', { class: 'track' }, [el('span', { class: 'zero', style: `left:${zero}%` }), bar]), el('span', { class: 'val', text: MT.fmt(v) })]);
    b.onclick = () => setCountry(k);
    box.append(b);
  }
  card.append(box);
  if (state.metric === 'infl') card.append(el('p', { class: 'note', text: tr(`Zona euro: ${pct1(infl('U2', mm))}. Fuente: Eurostat.`, `Euro area: ${pct1(infl('U2', mm))}. Source: Eurostat.`) }));
  if (state.metric === 'def') card.append(el('p', { class: 'note', text: tr(`Zona euro: ${nf1.format(def('U2', mm))} %. El límite de la UE es un déficit del 3 % del PIB. Fuente: Eurostat (notificación de déficit excesivo).`, `Euro area: ${nf1.format(def('U2', mm))}%. The EU limit is a deficit of 3% of GDP. Source: Eurostat (excessive deficit notification).`) }));
  if (state.metric === 'pib') { const q = lastQuarter('U2'); card.append(el('p', { class: 'note', text: tr(`Zona euro: ${sgn1(growth('U2', mm))}${q ? ` (${qLabel(q[0])}: ${sgn1(q[1])} interanual)` : ''}. PIB real (volumen encadenado). Fuente: Eurostat.`, `Euro area: ${sgn1(growth('U2', mm))}${q ? ` (${qLabel(q[0])}: ${sgn1(q[1])} year on year)` : ''}. Real GDP (chain-linked volume). Source: Eurostat.`) })); }
  if (mm !== mapLast()) card.append(el('p', { class: 'note', text: tr('Mes elegido en el mapa. Mueve el control al final para ver el último dato.', 'Month chosen on the map. Move the slider to the end to see the latest data.') }));
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
  card.append(el('div', { class: 'card-head' }, [el('h2', { text: tr('Decisiones del BCE', 'ECB decisions') }), el('span', { class: 'hint', text: tr(`prima de ${cname(k)}: mes anterior y 3 meses después`, `premium of ${cname(k)}: the month before and 3 months after`) })]));
  const avg = sel => { const xs = dec.filter(sel).filter(x => x.pb != null && x.pa != null).map(x => x.pa - x.pb); return xs.length ? [xs.reduce((a, b) => a + b, 0) / xs.length, xs.length] : null; };
  const up = avg(x => x.ch > 0), down = avg(x => x.ch < 0);
  card.append(el('div', { class: 'summary' }, [
    el('div', {}, [el('b', { text: up ? sbp(up[0]) : '–' }), el('span', { text: up ? tr(`de media tras ${up[1]} subidas`, `on average after ${up[1]} rises`) : tr('sin subidas en el periodo', 'no rises in the period') })]),
    el('div', {}, [el('b', { text: down ? sbp(down[0]) : '–' }), el('span', { text: down ? tr(`de media tras ${down[1]} bajadas`, `on average after ${down[1]} cuts`) : tr('sin bajadas en el periodo', 'no cuts in the period') })]),
  ]));
  const shown = state.decAll ? dec : dec.slice(0, 10);
  const tbl = el('table', { class: 't' }, [
    el('thead', {}, [el('tr', {}, (ES ? ['Fecha', 'Depósito', 'Cambio', 'Prima antes', '3 meses después', 'Variación'] : ['Date', 'Deposit', 'Change', 'Premium before', '3 months later', 'Difference']).map(t => el('th', { text: t })))]),
    el('tbody', {}, shown.map(x => el('tr', {}, [el('td', { text: dLong(x.d) }), el('td', { text: pct(x.v) }),
      el('td', {}, [el('span', { class: 'arrow', 'aria-hidden': 'true', text: x.ch > 0 ? '▲' : '▼' }), sbp(x.ch)]),
      el('td', { text: bp(x.pb) }), el('td', { text: x.pa == null ? tr('aún no', 'not yet') : bp(x.pa) }), el('td', { text: x.pb != null && x.pa != null ? sbp(x.pa - x.pb) : '–' })]))),
  ]);
  card.append(el('div', { class: 'table-wrap' }, [tbl]));
  if (dec.length > 10) { const b = el('button', { class: 'show-more', text: state.decAll ? tr('Mostrar menos', 'Show fewer') : tr(`Mostrar las ${dec.length}`, `Show all ${dec.length}`) }); b.onclick = () => { state.decAll = !state.decAll; renderDecisions(); }; card.append(b); }
  card.append(el('p', { class: 'note', text: tr('Muestra lo que pasó, no por qué: en esos meses influyen muchos otros factores. El periodo elegido arriba filtra las decisiones.', 'It shows what happened, not why: many other factors weigh in those months. The period chosen above filters the decisions.') }));
}

// ---------- routing, theme ----------
function writeHash() {
  const h = `#${state.country}?vs=${state.vs}&r=${state.range}&c=${state.active.join(',')}${state.metric !== 'prima' ? '&v=' + state.metric : ''}`;
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
  if (['infl', 'prima', 'def', 'pib'].includes(p.get('v'))) state.metric = p.get('v');
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
  $('upd').textContent = tr(`Datos actualizados el ${new Date(D.updated).toLocaleDateString('es-ES')}; último mes publicado por el BCE: ${mLong(lastMonth())}.`, `Data updated on ${new Date(D.updated).toLocaleDateString('en-GB')}; latest month published by the ECB: ${mLong(lastMonth())}.`);
})();
