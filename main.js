/* jordijoan.es — small, dependency-free enhancements shared by all pages */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Strings built by this script, per page language ---------- */
  var I18N = {
    en: {
      menuOpen: 'Open menu', menuClose: 'Close menu', sep: ',',
      kind: { journal: 'Journal', conference: 'Conference', chapter: 'Chapter', patent: 'Patent', other: 'Other' },
      badge: {},
      none: 'Nothing matches “{q}”. Try another word.', one: '{n} publication', many: '{n} publications',
      morePhotos: 'Show {n} more photos'
    },
    ca: {
      menuOpen: 'Obrir el menú', menuClose: 'Tancar el menú', sep: '.',
      kind: { journal: 'Revista', conference: 'Congrés', chapter: 'Capítol', patent: 'Patent', other: 'Altres' },
      badge: { 'Editorial': 'Editorial', 'Patent application': 'Sol·licitud de patent', 'Project report': 'Informe de projecte', 'White paper': 'Llibre blanc', 'PhD thesis': 'Tesi doctoral' },
      none: 'Cap resultat per a «{q}». Prova una altra paraula.', one: '{n} publicació', many: '{n} publicacions',
      morePhotos: 'Mostrar {n} fotos més'
    },
    es: {
      menuOpen: 'Abrir el menú', menuClose: 'Cerrar el menú', sep: '.',
      kind: { journal: 'Revista', conference: 'Congreso', chapter: 'Capítulo', patent: 'Patente', other: 'Otros' },
      badge: { 'Editorial': 'Editorial', 'Patent application': 'Solicitud de patente', 'Project report': 'Informe de proyecto', 'White paper': 'Libro blanco', 'PhD thesis': 'Tesis doctoral' },
      none: 'Ningún resultado para «{q}». Prueba con otra palabra.', one: '{n} publicación', many: '{n} publicaciones',
      morePhotos: 'Ver {n} fotos más'
    },
    de: {
      menuOpen: 'Menü öffnen', menuClose: 'Menü schließen', sep: '.',
      kind: { journal: 'Zeitschrift', conference: 'Konferenz', chapter: 'Buchkapitel', patent: 'Patent', other: 'Sonstiges' },
      badge: { 'Editorial': 'Editorial', 'Patent application': 'Patentanmeldung', 'Project report': 'Projektbericht', 'White paper': 'White Paper', 'PhD thesis': 'Dissertation' },
      none: 'Keine Treffer für „{q}“. Versuchen Sie ein anderes Wort.', one: '{n} Publikation', many: '{n} Publikationen',
      morePhotos: '{n} weitere Fotos anzeigen'
    },
    fr: {
      menuOpen: 'Ouvrir le menu', menuClose: 'Fermer le menu', sep: ' ',
      kind: { journal: 'Revue', conference: 'Conférence', chapter: 'Chapitre', patent: 'Brevet', other: 'Autre' },
      badge: { 'Editorial': 'Éditorial', 'Patent application': 'Demande de brevet', 'Project report': 'Rapport de projet', 'White paper': 'Livre blanc', 'PhD thesis': 'Thèse de doctorat' },
      none: 'Aucun résultat pour « {q} ». Essayez un autre mot.', one: '{n} publication', many: '{n} publications',
      morePhotos: 'Afficher {n} photos de plus'
    },
    zh: {
      menuOpen: '打开菜单', menuClose: '关闭菜单', sep: ',',
      kind: { journal: '期刊', conference: '会议', chapter: '书籍章节', patent: '专利', other: '其他' },
      badge: { 'Editorial': '社论', 'Patent application': '专利申请', 'Project report': '项目报告', 'White paper': '白皮书', 'PhD thesis': '博士论文' },
      none: '没有与“{q}”匹配的结果，请换个关键词。', one: '{n} 项', many: '{n} 项',
      morePhotos: '再显示 {n} 张照片'
    }
  };
  var T = I18N[(root.lang || 'en').slice(0, 2).toLowerCase()] || I18N.en;
  function say(s, vars) {
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k]; });
  }

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* ---------- Theme ---------- */
  var toggle = document.querySelector('.theme-toggle');
  function isDark() {
    var t = root.dataset.theme;
    return t ? t === 'dark' : darkQuery.matches;
  }
  if (toggle) {
    var syncToggle = function () { toggle.setAttribute('aria-pressed', String(isDark())); };
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncToggle();
    });
    onChange(darkQuery, syncToggle);
    syncToggle();
  }

  /* ---------- Nav: border on scroll, phone menu, active section ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var menu = document.getElementById('site-menu');
  var menuBtn = document.querySelector('.menu-toggle');
  if (menu && menuBtn) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
    };
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  var navLinks = {};
  document.querySelectorAll('.menu a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute('href').slice(1)] = a;
  });
  if (hasIO && Object.keys(navLinks).length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(navLinks).forEach(function (id) {
          navLinks[id].classList.toggle('active', id === e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navLinks).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (hasIO && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Key figures count up once when they come into view ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (hasIO && !reduceMotion.matches && counters.length) {
    var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, T.sep); };
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        var el = e.target, end = Number(el.dataset.count), suffix = el.dataset.suffix || '';
        var start = performance.now(), dur = 1100;
        var step = function (now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(end * eased) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- Publications ---------- */
  var PUBS = (window.PUBLICATIONS || []).slice();
  var ME = /(J\.\s?J\.\s?Gim[eé]nez(?:\s+Gand[ií]a)?)/g;

  function kindLabel(p) {
    return p.badge ? (T.badge[p.badge] || p.badge) : T.kind[p.type];
  }

  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function href(p) {
    if (p.url) return p.url;
    if (p.doi) return 'https://doi.org/' + p.doi;
    return 'https://scholar.google.com/scholar?q=' + encodeURIComponent('"' + p.title + '"');
  }

  PUBS.forEach(function (p) { p._s = norm([p.title, p.authors, p.venue, p.year, p.badge || ''].join(' ')); });
  PUBS.sort(function (a, b) { return b.year - a.year; });

  document.querySelectorAll('[data-pub-count]').forEach(function (el) {
    if (PUBS.length) el.textContent = PUBS.length;
  });

  var featured = document.getElementById('pub-featured');
  if (featured && PUBS.length) {
    featured.innerHTML = PUBS.filter(function (p) { return p.featured; }).slice(0, 3).map(function (p) {
      return '<a class="feat" href="' + esc(href(p)) + '" target="_blank" rel="noopener">' +
        '<span class="feat-top"><span>' + esc(kindLabel(p)) + '</span><span>' + p.year + '</span></span>' +
        '<span class="feat-title">' + esc(p.title) + '</span>' +
        '<span class="feat-venue">' + esc(p.venue) + '</span></a>';
    }).join('');
  }

  var list = document.getElementById('pub-list');
  if (list && PUBS.length) {
    var chips = document.querySelectorAll('.chip[data-type]');
    var search = document.getElementById('pub-search');
    var status = document.getElementById('pub-status');
    var state = { type: 'all', q: '' };

    chips.forEach(function (c) {
      var t = c.dataset.type;
      c.querySelector('.n').textContent = t === 'all'
        ? PUBS.length
        : PUBS.filter(function (p) { return p.type === t; }).length;
    });

    var render = function () {
      var q = norm(state.q.trim());
      var terms = q ? q.split(/\s+/) : [];
      var items = PUBS.filter(function (p) {
        return (state.type === 'all' || p.type === state.type) &&
          terms.every(function (t) { return p._s.indexOf(t) !== -1; });
      });
      var html = '', year = null;
      items.forEach(function (p) {
        if (p.year !== year) {
          if (year !== null) html += '</ol>';
          year = p.year;
          html += '<h2 class="pub-year">' + year + '</h2><ol class="pub-group">';
        }
        html += '<li class="pub"><div>' +
          '<a class="pub-title" href="' + esc(href(p)) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' +
          '<p class="pub-authors">' + esc(p.authors).replace(ME, '<b>$1</b>') + '</p>' +
          '<p class="pub-venue">' + esc(p.venue) +
            (p.award ? ' · <span class="pub-award">' + esc(p.award) + '</span>' : '') + '</p>' +
          '</div><span class="pub-kind">' + esc(kindLabel(p)) + '</span></li>';
      });
      if (year !== null) html += '</ol>';
      list.innerHTML = html || '<p class="pub-empty">' + say(esc(T.none), { q: esc(state.q.trim()) }) + '</p>';
      if (status) status.textContent = say(items.length === 1 ? T.one : T.many, { n: items.length });
    };

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.type = c.dataset.type;
        chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        render();
      });
    });
    if (search) search.addEventListener('input', function () { state.q = search.value; render(); });
    render();
  }

  /* ---------- Gallery: strongest photos first ---------- */
  var gallery = document.getElementById('gallery');
  var galleryMore = document.getElementById('gallery-more');
  if (gallery && galleryMore) {
    var extra = gallery.querySelectorAll('.photo-more').length;
    if (extra) {
      gallery.classList.add('collapsed');
      galleryMore.hidden = false;
      galleryMore.textContent = say(T.morePhotos, { n: extra });
      galleryMore.addEventListener('click', function () {
        gallery.classList.remove('collapsed');
        galleryMore.hidden = true;
      });
    }
  }

  /* ---------- Photo viewer ---------- */
  var box = document.querySelector('.lightbox');
  if (box && box.showModal) {
    var boxImg = box.querySelector('img');
    var boxCap = box.querySelector('.lightbox-caption');
    document.querySelectorAll('.photo a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        boxImg.src = a.getAttribute('href');
        boxImg.alt = a.querySelector('img').alt;
        boxCap.textContent = a.parentNode.querySelector('figcaption').textContent;
        box.showModal();
      });
    });
    box.querySelector('.lightbox-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  }

  /* ---------- Language menu closes on outside click or Escape ---------- */
  var langMenu = document.querySelector('.lang');
  if (langMenu) {
    document.addEventListener('click', function (e) {
      if (langMenu.open && !langMenu.contains(e.target)) langMenu.open = false;
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') langMenu.open = false; });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
