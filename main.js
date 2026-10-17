/* jordijoan.es — small, dependency-free enhancements shared by all pages */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var hasIO = 'IntersectionObserver' in window;

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
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
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
  var KIND = { journal: 'Journal', conference: 'Conference', chapter: 'Chapter', patent: 'Patent', other: 'Other' };
  var ME = /(J\.\s?J\.\s?Gim[eé]nez(?:\s+Gand[ií]a)?)/g;

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
        '<span class="feat-top"><span>' + esc(p.badge || KIND[p.type]) + '</span><span>' + p.year + '</span></span>' +
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
          '</div><span class="pub-kind">' + esc(p.badge || KIND[p.type]) + '</span></li>';
      });
      if (year !== null) html += '</ol>';
      list.innerHTML = html || '<p class="pub-empty">Nothing matches “' + esc(state.q.trim()) + '”. Try another word.</p>';
      if (status) status.textContent = items.length + (items.length === 1 ? ' publication' : ' publications');
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
      galleryMore.textContent = 'Show ' + extra + ' more photos';
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

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
