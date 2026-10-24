/* Politicómetro: the topics-by-parties comparison table, the status of each party's documents and the countdown,
   in English or Spanish (../shared/lang.js). Reads config/parties.json, config/topics.json and data/quotes.json (built by
   scripts/build.mjs: the literal quotes, their topics and subtopics, and the concreteness marks). Quotes stay in Spanish. */
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
  L.apply({ es: {
    _description: 'Qué propone cada partido para las elecciones generales del 29 de noviembre de 2026, tema a tema y palabra por palabra, con citas literales de los programas oficiales.',
    skip: 'Saltar al comparador', nav_cmp: 'Comparador', nav_par: 'Partidos', nav_met: 'Método', theme: 'Cambiar tema', election: 'La elección',
    sub: 'Qué propone cada partido para el 29 de noviembre, tema a tema y palabra por palabra. Cada propuesta se copia literalmente del documento oficial, con enlace a su página, para ponerlas una al lado de la otra sin resúmenes ni interpretaciones.',
    cmp: 'Comparador', caption: 'Propuestas por tema y partido',
    empty: 'Todavía no se ha incorporado ningún documento. Cuando un partido publique su programa en su web oficial, sus propuestas aparecerán en esta tabla, copiadas tal cual y ordenadas por tema. Pulsa un tema para ver qué se comparará.',
    error: 'No se han podido cargar los datos. Vuelve a intentarlo en un momento.',
    k_pending: 'documento pendiente', k_none: 'nada sobre el tema', k_count: 'número de propuestas', k_tick: 'dice algo sobre el subtema',
    k_flags: '<b class="flag">cifra</b><b class="flag">plazo</b><b class="flag">ley</b>da una cantidad, fija un plazo o cita una ley',
    parties: 'Partidos', parties_hint: 'estado de cada documento', method: 'Cómo funciona',
    method_body: '<h3>Solo documentos oficiales</h3><p>Se usa el programa electoral que cada partido publica en su propia web. Si antes publica un documento de compromisos, también se incorpora, indicando qué es. No se usan resúmenes de prensa, argumentarios ni declaraciones.</p>' +
      '<h3>Palabra por palabra</h3><p>Cada propuesta se copia tal cual, con el número de página y un enlace al documento. Antes de publicarla, una comprobación automática verifica que el texto aparece exactamente así en el documento.</p>' +
      '<h3>Ordenado por temas</h3><p>Las propuestas se clasifican en <span class="n-topics">18</span> temas y <span class="n-subs">76</span> subtemas a partir de los títulos de sección del documento y de palabras clave. Una propuesta puede aparecer en más de un tema.</p>' +
      '<h3>Cobertura</h3><p>Cada subtema lleva una ✓ si el partido dice algo sobre él. Así se ve de qué habla cada uno y sobre qué calla.</p>' +
      '<h3>Concreción</h3><p>Cada propuesta se marca si da una cifra (una cantidad, un porcentaje o un importe), si fija un plazo o un calendario, o si cita una ley que crear o cambiar. Mide cuánto se compromete, no si la propuesta es buena.</p>' +
      '<h3>Sin valoraciones</h3><p>El Politicómetro no puntúa a los partidos, no resume y no opina: solo pone una al lado de la otra las propuestas de cada uno sobre lo mismo. Las cifras de cada partido cuentan propuestas, no las juzgan.</p>' +
      '<h3>Partidos</h3><p>Doce partidos de ámbito estatal y autonómico con presencia en el Congreso o en las encuestas. Frente Amplio es la coalición de IU, Movimiento Sumar, Comuns, Más Madrid y otros.</p>' +
      '<h3>Derechos</h3><p>Los documentos pertenecen a sus partidos. Aquí se citan fragmentos para su análisis y comparación, indicando siempre la fuente y la página, como permite el derecho de cita (artículo 32 de la Ley de Propiedad Intelectual).</p>',
    foot1: 'Fuentes: los documentos oficiales de cada partido, enlazados en cuanto se incorporan. Este sitio es independiente y no está vinculado a ningún partido.',
    foot2: 'Un proyecto de', foot3: 'en'
  } });

  var S = ES ? {
    election: 'Elecciones generales', parties: 'partidos', topics: 'temas', docsOf: function (a, n) { return 'Documentos: ' + a + ' de ' + n; },
    count: { one: 'día para votar', many: 'días para votar', done: 'Día de votación' },
    kind: { programa: 'programa electoral', compromisos: 'documento de compromisos' },
    flag: { cifra: 'cifra', plazo: 'plazo', ley: 'ley' },
    flagWith: { cifra: 'con cifra', plazo: 'con plazo', ley: 'citan ley' },
    flagTitle: { cifra: 'Da una cantidad, un porcentaje o un importe', plazo: 'Fija un plazo o un calendario', ley: 'Cita una ley o una norma' },
    page: 'p. ', see: 'ver en el documento', topic: 'Tema', other: 'Otras propuestas', noTopic: 'sin tema',
    sub: ['subtema', 'subtemas'], prop: ['propuesta', 'propuestas'], nothing: 'nada sobre este tema', pending: 'documento pendiente', subNothing: 'nada',
    none: 'Todavía ningún partido ha hecho propuestas sobre este tema en los documentos incorporados.',
    progPending: 'Programa pendiente', openDoc: 'Abrir el documento oficial (PDF)',
    notFull: function (k) { return 'Es un ' + k + ', no el programa completo.'; },
    stats: ['propuestas', 'temas', 'subtemas'], statsTitle: ['Temas con al menos una propuesta', 'Subtemas con al menos una propuesta'],
    figures: 'Cifras de ', site: 'Web oficial',
    hint: function (t, p, a) { return t + ' temas por ' + p + ' partidos · documentos incorporados: ' + a + ' de ' + p; },
    soFar: 'Por ahora: ', rest: 'Los demás partidos aún no han publicado su programa. Pulsa un tema para ver las propuestas, copiadas tal cual.'
  } : {
    election: 'General election', parties: 'parties', topics: 'topics', docsOf: function (a, n) { return 'Documents: ' + a + ' of ' + n; },
    count: { one: 'day to vote', many: 'days to vote', done: 'Election day' },
    kind: { programa: 'electoral programme', compromisos: 'document of commitments' },
    flag: { cifra: 'figure', plazo: 'deadline', ley: 'law' },
    flagWith: { cifra: 'with a figure', plazo: 'with a deadline', ley: 'name a law' },
    flagTitle: { cifra: 'Gives a quantity, a percentage or an amount', plazo: 'Sets a deadline or a calendar', ley: 'Names a law or a regulation' },
    page: 'p. ', see: 'see in the document', topic: 'Topic', other: 'Other proposals', noTopic: 'no topic',
    sub: ['subtopic', 'subtopics'], prop: ['proposal', 'proposals'], nothing: 'nothing on this topic', pending: 'document pending', subNothing: 'nothing',
    none: 'No party has made proposals on this topic yet in the documents added.',
    progPending: 'Programme pending', openDoc: 'Open the official document (PDF)',
    notFull: function (k) { return 'This is a ' + k + ', not the full programme.'; },
    stats: ['proposals', 'topics', 'subtopics'], statsTitle: ['Topics with at least one proposal', 'Subtopics with at least one proposal'],
    figures: 'Figures for ', site: 'Official website',
    hint: function (t, p, a) { return t + ' topics by ' + p + ' parties · documents added: ' + a + ' of ' + p; },
    soFar: 'So far: ', rest: 'The other parties have not published their programme yet. Open a topic to see the proposals, copied as they are, in Spanish.'
  };
  var FLAGS = ['cifra', 'plazo', 'ley'];

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
  function plural(n, words) { return n + ' ' + (n === 1 ? words[0] : words[1]); }
  function name(x) { return ES ? x.name : (x.en || x.name); }

  function hero(election, parties, topics, withDocs) {
    var pills = $('pills');
    pills.textContent = '';
    [ES ? election.name : S.election, dmy(election.date), parties.length + ' ' + S.parties, topics.length + ' ' + S.topics, S.docsOf(withDocs, parties.length)]
      .forEach(function (t) { pills.append(el('li', { text: t })); });
    if (window.HLMotion) window.HLMotion.countdown($('countdown'), election.closes, S.count);
  }

  function quoteCard(q, doc) {
    var meta = el('p', { class: 'q-meta' }, [S.page + q.page + ' · ', el('a', { href: doc.url + '#page=' + q.page, rel: 'noopener', text: S.see })]);
    q.flags.forEach(function (f) { meta.append(' ', el('span', { class: 'flag', title: S.flagTitle[f], text: S.flag[f] })); });
    return el('li', {}, [el('blockquote', { class: 'q', lang: 'es' }, [el('p', { text: '«' + q.text + '»' })]), meta]);
  }

  // one row per topic, one column per party; a topic opens to show a tick per subtopic and party, then the quotes
  function matrix(parties, topics, quotes, docsById) {
    var t = $('matrix');
    var head = el('tr', {}, [el('th', { scope: 'col', class: 't-col', text: S.topic })]);
    parties.forEach(function (p) {
      head.append(el('th', { scope: 'col', title: p.name }, [el('i', { class: 'dot', style: 'background:' + p.color }), el('span', { text: p.short })]));
    });
    var body = el('tbody');
    var rows = topics.concat([{ id: '_otros', name: S.other, subs: [], other: true }]);
    rows.forEach(function (tp, r) {
      var inTopic = quotes.filter(function (q) { return tp.other ? !q.topics.length : q.topics.indexOf(tp.id) >= 0; });
      if (tp.other && !inTopic.length) return;
      var detailId = 'det-' + tp.id;
      var btn = el('button', { type: 'button', class: 't-btn', 'aria-expanded': 'false', 'aria-controls': detailId },
        [el('span', { text: name(tp) }), el('small', { text: tp.other ? S.noTopic : plural(tp.subs.length, S.sub) })]);
      var row = el('tr', { class: 't-row' }, [el('th', { scope: 'row' }, [btn])]);
      parties.forEach(function (p, c) {
        var mine = inTopic.filter(function (q) { return q.party === p.id; });
        var hasDoc = (p.docs || []).length > 0;
        var flags = {};
        mine.forEach(function (q) { q.flags.forEach(function (f) { flags[f] = (flags[f] || 0) + 1; }); });
        var title = p.short + ' · ' + name(tp) + ': ' + (mine.length
          ? plural(mine.length, S.prop) + FLAGS.filter(function (f) { return flags[f]; }).map(function (f) { return ', ' + flags[f] + ' ' + S.flagWith[f]; }).join('')
          : hasDoc ? S.nothing : S.pending);
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
        var tr = el('tr', { class: 'sub-tick', hidden: '' }, [el('th', { scope: 'row', text: name(s) })]);
        parties.forEach(function (p) {
          var n = inTopic.filter(function (q) { return q.party === p.id && q.subs.indexOf(s.id) >= 0; }).length;
          tr.append(el('td', {}, [n
            ? el('span', { class: 'tick', style: '--pc:' + p.color, title: p.short + ' · ' + name(s) + ': ' + plural(n, S.prop), text: '✓' })
            : el('span', { class: 'tick none', title: p.short + ' · ' + name(s) + ': ' + S.subNothing, text: '·' })]));
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
          el('h3', {}, [el('b', { text: p.short }), ' ', el('span', {}, [el('span', { lang: 'es', text: '«' + doc.title + '»' }), ' · ' + (S.kind[doc.kind] || doc.kind) + ' · ' + dmy(doc.date)])]),
          list
        ]));
      });
      if (!any) cell.append(el('p', { class: 'q-none', text: S.none }));
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

  function partyList(parties, topics, quotes) {
    var ul = $('parties');
    var nSubs = topics.reduce(function (a, t) { return a + t.subs.length; }, 0);
    parties.forEach(function (p) {
      var docs = p.docs || [];
      var mine = quotes.filter(function (q) { return q.party === p.id; });
      var kids = [el('p', { class: 'p-head' }, [el('b', { text: p.short }), el('span', { lang: 'es', text: p.name })])];
      if (!docs.length) kids.push(el('span', { class: 'status pending', text: S.progPending }));
      docs.forEach(function (d) {
        kids.push(el('a', { class: 'status done', href: d.url, rel: 'noopener', title: S.openDoc }, [el('span', { lang: 'es', text: '«' + d.title + '»' }), ' · ' + dmy(d.date)]));
        if (d.kind !== 'programa') kids.push(el('p', { class: 'p-note', text: S.notFull(S.kind[d.kind] || d.kind) }));
      });
      if (mine.length) {
        var topicsHit = {}, subsHit = {}, flags = { cifra: 0, plazo: 0, ley: 0 };
        mine.forEach(function (q) {
          q.topics.forEach(function (t) { topicsHit[t] = 1; });
          q.subs.forEach(function (s) { subsHit[s] = 1; });
          q.flags.forEach(function (f) { flags[f]++; });
        });
        var stat = function (v, label, title) { return el('li', title ? { title: title } : {}, [el('b', { class: 'v', text: String(v) }), el('span', { text: label })]); };
        kids.push(el('ul', { class: 'p-stats', 'aria-label': S.figures + p.short }, [
          stat(mine.length, S.stats[0]),
          stat(Object.keys(topicsHit).length + '/' + topics.length, S.stats[1], S.statsTitle[0]),
          stat(Object.keys(subsHit).length + '/' + nSubs, S.stats[2], S.statsTitle[1]),
          stat(flags.cifra, S.flagWith.cifra, S.flagTitle.cifra),
          stat(flags.plazo, S.flagWith.plazo, S.flagTitle.plazo),
          stat(flags.ley, S.flagWith.ley, S.flagTitle.ley)
        ]));
      }
      var note = ES ? p.note : (p.note_en || p.note);
      if (note) kids.push(el('p', { class: 'p-note', text: note }));
      var site = (p.watch || [])[0];
      if (site) kids.push(el('a', { class: 'p-site', href: site, rel: 'noopener', text: S.site }));
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
    $('cmp-hint').textContent = S.hint(topics.length, parties.length, withDocs.length);
    if (withDocs.length) {
      var e = $('empty');
      e.textContent = '';
      e.append(S.soFar);
      withDocs.forEach(function (p, i) {
        p.docs.forEach(function (d, j) {
          if (i || j) e.append('; ');
          e.append(p.short + ', ', el('span', { lang: 'es', text: '«' + d.title + '»' }), ' (' + (S.kind[d.kind] || d.kind) + ', ' + dmy(d.date) + ')');
        });
      });
      e.append('. ' + S.rest);
    }
    $('empty').hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll('.n-topics'), function (x) { x.textContent = String(topics.length); });
    Array.prototype.forEach.call(document.querySelectorAll('.n-subs'), function (x) { x.textContent = String(nSubs); });
    matrix(parties, topics, data.quotes, docsById);
    partyList(parties, topics, data.quotes);
    var h = $('hero');
    if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }).catch(function () { $('error').hidden = false; });
})();
