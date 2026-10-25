/* Hobby Lab landing page: theme toggle and the live previews in each project card, in English or Spanish (shared/lang.js). */
(function () {
  'use strict';
  var root = document.documentElement;
  var L = window.HLLang || { lang: 'en', t: function (d, k) { return d.en[k]; }, apply: function () {} };
  var ES = L.lang === 'es';
  L.apply({ es: {
    _description: 'Pequeños proyectos de datos hechos en mi tiempo libre: la media de todas las encuestas de España, la prima de riesgo de la zona euro junto a los tipos del BCE, todas las monedas conmemorativas de 2 euros, los programas de los partidos comparados tema a tema y todas las emisiones de sellos de España en el BOE.',
    skip: 'Saltar al contenido', projects: 'Proyectos', dark: 'Modo oscuro', about: 'Sobre Hobby Lab', topics: 'Temas',
    pill1: 'Proyectos personales', pill2: 'Datos abiertos', pill3: 'Actualizados cada día',
    lead: 'Pequeños proyectos de datos que hago en mi tiempo libre, por curiosidad. Son experimentos personales, independientes de mis empleadores y de cualquier organización. Todos están en inglés y en español.',
    el_k: 'Elecciones · Encuestas', el_go: 'Abrir Electómetro →',
    el_d: 'Todas las encuestas publicadas por Electogrāfica, promediadas en un único parlamento: escaños, porcentaje de voto, mayorías de coalición, resultados oficiales frente a las encuestas y un mapa por provincias.',
    el_t: '<li>Encuestas</li><li>Visualización de datos</li><li>Datos abiertos</li>',
    pr_k: 'Economía · Zona euro', pr_go: 'Abrir Primómetro →',
    pr_d: 'La prima de riesgo, la inflación, el déficit público y el PIB de cada país de la zona euro, en un mapa de Europa y a lo largo del tiempo, junto a los tipos de interés del Banco Central Europeo.',
    pr_t: '<li>Deuda pública</li><li>BCE</li><li>Inflación</li><li>PIB</li>',
    do_k: 'Monedas · Zona euro', do_go: 'Abrir Doseurómetro →',
    do_d: 'Todas las monedas conmemorativas de 2 euros desde 2004, por año, país, tema o emisión común, con la descripción del diseño, la tirada y la fecha de emisión de la comunicación de la Comisión Europea en el Diario Oficial.',
    do_t: '<li>Numismática</li><li>Diario Oficial</li><li>Catálogo</li>',
    po_k: 'Elecciones · Programas', po_go: 'Abrir Politicómetro →',
    po_d: 'Qué propone cada partido para el 29 de noviembre, tema a tema y palabra por palabra: cada cita copiada literalmente del documento oficial, con enlace a su página.',
    po_t: '<li>Programas electorales</li><li>Comparación</li>',
    se_k: 'Sellos · España', se_go: 'Abrir Sellómetro →',
    se_d: 'Todas las emisiones de sellos de España desde 1850, por año, época y tema: desde 1960 con el texto oficial y los datos técnicos del Boletín Oficial del Estado, y con las imágenes del catálogo de FESOFI. Y una guía de las etiquetas ATM.',
    se_t: '<li>Filatelia</li><li>Boletín oficial</li><li>Catálogo</li>',
    lo_k: 'Lotería · España', lo_go: 'Abrir Loterómetro →',
    lo_d: 'Todos los sorteos de la Lotería Nacional publicados en el Boletín Oficial del Estado de 1960 a 2011: su fecha, tipo y programa de premios, y el primer premio de las listas oficiales de números premiados.',
    lo_t: '<li>Lotería Nacional</li><li>Boletín oficial</li><li>Historia</li>',
    data: 'Datos: Electogrāfica, Banco Central Europeo, Eurostat, Diario Oficial de la Unión Europea, Boletín Oficial del Estado. Cada proyecto cita sus fuentes.'
  } });
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
    var e =idx.elections.find(function (x) { return x.id === 'es-congreso'; });
    if (!e || !e.sb) return;
    var T = e.sb.reduce(function (a, g) { return a + g[1]; }, 0), N = e.T || T;
    var h = hemicycle(N, e.sb);
    var top = e.sb.slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
    var cap = el('p', { class: 'cap' }, [ES ? 'Congreso hoy: ' : 'Congress today: ']);
    top.forEach(function (g, i) { cap.append(el('b', { text: g[0] + ' ' }), el('span', { class: 'hl-num', text: String(g[1]) }), i < 2 ? ' · ' : ''); });
    cap.append((ES ? ' · mayoría ' : ' · majority ') + h.maj);
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
    var names = null;
    try { if (!ES) names = new Intl.DisplayNames(['en-GB'], { type: 'region' }); } catch (e) {}
    rows.forEach(function (r) {
      bars.append(el('div', { class: 'bar-row' }, [el('span', { class: 'nm', text: names ? names.of(r[0]) : r[1] }),
        el('div', { class: 'track' }, [el('i', { class: 'fill', style: 'width:' + Math.max(2, r[2] / max * 100) + '%;background:' + heat(Math.max(0, r[2]) / max) })]),
        el('span', { class: 'v hl-num', text: String(r[2]) })]));
    });
    var month = new Date(Date.UTC(+s.month.slice(0, 4), +s.month.slice(5) - 1, 15)).toLocaleDateString(ES ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var cap = el('p', { class: 'cap' }, ES
      ? ['Prima de riesgo frente a Alemania, ' + month + ' (pb). Depósito BCE: ', el('b', { text: String(s.deposit[1]).replace('.', ',') + ' %' })]
      : ['Risk premium against Germany, ' + month + ' (basis points). ECB deposit rate: ', el('b', { text: s.deposit[1] + '%' })]);
    var pv = document.getElementById('pv-primometro');
    pv.append(bars, cap);
    reveal('card-primometro');
  }).catch(function () {});

  // ---- Doseurómetro: one coin per country from the latest year; they flip in, then turn over one after another ----
  getJson('doseurometro/data/summary.json').then(function (s) {
    var row = el('div', { class: 'coins' });
    s.pick.forEach(function (c, i) {
      row.append(el('span', { class: 'coin', style: '--i:' + i }, [el('img', { src: 'doseurometro/' + c.image, alt: '', loading: 'lazy', decoding: 'async', width: 96, height: 96 })]));
    });
    var cap = el('p', { class: 'cap' }, ES
      ? [el('b', { class: 'hl-num', text: String(s.coins) }), ' monedas de ', el('b', { text: s.countries + ' países' }), ', de ' + s.from + ' a ' + s.to + '. Arriba, una por país de ' + s.to + '.']
      : [el('b', { class: 'hl-num', text: String(s.coins) }), ' coins from ', el('b', { text: s.countries + ' countries' }), ', ' + s.from + ' to ' + s.to + '. Above, one per country from ' + s.to + '.']);
    var pv = document.getElementById('pv-doseurometro');
    pv.append(row, cap);
    reveal('card-doseurometro');
  }).catch(function () {});

  // ---- Politicómetro: the comparison grid it will fill, topics by parties ----
  // A cell lights up in the party's colour once its programme is in; until then a slow wave runs over the empty grid.
  Promise.all([getJson('politicometro/config/topics.json'), getJson('politicometro/config/parties.json')]).then(function (res) {
    var topics = res[0].topics, parties = res[1].parties;
    var shown = topics.slice(0, 8);
    var grid = el('div', { class: 'matrix', style: 'grid-template-columns: 88px repeat(' + parties.length + ', minmax(0, 1fr))' });
    grid.append(el('span'));
    parties.forEach(function (p) { grid.append(el('i', { class: 'mx-party', title: p.short, style: 'background:' + p.color })); });
    shown.forEach(function (t, r) {
      var name = ES ? t.name : (t.en || t.name);
      grid.append(el('span', { class: 'mx-topic', lang: ES || !t.en ? 'es' : 'en', title: name, text: name.split(ES ? /,| y / : /,| and /)[0] }));
      parties.forEach(function (p, c) {
        var has = p.docs && p.docs.length > 0;
        grid.append(el('i', { class: 'mx-cell' + (has ? ' on' : ''), style: '--pc:' + p.color + ';--r:' + r + ';--c:' + c }));
      });
    });
    var added = parties.filter(function (p) { return p.docs && p.docs.length > 0; }).length;
    var days = Math.max(0, Math.ceil((Date.parse(res[1].election.closes) - Date.now()) / 864e5));
    var cap = el('p', { class: 'cap' }, ES
      ? ['Documentos incorporados: ', el('b', { text: added + ' de ' + parties.length }), ' · se vota en ', el('b', { text: days + ' días' })]
      : ['Documents added: ', el('b', { text: added + ' of ' + parties.length }), ' · vote in ', el('b', { text: days + ' days' })]);
    var pv = document.getElementById('pv-politicometro');
    pv.textContent = '';
    pv.append(grid, cap);
    reveal('card-politicometro');
  }).catch(function () {});

  // ---- Sellómetro: the six newest issues as perforated paper stamps, laid down one after another ----
  getJson('sellometro/data/summary.json').then(function (s) {
    function face(f) {
      var m = (f || '').match(/(\d+(?:[.,]\d+)?)\s*(euros?|€|pesetas|pta)/i), t = (f || '').match(/tarifas?\s*[«"]?([A-C]2?)\b/i);
      return m ? m[1] + (/^p/i.test(m[2]) ? ' pta' : ' €') : t ? t[1].toUpperCase() : '';
    }
    var row = el('div', { class: 'stamps' });
    s.latest.forEach(function (c, i) {
      var name = c.series.replace(/\s*\.?\s*[–-]\s*\d{4}.*$/, '').replace(/\.$/, '');
      row.append(el('span', { class: 'pstamp', style: '--i:' + i }, [el('span', { class: 'pstamp-in ink-' + c.ink }, [
        el('b', { text: face(c.face) }), el('span', { lang: 'es', text: name })
      ])]));
    });
    var cap = el('p', { class: 'cap' }, ES
      ? [el('b', { class: 'hl-num', text: String(s.items) }), ' emisiones de sellos, de ' + s.from + ' a ' + s.to + ', ', el('b', { text: s.withText + ' con el texto oficial del BOE' }), '. Arriba, las seis más recientes.']
      : [el('b', { class: 'hl-num', text: String(s.items) }), ' stamp issues, ' + s.from + ' to ' + s.to + ', ', el('b', { text: s.withText + ' with the official BOE text' }), '. Above, the newest six.']);
    var pv = document.getElementById('pv-sellometro');
    pv.append(row, cap);
    reveal('card-sellometro');
  }).catch(function () {});

  // ---- Loterómetro: the latest confirmed Christmas first prizes, printed like ticket numbers ----
  getJson('loterometro/data/summary.json').then(function (s) {
    var row = el('div', { class: 'tickets' });
    s.gordo.forEach(function (g, i) { row.append(el('span', { class: 'tk', style: '--i:' + i }, [el('small', { text: g[0] }), el('b', { text: g[1] })])); });
    var nf = new Intl.NumberFormat(ES ? 'es-ES' : 'en-GB');
    var cap = el('p', { class: 'cap' }, ES
      ? [el('b', { class: 'hl-num', text: nf.format(s.draws) }), ' sorteos en el BOE, de ' + s.from + ' a ' + s.to + ', ', el('b', { text: s.confirmed + ' primeros premios confirmados' }), '. Arriba, Gordos de Navidad.']
      : [el('b', { class: 'hl-num', text: nf.format(s.draws) }), ' draws in the BOE, ' + s.from + ' to ' + s.to + ', ', el('b', { text: s.confirmed + ' first prizes confirmed' }), '. Above, Christmas first prizes.']);
    var pv = document.getElementById('pv-loterometro');
    pv.append(row, cap);
    reveal('card-loterometro');
  }).catch(function () {});
})();
