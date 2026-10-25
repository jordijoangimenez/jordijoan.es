/* Loterómetro: the Lotería Nacional draws announced in the BOE (1960-2011), in English or Spanish (../shared/lang.js).
   Reads data/sorteos.json, built by scripts/build.mjs. */
(function () {
  'use strict';
  var root = document.documentElement;
  document.getElementById('theme').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var L = window.HLLang || { lang: 'en', apply: function () {} };
  var ES = L.lang === 'es';
  var tr = function (es, en) { return ES ? es : en; };
  L.apply({ es: {
    _description: 'Todos los sorteos de la Lotería Nacional publicados en el BOE de 1960 a 2011: fecha, tipo, programa de premios y el primer premio de las listas oficiales.',
    skip: 'Saltar a los sorteos', nav_draws: 'Sorteos', nav_gordo: 'El Gordo', nav_method: 'Método', theme: 'Cambiar tema', about: 'Sobre este catálogo',
    sub: 'Todos los sorteos de la Lotería Nacional publicados en el Boletín Oficial del Estado de 1960 a 2011: cuándo se celebraron, de qué tipo eran, su programa de premios y, hasta 1991, el primer premio tal como figura en la lista oficial de números premiados.',
    filters: 'Filtrar sorteos', f_q: 'Buscar', f_q_ph: 'Número, localidad o año', f_kind: 'Tipo de sorteo', f_from: 'Desde', f_to: 'Hasta',
    f_won: 'Solo con primer premio confirmado', reset: 'Restablecer', gordo: 'El Gordo de Navidad', gordo_hint: 'el sorteo de Navidad, año a año',
    per_year: 'Sorteos por año', per_year_hint: 'por tipo de sorteo', towns: 'Dónde se vendió el primer premio', draws: 'Sorteos', loading: 'Cargando sorteos…',
    method: 'Cómo funciona',
    method_body: '<h3>Fuente</h3><p>Cada sorteo procede del BOE: hasta principios de 2011, la Lotería publicaba allí el programa de premios de cada sorteo y, hasta 1991, la lista oficial de números premiados. Cada sorteo enlaza a sus anuncios. Desde 2011 la Lotería Nacional ya no los publica en el BOE, así que el catálogo termina ahí.</p>' +
      '<h3>Programa</h3><p>Desde 1995 el BOE tiene el texto de cada programa, y de él se leen las series, los billetes, el precio, los décimos y el dinero en premios. Los programas anteriores solo existen como páginas escaneadas y se enlazan tal cual.</p>' +
      '<h3>Primer premio</h3><p>Hasta 1991 el primer premio se lee de la capa de texto de la lista oficial escaneada, que a menudo tiene errores de lectura. Un número solo se muestra si la propia lista lo confirma: las dos aproximaciones son el número anterior y el siguiente, la centena a la que pertenece o las terminaciones de los premios menores. Para el sorteo de Navidad, cuya lista es una tabla, se muestra cuando el número que da la Wikipedia en español para ese año figura impreso en el anuncio del BOE. Si no se puede confirmar, el sorteo enlaza al escaneo.</p>' +
      '<h3>Tipos de sorteo</h3><p>Ordinario, del jueves, extraordinario, especial, del Zodíaco y de «Los Millones», como los llama el BOE. El de Navidad es el que se celebra el 22 de diciembre, o el día más cercano cuando el 22 cae en domingo; el del Niño, el del 5 o 6 de enero.</p>' +
      '<h3>Dinero</h3><p>Las cantidades aparecen en la moneda de cada momento: pesetas hasta 2001 y euros desde 2002.</p>' +
      '<h3>Derechos</h3><p>Los textos del BOE se pueden reutilizar citando la fuente. Los dibujos de los décimos pertenecen a Loterías y Apuestas del Estado y a sus autores, así que no se muestran; para verlos, consulta archivos de coleccionistas como el <a href="https://nacionalloteria.mundodeportivo.com/rincon-del-coleccionista/index.php" rel="noopener">Rincón del Coleccionista</a>.</p>',
    foot1: 'Fuente de los datos: Agencia Estatal Boletín Oficial del Estado (<a href="https://www.boe.es/" rel="noopener">BOE</a>). Este sitio no es oficial y no está vinculado a Loterías y Apuestas del Estado.',
    foot2: 'Un proyecto de', foot3: 'en'
  } });

  var KINDS = ['navidad', 'nino', 'extraordinario', 'especial', 'ordinario', 'jueves', 'zodiaco', 'millones'];
  var KIND = ES
    ? { navidad: 'Navidad', nino: 'El Niño', extraordinario: 'Extraordinario', especial: 'Especial', ordinario: 'Ordinario', jueves: 'Del jueves', zodiaco: 'Zodíaco', millones: 'Los Millones' }
    : { navidad: 'Christmas', nino: 'El Niño', extraordinario: 'Extraordinary', especial: 'Special', ordinario: 'Ordinary', jueves: 'Thursday', zodiaco: 'Zodíaco', millones: 'Los Millones' };
  var KCOL = { navidad: '#e8607a', nino: '#f2b84b', extraordinario: '#d98b5f', especial: '#7c9cff', ordinario: '#5b8def', jueves: '#39c5a8', zodiaco: '#b07cf0', millones: '#c9a227' };
  var LOC = ES ? 'es-ES' : 'en-GB';
  var nf = new Intl.NumberFormat(LOC);
  var MON = ES ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ES ? ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function $(id) { return document.getElementById(id); }
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, kids) {
    var svg = tag === 'svg' || tag === 'rect' || tag === 'line' || tag === 'text' || tag === 'g' || tag === 'title';
    var e = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (var k in attrs || {}) { if (attrs[k] == null) continue; if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.append(c); });
    return e;
  }
  function day(iso) { var d = new Date(iso + 'T12:00:00Z'); return DOW[d.getUTCDay()] + ' ' + (+iso.slice(8)) + ' ' + MON[+iso.slice(5, 7) - 1]; }
  function money(v, cur) { return v == null ? '' : nf.format(v) + (cur === 'EUR' ? ' €' : (ES ? ' pesetas' : ' pesetas')); }
  function boeLink(id, label) { return el('a', { href: 'https://www.boe.es/diario_boe/txt.php?id=' + id, rel: 'noopener', text: label }); }
  function kindName(d) { return d.n && d.k !== 'navidad' && d.k !== 'nino' ? KIND[d.k] + ' · «' + d.n + '»' : KIND[d.k]; }

  var all = [], state = { q: '', kind: '', from: '', to: '', won: false }, shownYears = 4;

  function hero(draws) {
    var years = draws.map(function (d) { return +d.d.slice(0, 4); });
    var y0 = Math.min.apply(null, years), y1 = Math.max.apply(null, years);
    var conf = draws.filter(function (d) { return d.r && d.r.ok; }).length, prog = draws.filter(function (d) { return d.p; }).length;
    var pills = $('pills'); pills.textContent = '';
    ['Lotería Nacional', y0 + '–' + y1, nf.format(draws.length) + ' ' + tr('sorteos', 'draws'), 'BOE'].forEach(function (t) { pills.append(el('li', { text: t })); });
    var box = $('hero-count'); box.textContent = '';
    box.append(el('b', { class: 'hl-num', text: nf.format(draws.length) }), el('span', { text: tr('sorteos en el BOE', 'draws in the BOE') }),
      el('small', { text: nf.format(conf) + tr(' primeros premios confirmados · ', ' first prizes confirmed · ') + nf.format(prog) + tr(' programas', ' programmes') }));
    box.hidden = false;
  }

  // ---- El Gordo, year by year (the BOE published the results until 1991) ----
  function gordo(draws) {
    var list = $('gordo-list'); list.textContent = '';
    var nav = draws.filter(function (d) { return d.k === 'navidad' && d.d < '1992-01-01'; });
    var ok = 0;
    nav.forEach(function (d) {
      var y = d.d.slice(0, 4), has = d.r && d.r.ok;
      if (has) ok++;
      var kids = [el('span', { class: 'gy', text: y })];
      if (has) kids.push(el('b', { class: 'ticket', text: d.r.num }));
      else if (d.boe.r.length) kids.push(boeLink(d.boe.r[0], tr('ver el escaneo', 'see the scan')));
      else kids.push(el('span', { class: 'muted', text: '–' }));
      list.append(el('li', { class: has ? 'on' : '', title: has && d.r.amt ? money(d.r.amt, d.r.cur) : null }, kids));
    });
    $('gordo-note').textContent = tr(
      ok + ' de ' + nav.length + ' años con el número confirmado. Desde 1992 el BOE ya no publicaba la lista de números premiados.',
      ok + ' of ' + nav.length + ' years with the number confirmed. From 1992 on, the BOE no longer published the list of winning numbers.');
  }

  // ---- draws per year, stacked by kind ----
  function perYear(draws) {
    var host = $('pyChart'); host.textContent = '';
    var by = {}, y0 = 9999, y1 = 0;
    draws.forEach(function (d) { var y = +d.d.slice(0, 4); y0 = Math.min(y0, y); y1 = Math.max(y1, y); by[y] = by[y] || {}; by[y][d.k] = (by[y][d.k] || 0) + 1; });
    var max = 0; for (var y in by) { var s = 0; for (var k in by[y]) s += by[y][k]; max = Math.max(max, s); }
    var W = 640, H = 220, m = { l: 30, r: 6, t: 8, b: 22 }, n = y1 - y0 + 1, bw = (W - m.l - m.r) / n;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': tr('Sorteos por año y tipo', 'Draws per year and kind') });
    var step = max > 80 ? 25 : 10, top = Math.ceil(max / step) * step;
    var ys = function (v) { return H - m.b - v / top * (H - m.t - m.b); };
    for (var v = 0; v <= top; v += step) {
      svg.append(el('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v), class: v ? 'grid-line' : 'axis-line' }));
      svg.append(el('text', { x: m.l - 4, y: ys(v) + 3, 'text-anchor': 'end', class: 'tick', text: String(v) }));
    }
    for (y = y0; y <= y1; y++) {
      var acc = 0, x = m.l + (y - y0) * bw;
      KINDS.forEach(function (k) {
        var c = (by[y] || {})[k]; if (!c) return;
        var r = el('rect', { x: (x + bw * 0.12).toFixed(1), y: ys(acc + c).toFixed(1), width: (bw * 0.76).toFixed(1), height: (ys(acc) - ys(acc + c)).toFixed(1), fill: KCOL[k] });
        r.append(el('title', { text: y + ' · ' + KIND[k] + ': ' + c }));
        svg.append(r); acc += c;
      });
      if (y % 10 === 0) svg.append(el('text', { x: (x + bw / 2).toFixed(1), y: H - 6, 'text-anchor': 'middle', class: 'tick', text: String(y) }));
    }
    host.append(svg);
    var key = $('pyKey'); key.textContent = '';
    KINDS.forEach(function (k) { if (draws.some(function (d) { return d.k === k; })) key.append(el('span', {}, [el('i', { style: 'background:' + KCOL[k] }), KIND[k]])); });
  }

  // ---- towns where the confirmed first prizes were sold ----
  function towns(draws) {
    var c = {}, n = 0;
    draws.forEach(function (d) { if (d.r && d.r.ok && d.r.where) { n++; d.r.where.forEach(function (w) { c[w] = (c[w] || 0) + 1; }); } });
    var rows = Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0], LOC); }).slice(0, 15);
    $('tw-hint').textContent = tr(n + ' primeros premios confirmados con su localidad', n + ' confirmed first prizes with their town');
    var ol = $('twList'); ol.textContent = '';
    var max = rows.length ? rows[0][1] : 1;
    rows.forEach(function (r) {
      ol.append(el('li', {}, [el('span', { class: 'nm', lang: 'es', text: r[0] }), el('span', { class: 'track' }, [el('i', { class: 'fill', style: 'width:' + (r[1] / max * 100).toFixed(1) + '%' })]), el('span', { class: 'v', text: String(r[1]) })]));
    });
  }

  // ---- the list ----
  function matches(d) {
    if (state.kind && d.k !== state.kind) return false;
    if (state.from && d.d.slice(0, 4) < state.from) return false;
    if (state.to && d.d.slice(0, 4) > state.to) return false;
    if (state.won && !(d.r && d.r.ok)) return false;
    if (state.q) {
      var q = state.q.toLowerCase(), hay = [d.d, d.n || '', KIND[d.k], d.r && d.r.ok ? d.r.num : '', d.r && d.r.where ? d.r.where.join(' ') : '', d.pl || ''].join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }
  function row(d) {
    var kids = [el('span', { class: 'date', text: day(d.d) }), el('span', { class: 'kind', style: '--kc:' + KCOL[d.k] }, [el('i'), kindName(d)])];
    var main = el('span', { class: 'main' });
    if (d.r && d.r.ok) {
      main.append(el('b', { class: 'ticket', text: d.r.num }));
      if (d.r.amt) main.append(el('span', { class: 'amt', text: money(d.r.amt, d.r.cur) }));
      if (d.r.where) main.append(el('span', { class: 'where', lang: 'es', text: tr('vendido en ', 'sold in ') + d.r.where.join(', ') }));
    } else if (d.p) {
      var bits = [];
      if (d.p.tenth) bits.push(tr('décimo a ', 'tenth at ') + money(d.p.tenth, d.p.cur));
      if (d.p.first) bits.push(tr('1.er premio ', '1st prize ') + money(d.p.first, d.p.cur) + tr(' por serie', ' per series'));
      if (d.p.series && d.p.tickets) bits.push(d.p.series + tr(' series de ', ' series of ') + nf.format(d.p.tickets) + tr(' billetes', ' tickets'));
      if (d.p.total) bits.push(money(d.p.total, d.p.cur) + tr(' en premios por serie', ' in prizes per series'));
      main.append(el('span', { class: 'prog', text: bits.join(' · ') }));
    } else if (d.boe.r.length) {
      main.append(el('span', { class: 'muted', text: tr('primer premio sin confirmar', 'first prize not confirmed') }));
    }
    kids.push(main);
    var links = el('span', { class: 'links' });
    if (d.boe.p[0]) links.append(boeLink(d.boe.p[0], tr('programa', 'programme')));
    if (d.boe.r[0]) links.append(boeLink(d.boe.r[0], tr('resultados', 'results')));
    kids.push(links);
    return el('li', { class: 'draw' + (d.k === 'navidad' ? ' xmas' : '') }, kids);
  }
  function render() {
    var list = all.filter(matches);
    var byYear = {};
    list.forEach(function (d) { var y = d.d.slice(0, 4); (byYear[y] = byYear[y] || []).push(d); });
    var years = Object.keys(byYear).sort().reverse();
    var host = $('years'); host.textContent = '';
    years.slice(0, shownYears).forEach(function (y) {
      var ul = el('ul', { class: 'draws' });
      byYear[y].slice().reverse().forEach(function (d) { ul.append(row(d)); });
      host.append(el('section', { class: 'year' }, [el('h3', {}, [y, el('small', { text: byYear[y].length + ' ' + tr('sorteos', 'draws') })]), ul]));
    });
    $('count').textContent = list.length ? nf.format(list.length) + ' ' + tr('sorteos', 'draws') + ' · ' + years.length + ' ' + tr('años', 'years') : tr('Ningún sorteo coincide.', 'No draws match.');
    var more = $('more');
    more.hidden = years.length <= shownYears;
    more.textContent = tr('Mostrar más años', 'Show more years') + ' (' + (years.length - shownYears) + ')';
  }

  function controls(draws) {
    var kind = $('f-kind');
    kind.append(el('option', { value: '', text: tr('Todos', 'All') }));
    KINDS.forEach(function (k) { if (draws.some(function (d) { return d.k === k; })) kind.append(el('option', { value: k, text: KIND[k] })); });
    var years = []; draws.forEach(function (d) { var y = d.d.slice(0, 4); if (years.indexOf(y) < 0) years.push(y); });
    ['f-from', 'f-to'].forEach(function (id) {
      $(id).append(el('option', { value: '', text: tr('Cualquiera', 'Any') }));
      years.forEach(function (y) { $(id).append(el('option', { value: y, text: y })); });
    });
    var t;
    $('f-q').addEventListener('input', function (e) { clearTimeout(t); t = setTimeout(function () { state.q = e.target.value.trim(); shownYears = 4; render(); }, 150); });
    [['f-kind', 'kind'], ['f-from', 'from'], ['f-to', 'to']].forEach(function (p) { $(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; shownYears = 4; render(); }); });
    $('f-won').addEventListener('change', function (e) { state.won = e.target.checked; shownYears = 4; render(); });
    $('f-reset').addEventListener('click', function () { state = { q: '', kind: '', from: '', to: '', won: false }; $('filters').reset(); shownYears = 4; render(); });
    $('filters').addEventListener('submit', function (e) { e.preventDefault(); });
    $('more').addEventListener('click', function () { shownYears += 6; render(); });
  }

  fetch('data/sorteos.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (data) {
    all = data.draws;
    hero(all); gordo(all); perYear(all); towns(all); controls(all); render();
    $('upd').textContent = tr('Datos generados el ', 'Data built on ') + data.updated + '.';
    var h = $('hero'); if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }).catch(function () { $('error').textContent = tr('No se han podido cargar los sorteos.', 'The draws could not be loaded.'); $('error').hidden = false; $('count').textContent = ''; });
})();
