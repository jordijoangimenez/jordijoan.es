/* Politicómetro: the topics-by-parties comparison table, the status of each party's documents and the countdown.
   Reads config/parties.json, config/topics.json and data/quotes.json (built by scripts/build.mjs: the literal quotes,
   their topics and subtopics, and the concreteness marks). */
(function () {
  'use strict';
  var root = document.documentElement;
  document.getElementById('theme').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var KIND = { programa: 'programa electoral', compromisos: 'documento de compromisos' };
  var FLAG = { cifra: 'cifra', plazo: 'plazo', ley: 'ley' };
  var FLAG_TITLE = { cifra: 'Da una cantidad, un porcentaje o un importe', plazo: 'Fija un plazo o un calendario', ley: 'Cita una ley o una norma' };

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.append(c); });
    return e;
  }
  function getJson(url, optional) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) { if (optional) return null; throw new Error(url); }
      return r.json();
    });
  }
  function dmy(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function hero(election, parties, topics, withDocs) {
    var pills = $('pills');
    pills.textContent = '';
    [election.name, dmy(election.date), parties.length + ' partidos', topics.length + ' temas', 'Documentos: ' + withDocs + ' de ' + parties.length]
      .forEach(function (t) { pills.append(el('li', { text: t })); });
    if (window.HLMotion) window.HLMotion.countdown($('countdown'), election.closes, { one: 'día para votar', many: 'días para votar', done: 'Día de votación' });
  }

  function quoteCard(q, doc) {
    var meta = el('p', { class: 'q-meta' }, ['p. ' + q.page + ' · ', el('a', { href: doc.url + '#page=' + q.page, rel: 'noopener', text: 'ver en el documento' })]);
    q.flags.forEach(function (f) { meta.append(' ', el('span', { class: 'flag', title: FLAG_TITLE[f], text: FLAG[f] })); });
    return el('li', {}, [el('blockquote', { class: 'q', lang: 'es' }, [el('p', { text: '«' + q.text + '»' })]), meta]);
  }

  // one row per topic, one column per party; a topic opens to show a tick per subtopic and party, then the quotes
  function matrix(parties, topics, quotes, docsById) {
    var t = $('matrix');
    var head = el('tr', {}, [el('th', { scope: 'col', class: 't-col', text: 'Tema' })]);
    parties.forEach(function (p) {
      head.append(el('th', { scope: 'col', title: p.name }, [el('i', { class: 'dot', style: 'background:' + p.color }), el('span', { text: p.short })]));
    });
    var body = el('tbody');
    var rows = topics.concat([{ id: '_otros', name: 'Otras propuestas', subs: [], other: true }]);
    rows.forEach(function (tp, r) {
      var inTopic = quotes.filter(function (q) { return tp.other ? !q.topics.length : q.topics.indexOf(tp.id) >= 0; });
      if (tp.other && !inTopic.length) return;
      var detailId = 'det-' + tp.id;
      var btn = el('button', { type: 'button', class: 't-btn', 'aria-expanded': 'false', 'aria-controls': detailId },
        [el('span', { text: tp.name }), el('small', { text: tp.other ? 'sin tema' : plural(tp.subs.length, 'subtema', 'subtemas') })]);
      var row = el('tr', { class: 't-row' }, [el('th', { scope: 'row' }, [btn])]);
      parties.forEach(function (p, c) {
        var mine = inTopic.filter(function (q) { return q.party === p.id; });
        var hasDoc = (p.docs || []).length > 0;
        var flags = {};
        mine.forEach(function (q) { q.flags.forEach(function (f) { flags[f] = (flags[f] || 0) + 1; }); });
        var title = p.short + ' · ' + tp.name + ': ' + (mine.length
          ? plural(mine.length, 'propuesta', 'propuestas') + Object.keys(FLAG).filter(function (f) { return flags[f]; }).map(function (f) { return ', ' + flags[f] + ' con ' + FLAG[f]; }).join('')
          : hasDoc ? 'nada sobre este tema' : 'documento pendiente');
        row.append(el('td', {}, [el('span', {
          class: 'cell' + (mine.length ? ' on' : hasDoc ? ' none' : ''),
          style: '--pc:' + p.color + ';--r:' + r + ';--c:' + c,
          title: title,
          text: mine.length ? String(mine.length) : ''
        })]));
      });
      body.append(row);

      // detail: subtopic ticks aligned with the party columns, then the quotes of each party
      var detail = [];
      tp.subs.forEach(function (s) {
        var tr = el('tr', { class: 'sub-tick', hidden: '' }, [el('th', { scope: 'row', text: s.name })]);
        parties.forEach(function (p) {
          var n = inTopic.filter(function (q) { return q.party === p.id && q.subs.indexOf(s.id) >= 0; }).length;
          tr.append(el('td', {}, [n
            ? el('span', { class: 'tick', style: '--pc:' + p.color, title: p.short + ' · ' + s.name + ': ' + plural(n, 'propuesta', 'propuestas'), text: '✓' })
            : el('span', { class: 'tick none', title: p.short + ' · ' + s.name + ': nada', text: '·' })]));
        });
        detail.push(tr);
      });
      var cell = el('td', { colspan: String(parties.length + 1) });
      var any = false;
      parties.forEach(function (p) {
        var mine = inTopic.filter(function (q) { return q.party === p.id; });
        if (!mine.length) return;
        any = true;
        var list = el('ol', { class: 'q-list' });
        mine.forEach(function (q) { list.append(quoteCard(q, docsById[q.doc])); });
        var doc = docsById[mine[0].doc];
        cell.append(el('section', { class: 'pq', style: '--pc:' + p.color }, [
          el('h3', {}, [el('b', { text: p.short }), ' ', el('span', { text: '«' + doc.title + '» · ' + (KIND[doc.kind] || doc.kind) + ' · ' + dmy(doc.date) })]),
          list
        ]));
      });
      if (!any) cell.append(el('p', { class: 'q-none', text: 'Todavía ningún partido ha hecho propuestas sobre este tema en los documentos incorporados.' }));
      detail.push(el('tr', { class: 'q-row', hidden: '' }, [cell]));
      detail[0].id = detailId;
      detail.forEach(function (d) { body.append(d); });

      function toggle() {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        detail.forEach(function (d) { d.hidden = open; });
      }
      btn.addEventListener('click', toggle);
      // a click on a filled cell opens the topic too (the topic button is the keyboard path)
      row.addEventListener('click', function (e) { if (e.target.classList && e.target.classList.contains('on') && btn.getAttribute('aria-expanded') !== 'true') toggle(); });
    });
    t.append(el('thead', {}, [head]), body);
  }

  function partyList(parties, topics, quotes, docsById) {
    var ul = $('parties');
    var nSubs = topics.reduce(function (a, t) { return a + t.subs.length; }, 0);
    parties.forEach(function (p) {
      var docs = p.docs || [];
      var mine = quotes.filter(function (q) { return q.party === p.id; });
      var kids = [el('p', { class: 'p-head' }, [el('b', { text: p.short }), el('span', { text: p.name })])];
      if (!docs.length) kids.push(el('span', { class: 'status pending', text: 'Programa pendiente' }));
      docs.forEach(function (d) {
        kids.push(el('a', { class: 'status done', href: d.url, rel: 'noopener', title: 'Abrir el documento oficial (PDF)', text: '«' + d.title + '» · ' + dmy(d.date) }));
        if (d.kind !== 'programa') kids.push(el('p', { class: 'p-note', text: 'Es un ' + (KIND[d.kind] || d.kind) + ', no el programa completo.' }));
      });
      if (mine.length) {
        var topicsHit = {}, subsHit = {}, flags = { cifra: 0, plazo: 0, ley: 0 };
        mine.forEach(function (q) {
          q.topics.forEach(function (t) { topicsHit[t] = 1; });
          q.subs.forEach(function (s) { subsHit[s] = 1; });
          q.flags.forEach(function (f) { flags[f]++; });
        });
        function stat(v, label, title) { return el('li', title ? { title: title } : {}, [el('b', { class: 'v', text: String(v) }), el('span', { text: label })]); }
        kids.push(el('ul', { class: 'p-stats', 'aria-label': 'Cifras de ' + p.short }, [
          stat(mine.length, 'propuestas'),
          stat(Object.keys(topicsHit).length + '/' + topics.length, 'temas', 'Temas con al menos una propuesta'),
          stat(Object.keys(subsHit).length + '/' + nSubs, 'subtemas', 'Subtemas con al menos una propuesta'),
          stat(flags.cifra, 'con cifra', FLAG_TITLE.cifra),
          stat(flags.plazo, 'con plazo', FLAG_TITLE.plazo),
          stat(flags.ley, 'citan ley', FLAG_TITLE.ley)
        ]));
      }
      if (p.note) kids.push(el('p', { class: 'p-note', text: p.note }));
      var site = (p.watch || [])[0];
      if (site) kids.push(el('a', { class: 'p-site', href: site, rel: 'noopener', text: 'Web oficial' }));
      ul.append(el('li', { class: 'tile', style: '--pc:' + p.color }, kids));
    });
  }

  Promise.all([getJson('config/parties.json'), getJson('config/topics.json'), getJson('data/quotes.json', true)]).then(function (res) {
    var parties = res[0].parties, election = res[0].election, topics = res[1].topics;
    var data = res[2] || { docs: [], quotes: [] };
    var docsById = {};
    data.docs.forEach(function (d) { docsById[d.id] = d; });
    var withDocs = parties.filter(function (p) { return (p.docs || []).length; });
    var nSubs = topics.reduce(function (a, t) { return a + t.subs.length; }, 0);
    hero(election, parties, topics, withDocs.length);
    $('cmp-hint').textContent = topics.length + ' temas por ' + parties.length + ' partidos · documentos incorporados: ' + withDocs.length + ' de ' + parties.length;
    if (withDocs.length) {
      var e = $('empty');
      e.textContent = 'Por ahora: ' + withDocs.map(function (p) {
        return p.docs.map(function (d) { return p.short + ', «' + d.title + '» (' + (KIND[d.kind] || d.kind) + ', ' + dmy(d.date) + ')'; }).join('; ');
      }).join('; ') + '. Los demás partidos aún no han publicado su programa. Pulsa un tema para ver las propuestas, copiadas tal cual.';
    }
    $('empty').hidden = false;
    $('n-topics').textContent = String(topics.length);
    $('n-subs').textContent = String(nSubs);
    matrix(parties, topics, data.quotes, docsById);
    partyList(parties, topics, data.quotes, docsById);
    var h = $('hero');
    if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }).catch(function () { $('error').hidden = false; });
})();
