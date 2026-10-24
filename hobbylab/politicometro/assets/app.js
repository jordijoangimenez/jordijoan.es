/* Politicómetro: the topics-by-parties comparison table, the status of each party's programme and the countdown.
   Reads config/parties.json (parties, their colours and the official documents added so far) and config/topics.json. */
(function () {
  'use strict';
  var root = document.documentElement;
  document.getElementById('theme').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.append(c); });
    return e;
  }
  function getJson(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }
  function programme(p) { return (p.docs || []).filter(function (d) { return d.kind === 'programa'; })[0] || null; }
  function dmy(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }

  function hero(election, parties, topics, nSubs, added) {
    var pills = $('pills');
    pills.textContent = '';
    [election.name, dmy(election.date), parties.length + ' partidos', topics.length + ' temas', 'Programas: ' + added + ' de ' + parties.length]
      .forEach(function (t) { pills.append(el('li', { text: t })); });
    if (window.HLMotion) window.HLMotion.countdown($('countdown'), election.closes, { one: 'día para votar', many: 'días para votar', done: 'Día de votación' });
  }

  // one row per topic, one column per party; a topic opens to show the subtopics that will be compared
  function matrix(parties, topics) {
    var t = $('matrix');
    var head = el('tr', {}, [el('th', { scope: 'col', class: 't-col', text: 'Tema' })]);
    parties.forEach(function (p) {
      head.append(el('th', { scope: 'col', title: p.name }, [el('i', { class: 'dot', style: 'background:' + p.color }), el('span', { text: p.short })]));
    });
    var body = el('tbody');
    topics.forEach(function (tp, r) {
      var subId = 'sub-' + tp.id;
      var btn = el('button', { type: 'button', class: 't-btn', 'aria-expanded': 'false', 'aria-controls': subId },
        [el('span', { text: tp.name }), el('small', { text: tp.subs.length + ' subtemas' })]);
      var row = el('tr', { class: 't-row' }, [el('th', { scope: 'row' }, [btn])]);
      parties.forEach(function (p, c) {
        var doc = programme(p);
        row.append(el('td', {}, [el('span', {
          class: 'cell' + (doc ? ' ready' : ''),
          style: '--pc:' + p.color + ';--r:' + r + ';--c:' + c,
          title: p.short + ' · ' + tp.name + ': ' + (doc ? 'programa incorporado' : 'programa pendiente')
        })]));
      });
      var subs = el('ul', { class: 'subs' });
      tp.subs.forEach(function (s) { subs.append(el('li', { text: s.name })); });
      var detail = el('tr', { class: 'sub-row', id: subId, hidden: '' }, [el('td', { colspan: String(parties.length + 1) }, [el('p', { text: 'Se compararán las propuestas sobre:' }), subs])]);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        detail.hidden = open;
      });
      body.append(row, detail);
    });
    t.append(el('thead', {}, [head]), body);
  }

  function partyList(parties) {
    var ul = $('parties');
    parties.forEach(function (p) {
      var doc = programme(p);
      var status = doc
        ? el('a', { class: 'status done', href: doc.url, rel: 'noopener', text: 'Programa incorporado' + (doc.date ? ' · ' + dmy(doc.date) : '') })
        : el('span', { class: 'status pending', text: 'Programa pendiente' });
      var site = (p.watch || [])[0];
      ul.append(el('li', { class: 'tile', style: '--pc:' + p.color }, [
        el('p', { class: 'p-head' }, [el('b', { text: p.short }), el('span', { text: p.name })]),
        status,
        p.note ? el('p', { class: 'p-note', text: p.note }) : null,
        site ? el('a', { class: 'p-site', href: site, rel: 'noopener', text: 'Web oficial' }) : null
      ]));
    });
  }

  Promise.all([getJson('config/parties.json'), getJson('config/topics.json')]).then(function (res) {
    var parties = res[0].parties, election = res[0].election, topics = res[1].topics;
    var nSubs = topics.reduce(function (a, t) { return a + t.subs.length; }, 0);
    var added = parties.filter(programme).length;
    hero(election, parties, topics, nSubs, added);
    $('cmp-hint').textContent = topics.length + ' temas por ' + parties.length + ' partidos · programas incorporados: ' + added + ' de ' + parties.length;
    $('empty').hidden = added > 0;
    $('n-topics').textContent = String(topics.length);
    $('n-subs').textContent = String(nSubs);
    matrix(parties, topics);
    partyList(parties);
    var h = $('hero');
    if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }).catch(function () { $('error').hidden = false; });
})();
