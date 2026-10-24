/* Hobby Lab landing page: theme toggle and the live previews in each project card. */
(function () {
  'use strict';
  var root = document.documentElement;
  var btn = document.getElementById('theme');
  function sync() { btn.setAttribute('aria-pressed', String(root.dataset.theme !== 'light')); }
  btn.addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  sync();

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, kids) {
    var e = tag === 'svg' || tag === 'circle' || tag === 'line' ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (var k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.append(c); });
    return e;
  }
  var fmt = new Intl.NumberFormat('en-GB');
  function getJson(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }
  // play the card's entrance again once its preview has arrived (if the card was already on screen)
  function reveal(id) { var c = document.getElementById(id); if (window.HLMotion && c && c.classList.contains('hl-seen')) window.HLMotion.replay(c); }

  // ---- Electómetro: today's Congress average as a small hemicycle ----
  function hemicycle(N, groups) {
    var rows = Math.max(2, Math.round(Math.sqrt(N / 3.2))), r0 = 0.38, radii = [], counts = [], i, sum = 0;
    for (i = 0; i < rows; i++) { radii.push(r0 + (1 - r0) * i / (rows - 1)); sum += radii[i]; }
    for (i = 0; i < rows; i++) counts.push(Math.round(N * radii[i] / sum));
    var diff = N - counts.reduce(function (a, b) { return a + b; }, 0);
    for (i = rows - 1; diff !== 0; i = (i - 1 + rows) % rows) { counts[i] += Math.sign(diff); diff -= Math.sign(diff); }
    var pts = [];
    radii.forEach(function (r, ri) { for (var j = 0; j < counts[ri]; j++) { var a = Math.PI * (1 - (counts[ri] === 1 ? 0.5 : j / (counts[ri] - 1))); pts.push({ a: a, r: r }); } });
    pts.sort(function (p, q) { return q.a - p.a || p.r - q.r; });
    var R = 200, pad = 8, rad = Math.max(1.6, (1 - r0) / (rows - 1) * R * 0.42);
    var svg = el('svg', { viewBox: '0 0 ' + (2 * R + 2 * pad) + ' ' + (R + 2 * pad) });
    var idx = 0;
    groups.forEach(function (g) {
      for (var s = 0; s < g[1] && idx < pts.length; s++, idx++) {
        var p = pts[idx];
        svg.append(el('circle', { cx: (pad + R + Math.cos(p.a) * p.r * R).toFixed(1), cy: (pad + R - Math.sin(p.a) * p.r * R).toFixed(1), r: rad.toFixed(2), fill: g[2] || '#8a96b2', class: 'seat' }));
      }
    });
    for (; idx < pts.length; idx++) { var q = pts[idx]; svg.append(el('circle', { cx: (pad + R + Math.cos(q.a) * q.r * R).toFixed(1), cy: (pad + R - Math.sin(q.a) * q.r * R).toFixed(1), r: rad.toFixed(2), fill: 'var(--axis)', class: 'seat' })); }
    var maj = Math.floor(N / 2) + 1;
    svg.append(el('line', { x1: pad + R, x2: pad + R, y1: pad - 2, y2: pad + R * (1 - r0) + 4, stroke: 'var(--ink-2)', 'stroke-width': 1, 'stroke-opacity': 0.5 }));
    return { svg: svg, maj: maj };
  }
  getJson('electometro/data/elections.json').then(function (idx) {
    var total = idx.elections.reduce(function (a, e) { return a + (e.total || 0); }, 0);
    document.getElementById('stat-polls').textContent = fmt.format(total);
    var e = idx.elections.find(function (x) { return x.id === 'es-congreso'; });
    if (!e || !e.sb) return;
    var T = e.sb.reduce(function (a, g) { return a + g[1]; }, 0), N = e.T || T;
    var h = hemicycle(N, e.sb);
    var top = e.sb.slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
    var cap = el('p', { class: 'cap' }, ['Congreso hoy: ']);
    top.forEach(function (g, i) { cap.append(el('b', { text: g[0] + ' ' }), el('span', { class: 'hl-num', text: String(g[1]) }), i < 2 ? ' · ' : ''); });
    cap.append(' · mayoría ' + h.maj);
    var pv = document.getElementById('pv-electometro');
    pv.append(el('div', { class: 'hemi' }, [h.svg]), cap);
    reveal('card-electometro');
  }).catch(function () {});

  // ---- Primómetro: this month's risk premium, highest first ----
  function heat(t) { // pale amber to deep red
    var a = [242, 214, 140], b = [196, 52, 40];
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
  }
  getJson('primometro/data/summary.json').then(function (s) {
    var rows = s.premia.slice(0, 6), es = s.premia.find(function (r) { return r[0] === 'ES'; });
    if (es && rows.indexOf(es) < 0) rows.push(es);
    var max = Math.max.apply(null, rows.map(function (r) { return r[2]; }).concat([1]));
    var bars = el('div', { class: 'bars' });
    rows.forEach(function (r) {
      bars.append(el('div', { class: 'bar-row' }, [el('span', { class: 'nm', text: r[1] }),
        el('div', { class: 'track' }, [el('i', { class: 'fill', style: 'width:' + Math.max(2, r[2] / max * 100) + '%;background:' + heat(Math.max(0, r[2]) / max) })]),
        el('span', { class: 'v hl-num', text: String(r[2]) })]));
    });
    var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var cap = el('p', { class: 'cap' }, ['Prima de riesgo frente a Alemania, ' + MES[+s.month.slice(5) - 1] + ' de ' + s.month.slice(0, 4) + ' (pb). Depósito BCE: ', el('b', { text: String(s.deposit[1]).replace('.', ',') + ' %' })]);
    var pv = document.getElementById('pv-primometro');
    pv.append(bars, cap);
    reveal('card-primometro');
  }).catch(function () {});

  // ---- Politicómetro: the topics it will compare, and the days left ----
  getJson('politicometro/config/topics.json').then(function (t) {
    document.getElementById('stat-topics').textContent = String(t.topics.length);
    var pv = document.getElementById('pv-politicometro');
    var chips = el('div', { class: 'topics' });
    t.topics.slice(0, 12).forEach(function (x) { chips.append(el('span', { class: 'chip', lang: 'es', text: x.name })); });
    var cd = el('div', { class: 'cd', role: 'timer' });
    pv.append(chips, el('div', { style: 'margin-top:12px' }, [cd]));
    if (window.HLMotion) window.HLMotion.countdown(cd, '2026-11-29T20:00:00+01:00', { one: 'day to the 29 November vote', many: 'days to the 29 November vote', done: 'Election day' });
    reveal('card-politicometro');
  }).catch(function () {});
})();
