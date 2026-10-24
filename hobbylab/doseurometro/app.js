/* Doseurómetro: the coin catalogue, in English or Spanish (../shared/lang.js). The coin texts themselves stay in the
   English of the Official Journal notices. */
(function () {
  'use strict';

  var L = window.HLLang || { lang: 'en', apply: function () {} };
  var ES = L.lang === 'es';
  L.apply({ es: {
    _description: 'Todas las monedas conmemorativas de 2 euros con la descripción del diseño de la comunicación de la Comisión Europea en el Diario Oficial de la UE.',
    skip: 'Saltar a las monedas', nav_coins: 'Monedas', nav_method: 'Método', theme: 'Cambiar tema', filters: 'Filtrar monedas',
    f_q: 'Buscar', f_q_ph: 'Tema, diseño o país', f_country: 'País', all_countries: 'Todos los países', f_from: 'Desde', f_to: 'Hasta',
    any_year: 'Cualquier año', f_kind: 'Tipo', all_types: 'Todos los tipos', k_national: 'Emisiones nacionales', k_common: 'Emisiones comunes',
    k_joint: 'Emisiones conjuntas', f_sort: 'Orden', s_new: 'Más recientes primero', s_old: 'Más antiguas primero', s_country: 'País, de la A a la Z',
    reset: 'Restablecer', about: 'Sobre este catálogo',
    sub: 'Todas las monedas conmemorativas de 2 euros, con la descripción del diseño, la tirada y la fecha de emisión copiadas de la comunicación de la Comisión Europea en el Diario Oficial de la Unión Europea. Un catálogo no oficial.',
    coins: 'Monedas', loading: 'Cargando monedas…', views: 'Agrupar monedas', v_year: 'Por año', v_country: 'Por país', v_topic: 'Por tema',
    v_common: 'Emisiones comunes', v_all: 'Todas', by_topic: 'Filtrar por tema', method: 'Cómo funciona',
    method_body: '<h3>Fuente</h3><p>Cada moneda procede de una comunicación de la Comisión Europea titulada <q>Nueva cara nacional de las monedas en euros destinadas a la circulación</q>, publicada en la serie C del Diario Oficial de la Unión Europea desde 2004. Cada moneda enlaza a su comunicación en EUR-Lex.</p>' +
      '<h3>Copiado, no reescrito</h3><p>El tema, la descripción del diseño, la tirada y la fecha de emisión se copian de la versión inglesa de la comunicación, por eso aparecen en inglés. Si la Comisión publicó después una corrección de errores, la moneda lo indica.</p>' +
      '<h3>Imágenes y derechos</h3><p>Es un catálogo informativo y sin ánimo de lucro sobre monedas conmemorativas. Las imágenes son las que aparecen en las comunicaciones, a baja resolución y con su fuente, solo para identificar y describir cada moneda. El diseño de cada cara nacional pertenece al país que la emitió, no a este sitio. Si tienes los derechos de un diseño y quieres que se retire su imagen, <a href="https://github.com/jordijoangimenez/jordijoan.es/issues" rel="noopener">abre una incidencia en GitHub</a> y se retirará.</p>' +
      '<h3>Países</h3><p>Monedas de 20 países de la zona euro y de los cuatro Estados que emiten monedas en euros por un acuerdo monetario con la UE: Andorra, Mónaco, San Marino y la Ciudad del Vaticano.</p>' +
      '<h3>Emisiones comunes</h3><p>Monedas con el mismo diseño emitidas por todos los países de la zona euro: el Tratado de Roma (2007), la unión económica y monetaria (2009), los diez años del euro en efectivo (2012), la bandera de la UE (2015) y Erasmus (2022). La versión de cada país lleva su propio nombre e inscripción.</p>' +
      '<h3>Emisiones conjuntas</h3><p>Un tema compartido por dos o tres países, cada uno con su propia moneda. Los diseños pueden ser distintos.</p>' +
      '<h3>Temas</h3><p>Cada moneda se clasifica en uno o varios temas (monumentos, naturaleza, arte, personajes, etc.) según las palabras de su tema oficial. Es una clasificación automática y no oficial, así que alguna moneda puede estar en un sitio sorprendente.</p>' +
      '<h3>Monedas nuevas</h3><p>Una moneda aparece cuando su comunicación se publica en el Diario Oficial, a menudo meses después de su emisión. El catálogo se actualiza a mano.</p>',
    foot1: 'Textos: comunicaciones de la Comisión Europea en el Diario Oficial de la Unión Europea (<a href="https://eur-lex.europa.eu/" rel="noopener">EUR-Lex</a>), &copy; Unión Europea, reutilización autorizada citando la fuente. Diseños de las monedas: &copy; los países emisores; las imágenes proceden de las mismas comunicaciones y se muestran solo para identificar cada moneda (<a href="#method">derechos</a>). Este catálogo no es oficial: consulta siempre la comunicación para el texto auténtico.',
    foot2: 'Un proyecto de', foot3: 'en', updated: 'Datos actualizados:', prev: '&larr; Anterior', next: 'Siguiente &rarr;', close: 'Cerrar'
  } });
  var S = ES ? {
    kind: { national: 'Emisión nacional', common: 'Emisión común', joint: 'Emisión conjunta' },
    alt: 'Moneda de 2 euros, ', coin: ['moneda', 'monedas'], country: ['país', 'países'], issuedIn: 'Emitida en ', to: ' a ',
    more: function (n) { return 'Cargar más (quedan ' + n + ')'; }, none: 'Ninguna moneda coincide con estos filtros.',
    all: function (n) { return 'Las ' + n + ' monedas · abre una para ver su descripción oficial'; }, match: function (n) { return n === 1 ? '1 moneda coincide' : n + ' monedas coinciden'; },
    noNotice: 'Sin comunicación de la Comisión', sameDesign: function (n) { return 'Mismo diseño emitido por ' + n + ' países de la zona euro.'; },
    shared: 'Tema compartido con otro país; los diseños pueden ser distintos.', topics: 'Temas: ', design: 'Descripción del diseño',
    notAvail: 'No disponible.', extra: 'Texto adicional de la comunicación',
    facts: ['País', 'Año', 'Tirada', 'Fecha de emisión', 'Referencia DOUE', 'Publicada', 'Fuente'],
    source: 'Diario Oficial de la Unión Europea (comunicación de la Comisión)', open: 'Abrir la comunicación oficial', of: ' de ',
    pills: function (y0, y1, n, last) { return ['Conmemorativas de 2 €', y0 + '–' + y1, n + ' países', 'Última comunicación ' + last]; },
    countLabel: 'monedas, cada una con su comunicación oficial',
    kinds: function (k) { return k.national + ' nacionales · ' + k.common + ' comunes · ' + k.joint + ' conjuntas'; },
    allTopics: 'Todos los temas',
    fail: function (m) { return 'No se han podido cargar las monedas (' + m + '). Si has abierto la página como archivo local, sírvela por http, por ejemplo con un servidor web estático sencillo.'; }
  } : {
    kind: { national: 'National issue', common: 'Common issue', joint: 'Joint issue' },
    alt: '2-euro coin, ', coin: ['coin', 'coins'], country: ['country', 'countries'], issuedIn: 'Issued in ', to: ' to ',
    more: function (n) { return 'Load more (' + n + ' left)'; }, none: 'No coins match these filters.',
    all: function (n) { return 'All ' + n + ' coins · open one for its official description'; }, match: function (n) { return n + (n === 1 ? ' coin' : ' coins') + ' match'; },
    noNotice: 'No Commission notice published', sameDesign: function (n) { return 'Same design issued by ' + n + ' euro-area countries.'; },
    shared: 'Subject shared with another country; designs may differ.', topics: 'Topics: ', design: 'Design description',
    notAvail: 'Not available.', extra: 'Additional text from the notice',
    facts: ['Country', 'Year', 'Mintage', 'Issue date', 'OJ reference', 'Published', 'Source'],
    source: null, open: 'Open the official notice', of: ' of ',
    pills: function (y0, y1, n, last) { return ['2-euro commemoratives', y0 + '–' + y1, n + ' countries', 'Latest notice ' + last]; },
    countLabel: 'coins, each with its official notice',
    kinds: function (k) { return k.national + ' national · ' + k.common + ' common · ' + k.joint + ' joint'; },
    allTopics: 'All topics',
    fail: function (m) { return 'The coin data could not be loaded (' + m + '). If you opened this page as a local file, serve the folder over http instead, for example with a simple static web server.'; }
  };
  var regionES = null;
  try { if (ES) regionES = new Intl.DisplayNames(['es'], { type: 'region' }); } catch (e) {}
  function cname(c) { return regionES && c.countryCode ? regionES.of(c.countryCode) : c.country; }
  function plural(n, w) { return n + ' ' + (n === 1 ? w[0] : w[1]); }

  var PAGE = 48;
  var DEFAULTS = { q: '', country: '', from: '', to: '', sort: 'year-desc', view: 'year', kind: '', topic: '' };
  var VIEWS = ['all', 'year', 'country', 'topic', 'common'];
  var KINDS = ['national', 'common', 'joint'];
  var KIND_LABEL = S.kind;
  var coins = [];
  var byId = {};
  var TOPICS = []; // [{ id, label, count }] from data/topics.json; a coin can have several
  var topicLabel = {};
  var filtered = [];
  var shown = 0;
  var state = Object.assign({}, DEFAULTS);
  var currentId = '';
  var lastFocus = null;
  var firstRender = true; // only the first list rises into view (Hobby Lab motion); later filter changes show at once

  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('dlg');

  function el(tag, props, children) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function altText(c) {
    return S.alt + cname(c) + ' ' + c.year + ': ' + c.subject;
  }

  /* ---------- URL hash state ---------- */

  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
    var s = Object.assign({}, DEFAULTS);
    Object.keys(DEFAULTS).forEach(function (k) { if (p.has(k)) s[k] = p.get(k); });
    if (['year-asc', 'year-desc', 'country'].indexOf(s.sort) < 0) s.sort = DEFAULTS.sort;
    if (VIEWS.indexOf(s.view) < 0) s.view = DEFAULTS.view;
    if (s.kind && KINDS.indexOf(s.kind) < 0) s.kind = '';
    if (s.topic && !topicLabel[s.topic]) s.topic = '';
    return { state: s, coin: p.get('coin') || '' };
  }

  function buildHash(s, coin) {
    var p = new URLSearchParams();
    Object.keys(DEFAULTS).forEach(function (k) { if (s[k] && s[k] !== DEFAULTS[k]) p.set(k, s[k]); });
    if (coin) p.set('coin', coin);
    var str = p.toString();
    return str ? '#' + str : '';
  }

  // Filter changes replace the history entry so Back does not step through every keystroke.
  function saveFilters() {
    var h = buildHash(state, currentId);
    history.replaceState(null, '', location.pathname + location.search + h);
  }

  /* ---------- filtering and rendering ---------- */

  function applyFilters() {
    var q = state.q.trim().toLowerCase();
    var from = parseInt(state.from, 10) || 0;
    var to = parseInt(state.to, 10) || 9999;
    filtered = coins.filter(function (c) {
      if (state.country && c.countryCode !== state.country) return false;
      if (c.year < from || c.year > to) return false;
      if (state.kind && c.kind !== state.kind) return false;
      if (state.topic && c.topics.indexOf(state.topic) < 0) return false;
      if (state.view === 'common' && c.kind !== 'common') return false;
      if (q && c._search.indexOf(q) < 0) return false;
      return true;
    });
    var byYearAsc = function (a, b) { return a.year - b.year || a._cname.localeCompare(b._cname); };
    var byYearDesc = function (a, b) { return b.year - a.year || a._cname.localeCompare(b._cname); };
    var byCountry = function (a, b) { return a._cname.localeCompare(b._cname) || a.year - b.year; };
    var cmp;
    if (state.view === 'country') cmp = byCountry;
    else if (state.view === 'common') cmp = state.sort === 'year-desc' ? byYearDesc : byYearAsc;
    else cmp = { 'year-asc': byYearAsc, 'year-desc': byYearDesc, 'country': byCountry }[state.sort];
    filtered.sort(cmp);
  }

  // Group key and heading for the grouped views; filtered is already in display order.
  function groupOf(c) {
    if (state.view === 'year') return { key: String(c.year), title: String(c.year) };
    if (state.view === 'country') return { key: c.countryCode, title: c._cname };
    return { key: c.commonGroup || c.subject, title: (c.commonGroup || c.subject), note: S.issuedIn + c.year, en: true };
  }

  function renderGroups() {
    var box = $('groups');
    box.textContent = '';
    var groups = [];
    var last = null;
    if (state.view === 'topic') {
      // a coin with several topics appears under each of them
      TOPICS.forEach(function (t) {
        if (state.topic && t.id !== state.topic) return;
        var list = filtered.filter(function (c) { return c.topics.indexOf(t.id) >= 0; });
        if (list.length) groups.push({ key: t.id, title: t.label, coins: list });
      });
    } else filtered.forEach(function (c) {
      var g = groupOf(c);
      if (!last || last.key !== g.key) { last = { key: g.key, title: g.title, note: g.note, en: g.en, coins: [] }; groups.push(last); }
      last.coins.push(c);
    });
    var frag = document.createDocumentFragment();
    groups.forEach(function (g, i) {
      var countries = {};
      g.coins.forEach(function (c) { countries[c.countryCode] = 1; });
      var nc = Object.keys(countries).length;
      var sub = plural(g.coins.length, S.coin);
      if (state.view === 'common') sub = plural(nc, S.country) + ' · ' + g.note;
      else if (state.view === 'year' || state.view === 'topic') sub += ' · ' + plural(nc, S.country);
      else {
        var ys = g.coins.map(function (c) { return c.year; });
        sub += ' · ' + Math.min.apply(null, ys) + S.to + Math.max.apply(null, ys);
      }
      var ul = el('ul', { class: 'grid', 'aria-label': g.title });
      g.coins.forEach(function (c) { ul.appendChild(cardNode(c)); });
      var title = ES && g.en ? el('span', { lang: 'en', text: g.title }) : document.createTextNode(g.title);
      frag.appendChild(el('section', { class: 'group', 'aria-labelledby': 'g-' + i }, [
        el('h3', { id: 'g-' + i, class: 'group-h' }, [title, el('span', { class: 'group-sub', text: sub })]),
        ul
      ]));
    });
    box.appendChild(frag);
  }

  function cardNode(c) {
    var thumb = el('div', { class: 'thumb' });
    if (c.image) {
      thumb.appendChild(el('img', { src: c.image, alt: altText(c), loading: 'lazy', decoding: 'async', width: 200, height: 200 }));
    } else {
      thumb.appendChild(el('div', { class: 'ph', role: 'img', 'aria-label': altText(c), text: c.countryCode }));
    }
    var btn = el('button', { type: 'button', class: 'card-btn', 'data-id': c.id }, [
      thumb,
      el('span', { class: 'card-meta', text: c.year + ' · ' + c._cname }),
      el('span', ES ? { class: 'card-subject', lang: 'en', text: c.subject } : { class: 'card-subject', text: c.subject }),
      c.kind && c.kind !== 'national' ? el('span', { class: 'tag', text: KIND_LABEL[c.kind] }) : null,
      c.hasNotice ? null : el('span', { class: 'badge', text: S.noNotice })
    ]);
    return el('li', { class: firstRender ? 'coin hl-rise' : 'coin' }, [btn]);
  }

  function renderMore() {
    var grid = $('grid');
    var frag = document.createDocumentFragment();
    var end = Math.min(shown + PAGE, filtered.length);
    for (var i = shown; i < end; i++) frag.appendChild(cardNode(filtered[i]));
    grid.appendChild(frag);
    shown = end;
    $('more').hidden = shown >= filtered.length;
    $('more').textContent = S.more(filtered.length - shown);
  }

  function render() {
    applyFilters();
    var grouped = state.view !== 'all';
    $('grid').hidden = grouped;
    $('groups').hidden = !grouped;
    $('grid').textContent = '';
    shown = 0;
    if (grouped) { renderGroups(); $('more').hidden = true; }
    else renderMore();
    var n = filtered.length;
    $('count').textContent = n === 0 ? S.none : n === coins.length ? S.all(n) : S.match(n);
    firstRender = false;
  }

  function syncControls() {
    $('f-q').value = state.q;
    $('f-country').value = state.country;
    $('f-from').value = state.from;
    $('f-to').value = state.to;
    $('f-sort').value = state.sort;
    $('f-kind').value = state.kind;
    Array.prototype.forEach.call(document.querySelectorAll('#views button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === state.view));
    });
    Array.prototype.forEach.call(document.querySelectorAll('#topics button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === state.topic));
    });
    // the country view is always ordered by country, then year
    $('f-sort').disabled = state.view === 'country';
  }

  /* ---------- detail dialog ---------- */

  function fact(dl, label, value, link) {
    if (!value) return;
    dl.appendChild(el('dt', { text: label }));
    var dd = el('dd');
    if (link) dd.appendChild(el('a', { href: link, target: '_blank', rel: 'noopener', text: value }));
    else dd.textContent = value;
    dl.appendChild(dd);
  }

  function showCoin(id) {
    var c = byId[id];
    if (!c) return;
    currentId = id;
    var box = $('dlg-content');
    box.textContent = '';

    var img = el('div', { class: 'dlg-img' });
    if (c.image) img.appendChild(el('img', { src: c.image, alt: altText(c) }));
    else img.appendChild(el('div', { class: 'ph big', role: 'img', 'aria-label': altText(c), text: c.countryCode }));

    var info = el('div');
    var en = ES ? { lang: 'en' } : {};
    info.appendChild(el('h2', Object.assign({ id: 'dlg-title', text: c.subject }, en)));
    info.appendChild(el('p', { text: c._cname + ', ' + c.year }));
    if (!c.hasNotice) info.appendChild(el('p', {}, [el('span', { class: 'badge', text: S.noNotice })]));
    if (c.kind && c.kind !== 'national') {
      var same = coins.filter(function (o) { return o.kind === c.kind && (o.commonGroup || o.subject) === (c.commonGroup || c.subject) && o.year === c.year; }).length;
      info.appendChild(el('p', {}, [el('span', { class: 'tag', text: KIND_LABEL[c.kind] }),
        document.createTextNode(' ' + (c.kind === 'common' ? S.sameDesign(same) : S.shared))]));
    }

    if (c.topics.length) {
      var tp = el('p', { class: 'dlg-topics' }, [document.createTextNode(S.topics)]);
      c.topics.forEach(function (id, i) {
        if (i) tp.appendChild(document.createTextNode(' · '));
        tp.appendChild(el('a', { href: buildHash(Object.assign({}, DEFAULTS, { topic: id }), ''), text: topicLabel[id] }));
      });
      info.appendChild(tp);
    }

    info.appendChild(el('h3', { text: S.design }));
    info.appendChild(c.design ? el('p', Object.assign({ text: c.design }, en)) : el('p', { text: S.notAvail }));
    if (c.extra) {
      info.appendChild(el('h3', { text: S.extra }));
      info.appendChild(el('p', Object.assign({ text: c.extra }, en)));
    }

    var dl = el('dl', { class: 'facts' });
    fact(dl, S.facts[0], c._cname + (c.countryCode ? ' (' + c.countryCode + ')' : ''));
    fact(dl, S.facts[1], String(c.year));
    fact(dl, S.facts[2], c.number);
    fact(dl, S.facts[3], c.issue);
    fact(dl, S.facts[4], c.ojRef);
    fact(dl, S.facts[5], c.published);
    fact(dl, S.facts[6], S.source && /^Official Journal/.test(c.source || '') ? S.source : c.source, c.sourceUrl);
    info.appendChild(dl);

    if (c.officialUrl) {
      // EUR-Lex has the notice in every EU language: open it in the page's language
      var url = ES ? c.officialUrl.replace('/legal-content/EN/', '/legal-content/ES/') : c.officialUrl;
      info.appendChild(el('a', { class: 'btn btn-primary btn-link', href: url, target: '_blank', rel: 'noopener', text: S.open }));
    }
    box.appendChild(img);
    box.appendChild(info);
    box.parentNode.scrollTop = 0;
    dlg.scrollTop = 0;

    var i = filtered.indexOf(c);
    $('dlg-pos').textContent = i >= 0 ? (i + 1) + S.of + filtered.length : '';
    $('dlg-prev').disabled = i <= 0;
    $('dlg-next').disabled = i < 0 || i >= filtered.length - 1;

    if (!dlg.open) {
      lastFocus = document.activeElement;
      dlg.showModal();
    }
  }

  function go(delta) {
    var i = filtered.indexOf(byId[currentId]) + delta;
    if (i >= 0 && i < filtered.length) location.hash = buildHash(state, filtered[i].id);
  }

  function closeDialog() { if (dlg.open) dlg.close(); }

  dlg.addEventListener('close', function () {
    // Esc or Close button: drop the coin from the hash.
    var wasOpen = currentId;
    currentId = '';
    if (wasOpen && readHash().coin) location.hash = buildHash(state, '');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else {
      var b = document.querySelector('.card-btn[data-id="' + wasOpen + '"]');
      if (b) b.focus();
    }
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && !e.altKey) { if (!$('dlg-prev').disabled) go(-1); }
    else if (e.key === 'ArrowRight' && !e.altKey) { if (!$('dlg-next').disabled) go(1); }
  });
  $('dlg-close').addEventListener('click', closeDialog);
  $('dlg-prev').addEventListener('click', function () { go(-1); });
  $('dlg-next').addEventListener('click', function () { go(1); });

  /* ---------- hash sync ---------- */

  function onHash() {
    var h = readHash();
    var changed = JSON.stringify(h.state) !== JSON.stringify(state);
    if (changed) {
      state = h.state;
      syncControls();
      render();
    }
    if (h.coin && byId[h.coin]) showCoin(h.coin);
    else if (dlg.open) { currentId = ''; lastFocus = lastFocus; dlg.close(); }
  }

  /* ---------- setup ---------- */

  function fillSelects() {
    var countries = {};
    var years = {};
    coins.forEach(function (c) { countries[c.countryCode] = c._cname; years[c.year] = 1; });
    var cs = $('f-country');
    Object.keys(countries).sort(function (a, b) { return countries[a].localeCompare(countries[b]); })
      .forEach(function (k) { cs.appendChild(el('option', { value: k, text: countries[k] })); });
    var ys = Object.keys(years).map(Number).sort(function (a, b) { return a - b; });
    ['f-from', 'f-to'].forEach(function (id) {
      ys.forEach(function (y) { $(id).appendChild(el('option', { value: y, text: y })); });
    });
    hero(Object.keys(countries).length, ys);
  }

  // pills and the count box at the top, in the format of the other Hobby Lab pages
  function hero(nCountries, ys) {
    var kinds = { national: 0, common: 0, joint: 0 };
    var latest = coins[0];
    coins.forEach(function (c) { kinds[c.kind] = (kinds[c.kind] || 0) + 1; if ((c.docDate || '') > (latest.docDate || '')) latest = c; });
    var pills = $('pills');
    pills.textContent = '';
    S.pills(ys[0], ys[ys.length - 1], nCountries, latest.published)
      .forEach(function (t) { pills.appendChild(el('li', { text: t })); });
    var box = $('hero-count');
    box.textContent = '';
    box.appendChild(el('b', { class: 'hl-num', text: String(coins.length) }));
    box.appendChild(el('span', { text: S.countLabel }));
    box.appendChild(el('small', { text: S.kinds(kinds) }));
    box.hidden = false;
    var h = $('hero');
    if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }

  function bind() {
    var timer;
    function update() { saveFilters(); render(); }
    $('f-q').addEventListener('input', function (e) {
      state.q = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    });
    [['f-country', 'country'], ['f-from', 'from'], ['f-to', 'to'], ['f-sort', 'sort'], ['f-kind', 'kind']].forEach(function (p) {
      $(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; update(); });
    });
    $('views').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]');
      if (!b) return;
      state.view = b.getAttribute('data-view');
      syncControls();
      update();
    });
    $('filters').addEventListener('submit', function (e) { e.preventDefault(); });
    $('f-reset').addEventListener('click', function () {
      state = Object.assign({}, DEFAULTS);
      syncControls();
      update();
    });
    $('topics').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-topic]');
      if (!b) return;
      var t = b.getAttribute('data-topic');
      state.topic = state.topic === t ? '' : t;
      syncControls();
      update();
    });
    $('more').addEventListener('click', renderMore);
    ['grid', 'groups'].forEach(function (id) {
      $(id).addEventListener('click', function (e) {
        var b = e.target.closest('.card-btn');
        if (b) location.hash = buildHash(state, b.getAttribute('data-id'));
      });
    });
    window.addEventListener('hashchange', onHash);
  }

  function fail(msg) {
    var e = $('error');
    e.textContent = msg;
    e.hidden = false;
    $('count').textContent = '';
  }

  // topic chips: "All topics" plus one per topic with its number of coins
  function fillTopics() {
    var box = $('topics');
    box.textContent = '';
    if (!TOPICS.length) return;
    box.appendChild(el('button', { type: 'button', class: 'chip', 'data-topic': '', 'aria-pressed': 'true', text: S.allTopics }));
    TOPICS.forEach(function (t) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'data-topic': t.id, 'aria-pressed': 'false' },
        [document.createTextNode(t.label), el('small', { text: String(t.count) })]));
    });
    box.hidden = false;
  }

  // topics are optional: without data/topics.json the catalogue works as before
  var topicsReq = fetch('data/topics.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });

  fetch('data/coins.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var lm = r.headers.get('Last-Modified');
      if (lm) {
        var d = new Date(lm);
        if (!isNaN(d)) {
          $('generated').textContent = d.toISOString().slice(0, 10);
          $('generated').setAttribute('datetime', d.toISOString());
        }
      }
      return Promise.all([r.json(), topicsReq]);
    })
    .then(function (res) {
      coins = res[0];
      var tp = res[1] || { topics: [], coins: {} };
      TOPICS = tp.topics || [];
      TOPICS.forEach(function (t) { if (ES && t.label_es) t.label = t.label_es; topicLabel[t.id] = t.label; });
      if (!TOPICS.length) { var tb = document.querySelector('#views [data-view="topic"]'); if (tb) tb.hidden = true; }
      coins.forEach(function (c) {
        byId[c.id] = c;
        c._cname = cname(c);
        c.topics = (tp.coins && tp.coins[c.id]) || [];
        c._search = [c.subject, c.design, c.country, c._cname, c.commonGroup || '']
          .concat(c.topics.map(function (id) { return topicLabel[id]; })).join(' ').toLowerCase();
      });
      fillTopics();
      fillSelects();
      bind();
      var h = readHash();
      state = h.state;
      syncControls();
      render();
      if (h.coin && byId[h.coin]) showCoin(h.coin);
    })
    .catch(function (err) {
      fail(S.fail(err.message));
    });
})();
