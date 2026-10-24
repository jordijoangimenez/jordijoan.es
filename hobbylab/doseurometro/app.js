(function () {
  'use strict';

  var PAGE = 48;
  var DEFAULTS = { q: '', country: '', from: '', to: '', sort: 'year-asc', view: 'year', kind: '' };
  var VIEWS = ['all', 'year', 'country', 'common'];
  var KINDS = ['national', 'common', 'joint'];
  var KIND_LABEL = { national: 'National issue', common: 'Common issue', joint: 'Joint issue' };
  var coins = [];
  var byId = {};
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
    return '2-euro coin, ' + c.country + ' ' + c.year + ': ' + c.subject;
  }

  /* ---------- URL hash state ---------- */

  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
    var s = Object.assign({}, DEFAULTS);
    Object.keys(DEFAULTS).forEach(function (k) { if (p.has(k)) s[k] = p.get(k); });
    if (['year-asc', 'year-desc', 'country'].indexOf(s.sort) < 0) s.sort = DEFAULTS.sort;
    if (VIEWS.indexOf(s.view) < 0) s.view = DEFAULTS.view;
    if (s.kind && KINDS.indexOf(s.kind) < 0) s.kind = '';
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
      if (state.view === 'common' && c.kind !== 'common') return false;
      if (q && c._search.indexOf(q) < 0) return false;
      return true;
    });
    var byYearAsc = function (a, b) { return a.year - b.year || a.country.localeCompare(b.country); };
    var byYearDesc = function (a, b) { return b.year - a.year || a.country.localeCompare(b.country); };
    var byCountry = function (a, b) { return a.country.localeCompare(b.country) || a.year - b.year; };
    var cmp;
    if (state.view === 'country') cmp = byCountry;
    else if (state.view === 'common') cmp = state.sort === 'year-desc' ? byYearDesc : byYearAsc;
    else cmp = { 'year-asc': byYearAsc, 'year-desc': byYearDesc, 'country': byCountry }[state.sort];
    filtered.sort(cmp);
  }

  // Group key and heading for the grouped views; filtered is already in display order.
  function groupOf(c) {
    if (state.view === 'year') return { key: String(c.year), title: String(c.year) };
    if (state.view === 'country') return { key: c.countryCode, title: c.country };
    return { key: c.commonGroup || c.subject, title: (c.commonGroup || c.subject), note: 'Issued in ' + c.year };
  }

  function renderGroups() {
    var box = $('groups');
    box.textContent = '';
    var groups = [];
    var last = null;
    filtered.forEach(function (c) {
      var g = groupOf(c);
      if (!last || last.key !== g.key) { last = { key: g.key, title: g.title, note: g.note, coins: [] }; groups.push(last); }
      last.coins.push(c);
    });
    var frag = document.createDocumentFragment();
    groups.forEach(function (g, i) {
      var countries = {};
      g.coins.forEach(function (c) { countries[c.countryCode] = 1; });
      var sub = g.coins.length + (g.coins.length === 1 ? ' coin' : ' coins');
      if (state.view === 'common') sub = Object.keys(countries).length + ' countries · ' + g.note;
      else if (state.view === 'year') sub += ' · ' + Object.keys(countries).length + (Object.keys(countries).length === 1 ? ' country' : ' countries');
      else sub += ' · ' + g.coins[0].year + ' to ' + g.coins[g.coins.length - 1].year;
      var ul = el('ul', { class: 'grid', 'aria-label': g.title });
      g.coins.forEach(function (c) { ul.appendChild(cardNode(c)); });
      frag.appendChild(el('section', { class: 'group', 'aria-labelledby': 'g-' + i }, [
        el('h3', { id: 'g-' + i, class: 'group-h' }, [document.createTextNode(g.title), el('span', { class: 'group-sub', text: sub })]),
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
      el('span', { class: 'card-meta', text: c.year + ' · ' + c.country }),
      el('span', { class: 'card-subject', text: c.subject }),
      c.kind && c.kind !== 'national' ? el('span', { class: 'tag', text: KIND_LABEL[c.kind] }) : null,
      c.hasNotice ? null : el('span', { class: 'badge', text: 'No Commission notice published' })
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
    $('more').textContent = 'Load more (' + (filtered.length - shown) + ' left)';
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
    $('count').textContent = n === 0 ? 'No coins match these filters.'
      : n === coins.length ? 'All ' + n + ' coins · open one for its official description'
      : n + (n === 1 ? ' coin' : ' coins') + ' match';
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
    info.appendChild(el('h2', { id: 'dlg-title', text: c.subject }));
    info.appendChild(el('p', { text: c.country + ', ' + c.year }));
    if (!c.hasNotice) info.appendChild(el('p', {}, [el('span', { class: 'badge', text: 'No Commission notice published' })]));
    if (c.kind && c.kind !== 'national') {
      var same = coins.filter(function (o) { return o.kind === c.kind && (o.commonGroup || o.subject) === (c.commonGroup || c.subject) && o.year === c.year; }).length;
      info.appendChild(el('p', {}, [el('span', { class: 'tag', text: KIND_LABEL[c.kind] }),
        document.createTextNode(' ' + (c.kind === 'common' ? 'Same design issued by ' + same + ' euro-area countries.' : 'Subject shared with another country; designs may differ.'))]));
    }

    info.appendChild(el('h3', { text: 'Design description' }));
    info.appendChild(el('p', { text: c.design || 'Not available.' }));
    if (c.extra) {
      info.appendChild(el('h3', { text: 'Additional text from the notice' }));
      info.appendChild(el('p', { text: c.extra }));
    }

    var dl = el('dl', { class: 'facts' });
    fact(dl, 'Country', c.country + (c.countryCode ? ' (' + c.countryCode + ')' : ''));
    fact(dl, 'Year', String(c.year));
    fact(dl, 'Mintage', c.number);
    fact(dl, 'Issue date', c.issue);
    fact(dl, 'OJ reference', c.ojRef);
    fact(dl, 'Published', c.published);
    fact(dl, 'Source', c.source, c.sourceUrl);
    info.appendChild(dl);

    if (c.officialUrl) {
      info.appendChild(el('a', { class: 'btn btn-primary btn-link', href: c.officialUrl, target: '_blank', rel: 'noopener', text: 'Open the official notice' }));
    }
    box.appendChild(img);
    box.appendChild(info);
    box.parentNode.scrollTop = 0;
    dlg.scrollTop = 0;

    var i = filtered.indexOf(c);
    $('dlg-pos').textContent = i >= 0 ? (i + 1) + ' of ' + filtered.length : '';
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
    coins.forEach(function (c) { countries[c.countryCode] = c.country; years[c.year] = 1; });
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
    ['2-euro commemoratives', ys[0] + '–' + ys[ys.length - 1], nCountries + ' countries', 'Latest notice ' + latest.published]
      .forEach(function (t) { pills.appendChild(el('li', { text: t })); });
    var box = $('hero-count');
    box.textContent = '';
    box.appendChild(el('b', { class: 'hl-num', text: String(coins.length) }));
    box.appendChild(el('span', { text: 'coins, each with its official notice' }));
    box.appendChild(el('small', { text: kinds.national + ' national · ' + kinds.common + ' common · ' + kinds.joint + ' joint' }));
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
      return r.json();
    })
    .then(function (data) {
      coins = data;
      coins.forEach(function (c) {
        byId[c.id] = c;
        c._search = [c.subject, c.design, c.country, c.commonGroup || ''].join(' ').toLowerCase();
      });
      fillSelects();
      bind();
      var h = readHash();
      state = h.state;
      syncControls();
      render();
      if (h.coin && byId[h.coin]) showCoin(h.coin);
    })
    .catch(function (err) {
      fail('The coin data could not be loaded (' + err.message + '). ' +
        'If you opened this page as a local file, serve the folder over http instead, for example with a simple static web server.');
    });
})();
