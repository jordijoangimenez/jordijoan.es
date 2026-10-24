/* Hobby Lab motion layer (see motion.css). The page apps render their content into .card sections after loading
   data; this script notices content arriving, waits until a card is on screen, tags its parts and plays the entrance.
   Content re-rendered later appears at once unless the app asks for a replay with HLMotion.replay(card).
   API: HLMotion.replay(el), HLMotion.countdown(el, isoDate, label) */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('hl-motion');
  if (reduce.matches) root.classList.add('hl-reduce');

  var ITEMS = '.bar-row, .seat-list li, .rank button, .legend button, .legend select, .chip, .minimal li, .tile, .mini, tbody tr, .fit-sum > div, .summary > div, .coal-result, .presets button, .map-legend span, .bars-key span, .key-row span, .hl-pills li, .card-head, .seg, .map-ctl, .ramp-box, .others, .note';
  var GROW = '.track .fill, .rank .bar, .meter i, .sb i';
  var COUNT = '.hl-num, .hero-num, .center-num, .seat-list .num, .tile .v, .coal-result .big, .summary b, .fit-sum b, .rank .val';
  var MAP = '.map-svg .cty, .map-svg .prov';
  var SCOPES = '.card, .hl-rise';

  function hasContent(el) { return el.children.length > 0 && el.textContent.trim().length > 0; }
  function inView(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < (window.innerHeight || 800) * 0.92 && r.height > 0; }
  function raf2(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }

  // ---- tag the parts of a card for its entrance ----
  function prepare(card) {
    var items = card.querySelectorAll(ITEMS), i;
    for (i = 0; i < items.length; i++) { items[i].classList.add('hl-item'); items[i].style.setProperty('--hl-i', Math.min(i, 22)); }
    var grow = card.querySelectorAll(GROW);
    for (i = 0; i < grow.length; i++) {
      grow[i].classList.add('hl-grow');
      if (grow[i].classList.contains('neg')) grow[i].classList.add('hl-from-right');
    }
    // seats: scatter each one somewhere around the chamber, then sweep them in left to right
    var seats = card.querySelectorAll('.hemi .seat');
    for (i = 0; i < seats.length; i++) {
      var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
      seats[i].style.setProperty('--fx', (Math.cos(a) * d).toFixed(0) + 'px');
      seats[i].style.setProperty('--fy', (Math.sin(a) * d - 80).toFixed(0) + 'px');
      seats[i].style.setProperty('--fd', Math.round(i / Math.max(1, seats.length) * 900 + Math.random() * 220) + 'ms');
    }
    // maps: west to east
    var shapes = card.querySelectorAll(MAP);
    if (shapes.length) {
      var svg = shapes[0].ownerSVGElement, vb = svg && svg.viewBox && svg.viewBox.baseVal, x0 = vb ? vb.x : 0, w = vb && vb.width ? vb.width : 1000;
      for (i = 0; i < shapes.length; i++) {
        var bx = 0; try { bx = shapes[i].getBBox().x; } catch (e) { bx = 0; }
        shapes[i].classList.add('hl-map-shape');
        shapes[i].style.setProperty('--fd', Math.round(Math.max(0, (bx - x0) / w) * 700) + 'ms');
      }
    }
    // chart lines draw themselves
    var paths = card.querySelectorAll('svg path'), drawn = [];
    for (i = 0; i < paths.length; i++) {
      var p = paths[i];
      if (p.closest('.map-svg') || !p.getAttribute('stroke') || (p.getAttribute('fill') && p.getAttribute('fill') !== 'none')) continue;
      var len = 0; try { len = p.getTotalLength(); } catch (e) { len = 0; }
      if (len < 40) continue;
      p.style.strokeDasharray = len + ' ' + len;
      p.style.strokeDashoffset = len;
      drawn.push(p);
    }
    return drawn;
  }

  function play(card, drawn) {
    card.classList.add('hl-seen', 'hl-on');
    card.classList.remove('hl-done');
    for (var i = 0; i < drawn.length; i++) {
      drawn[i].style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.3, 0.6, 0.2, 1) ' + (250 + i * 70) + 'ms';
      drawn[i].style.strokeDashoffset = '0';
    }
    countUp(card);
    clearTimeout(card._hlDone);
    card._hlDone = setTimeout(function () {
      card.classList.add('hl-done');
      for (var j = 0; j < drawn.length; j++) { drawn[j].style.transition = ''; drawn[j].style.strokeDasharray = ''; drawn[j].style.strokeDashoffset = ''; }
    }, 2600 + drawn.length * 70);
  }

  function start(card) {
    if (card._hlBusy) return;
    card._hlBusy = true;
    if (reduce.matches) { card.classList.add('hl-seen', 'hl-on', 'hl-done'); card._hlBusy = false; return; }
    var drawn = prepare(card);
    raf2(function () { play(card, drawn); card._hlBusy = false; });
  }

  function replay(card) {
    if (!card || reduce.matches) return;
    card.classList.remove('hl-on', 'hl-done');
    var drawn = prepare(card);
    raf2(function () { play(card, drawn); });
  }

  // ---- numbers count up from zero, keeping their format ("31,2", "1.234", "−2,4 %", "+19 %") ----
  var NUM = /^([^\d+−-]*)([+−-]?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/;
  function countUp(card) {
    var els = card.querySelectorAll(COUNT);
    for (var i = 0; i < els.length && i < 80; i++) animateNumber(els[i], i);
  }
  function animateNumber(el, i) {
    if (el.children.length > 1) return;
    var node = null;
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /\d/.test(c.nodeValue)) { node = c; break; }
    if (!node) return;
    var m = NUM.exec(node.nodeValue.trim());
    if (!m) return;
    var dec = m[4] ? m[4].length : 0, target = parseFloat(m[3].replace(/\./g, '') + (dec ? '.' + m[4] : ''));
    if (!isFinite(target) || target === 0) return;
    var fmt = new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: m[3].indexOf('.') >= 0 || target >= 10000 });
    var final = node.nodeValue, t0 = null, dur = 900 + Math.min(i, 10) * 25, delay = 150 + Math.min(i, 16) * 38;
    function frame(t) {
      if (!node.parentNode) return;
      if (t0 === null) t0 = t + delay;
      var k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      node.nodeValue = k >= 1 ? final : m[1] + m[2] + fmt.format(target * e) + m[5];
      if (k < 1) requestAnimationFrame(frame);
    }
    node.nodeValue = m[1] + m[2] + fmt.format(0) + m[5];
    requestAnimationFrame(frame);
  }

  // ---- watch for cards getting content and coming into view ----
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var el = entries[i].target;
      if (entries[i].isIntersecting && hasContent(el) && !el.classList.contains('hl-seen')) start(el);
    }
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  function watch(el) {
    if (el._hlWatched) return;
    el._hlWatched = true;
    if (!io || reduce.matches) { el.classList.add('hl-seen', 'hl-on', 'hl-done'); return; }
    io.observe(el);
  }
  function scan() {
    var cards = document.querySelectorAll(SCOPES);
    for (var i = 0; i < cards.length; i++) {
      watch(cards[i]);
      // a card already on screen whose content just arrived
      if (!cards[i].classList.contains('hl-seen') && hasContent(cards[i]) && inView(cards[i])) start(cards[i]);
    }
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
  scan();

  // ---- small cards lean towards the pointer ----
  if (!reduce.matches && window.matchMedia('(hover: hover)').matches) {
    var TILT = '.mini, .tile, .hl-count';
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest(TILT);
      if (!el) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('hl-tilt');
      el.style.transform = 'perspective(700px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-2px)';
    });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest && e.target.closest(TILT);
      if (el && !el.contains(e.relatedTarget)) el.style.transform = '';
    });
  }

  // ---- night sky: slow drifting points with a little parallax ----
  function sky() {
    var c = document.createElement('canvas');
    c.className = 'hl-sky';
    c.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(c, document.body.firstChild);
    var ctx = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, stars = [], px = 0, py = 0, tx = 0, ty = 0, frame = 0;
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(160, W * H / 9000));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, z: Math.random() * 0.8 + 0.2, a: Math.random() * Math.PI * 2, s: Math.random() * 0.015 + 0.004 });
    }
    function dark() { var bg = getComputedStyle(root).getPropertyValue('--page').trim(); return /^#(0|1)/i.test(bg); }
    function draw() {
      frame++;
      if (!document.hidden && frame % 2 === 0) {
        px += (tx - px) * 0.04; py += (ty - py) * 0.04;
        ctx.clearRect(0, 0, W, H);
        var on = dark(), scrollY = window.scrollY || 0;
        if (on) {
          for (var i = 0; i < stars.length; i++) {
            var s = stars[i]; s.a += s.s;
            var x = (s.x + px * s.z * 18 + W) % W, y = ((s.y - scrollY * s.z * 0.08 + py * s.z * 12) % H + H) % H;
            ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(s.a)) * s.z;
            ctx.fillStyle = '#cfd8ff';
            ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5; });
    requestAnimationFrame(draw);
  }
  if (!reduce.matches) sky();

  // ---- countdown ----
  function countdown(el, iso, label) {
    var end = Date.parse(iso);
    if (!el || !isFinite(end)) return;
    el.classList.add('hl-count');
    var b = document.createElement('b'), span = document.createElement('span'), small = document.createElement('small');
    el.textContent = '';
    el.append(b, span, small);
    function tick() {
      var ms = end - Date.now();
      if (ms <= 0) { b.textContent = '0'; span.textContent = label.done || 'Día de votación'; small.textContent = ''; return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, mi = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      b.textContent = String(d);
      span.textContent = d === 1 ? label.one : label.many;
      small.textContent = '';
      [[h, 'h'], [mi, 'm'], [s, 's']].forEach(function (p) { small.append(String(p[0]).padStart(2, '0')); var u = document.createElement('i'); u.textContent = p[1]; small.append(u); });
      el.setAttribute('aria-label', d + ' ' + (d === 1 ? label.one : label.many));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    }
    tick();
  }

  window.HLMotion = { replay: replay, countdown: countdown };
})();
