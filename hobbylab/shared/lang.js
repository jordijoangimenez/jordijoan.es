/* Hobby Lab languages: every page in English and Spanish. English unless the visitor picked Spanish with the EN/ES
   button (remembered) or opened the page with ?lang=es. Load it in <head>, without defer, so <html lang> is right before
   the page's own scripts run. The static HTML is written in English; elements with data-i18n="key" get the Spanish
   text from the page's dictionary (HLLang.apply), and data-i18n-attr="aria-label:key;title:key2" does the same for
   attributes. Scripts read HLLang.lang and pick their strings with HLLang.t(dict, key). */
(function () {
  'use strict';
  var KEY = 'hl-lang', LANGS = ['en', 'es'];
  var asked = null, stored = null;
  try { asked = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var lang = LANGS.indexOf(asked) >= 0 ? asked : LANGS.indexOf(stored) >= 0 ? stored : 'en';
  if (LANGS.indexOf(asked) >= 0) { try { localStorage.setItem(KEY, asked); } catch (e) {} }
  document.documentElement.lang = lang;

  function t(dict, key) {
    var d = dict[lang] || {};
    return d[key] != null ? d[key] : (dict.en || {})[key];
  }
  // swap the static text of the page (written in English) for the current language
  function apply(dict) {
    var d = dict[lang];
    if (!d) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      var v = d[el.getAttribute('data-i18n')];
      if (v != null) el.innerHTML = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'), v = d[p[1]];
        if (v != null) el.setAttribute(p[0], v);
      });
    });
    if (d._title) document.title = d._title;
    var m = document.querySelector('meta[name="description"]');
    if (d._description && m) m.setAttribute('content', d._description);
  }

  // the EN/ES button, just before the theme button
  function addSwitch() {
    var nav = document.querySelector('.top nav');
    if (!nav || nav.querySelector('.lang-btn')) return;
    var other = lang === 'en' ? 'es' : 'en';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn lang-btn';
    b.lang = other;
    b.textContent = other.toUpperCase();
    b.title = other === 'es' ? 'Ver en español' : 'View in English';
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, other); } catch (e) {}
      if (asked) { var u = new URL(location.href); u.searchParams.set('lang', other); location.href = u.toString(); }
      else location.reload();
    });
    nav.insertBefore(b, nav.querySelector('#theme'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSwitch);
  else addSwitch();

  window.HLLang = { lang: lang, t: t, apply: apply };
})();
