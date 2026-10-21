// Pulls poll figures out of one Electográfica post. The blog has used several templates:
//   T4 (2026-)      tabbed card: bar-fill-anim bars, seat badges, "Ficha técnica" grid
//   T3 (2023-2026)  "partido" blocks with dato_encuesta, tabla_escanos seat table, <b>Label:</b> ficha
//   T2 (2015-2023)  only a text summary ("PP 31,5% (132/137) · PSOE ...") in div.extra or the title
//   T1 (2013-2015)  figures only inside images: nothing to extract
import { decode, stripTags, num, intLoose, seats, fieldwork, titleDate, dmy, partyKey } from './text.mjs';

const SKIP_PARTY = /^(PARTICIPACION|OTROS|BLANCO|NULO|ABSTENCION|INDECISOS|NS NC|NO SABE|EN BLANCO|VOTO EN BLANCO|RESTO)\b/;

function party(name, extra = {}) {
  // "VB · Derecha/extrema derecha" -> "VB"
  const n = decode(name).replace(/\s+/g, ' ').split(' · ')[0].trim();
  return { n, k: partyKey(n), ...extra };
}

// A second block of the same parties means another region or scenario follows: keep the first
function firstRun(parties) {
  const seen = new Set();
  const out = [];
  for (const p of parties) {
    if (seen.has(p.k)) break;
    seen.add(p.k);
    out.push(p);
  }
  return out;
}

// ---------- T4 ----------
function panel(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return '';
  const rest = html.slice(start + id.length);
  const next = rest.search(/id="[ps]\d+t-[a-z]+"|<!-- FICHA|Ficha t(?:&#233;|é)cnica/);
  return next < 0 ? rest : rest.slice(0, next);
}

function t4(html) {
  const tabs = [...html.matchAll(/class="tab-btn[^"]*"[^>]*data-target="([^"]+)"[^>]*>([^<]*)</g)]
    .map(m => ({ id: m[1], label: decode(m[2]).trim() }));
  const firstGroup = tabs.length ? tabs[0].id.replace(/-[a-z]+$/, '') : 'p1t';
  const group = tabs.filter(t => t.id.startsWith(firstGroup + '-'));
  const voteTab = group.find(t => !/esca|evoluci|mapa|resultado/i.test(t.label)) || { id: `${firstGroup}-a` };
  const seatTab = group.find(t => /esca/i.test(t.label));
  // untabbed cards hold votes and seats in one block
  const body = html.split(/<!-- FICHA|Ficha t(?:&#233;|é)cnica/)[0];
  const vp = tabs.length ? panel(html, voteTab.id) || body : body;

  const parties = [];
  const names = [...vp.matchAll(/<div style="font-size:13px;font-weight:500;[^"]*">([^<]+)<\/div>(?:<div style="font-size:11px;[^"]*">([^<]*)<\/div>)?/g)];
  names.forEach((m, i) => {
    const seg = vp.slice(m.index, i + 1 < names.length ? names[i + 1].index : vp.length);
    const fill = seg.match(/bar-fill-anim" data-w="([\d.]+)"[^>]*background:\s*(#[0-9A-Fa-f]{3,8})[^>]*><\/div><\/div>\s*<span[^>]*>([^<]*)<\/span>/);
    if (!fill) return;
    const ref = seg.match(/bar-ref-anim" data-w="([\d.]+)"[^>]*><\/div><\/div>\s*<span[^>]*>([^<]*)<\/span>/);
    const p = party(m[1], { f: m[2] ? decode(m[2]).trim() : undefined, c: fill[2].toUpperCase(), v: num(fill[3]) ?? num(fill[1]) });
    if (ref && /^\s*\d/.test(decode(ref[2]))) p.rv = num(ref[2]);
    if (!SKIP_PARTY.test(p.k) && !/\s\+\s/.test(p.n)) parties.push(p);
  });
  parties.splice(0, parties.length, ...firstRun(parties));

  let total = null, majority = null;
  const sp = seatTab ? panel(html, seatTab.id) || body : vp;
  const tot = stripTags(sp.match(/Total:[^<]*/)?.[0] || '');
  if (tot) {
    const t = tot.match(/Total:\s*(\d+)(?:\s*→\s*(\d+))?/);
    const mj = tot.match(/Mayor[ií]a:\s*(\d+)(?:\s*→\s*(\d+))?/);
    if (t) total = +(t[2] || t[1]);
    if (mj) majority = +(mj[2] || mj[1]);
  }
  // seat badges run left to right across the chamber; their order is kept as o (0..1) for the hemicycle
  const badges = sp.split('class="badge-anim"').slice(1);
  badges.forEach((b, bi) => {
    const o = badges.length > 1 ? bi / (badges.length - 1) : 0.5;
    const alt = b.match(/alt="([^"]*)"/)?.[1];
    const title = b.match(/title="([^"]*)"/)?.[1];
    const val = b.match(/class="seats-num"[^>]*>([^<]*)</)?.[1];
    const color = b.match(/height:4px;background:\s*(#[0-9A-Fa-f]{3,8})/)?.[1];
    const ref = b.match(/class="seats-ref"[^>]*>([^<]*)</)?.[1];
    if (!alt && !title) return;
    const s = seats(val);
    const key = partyKey(alt || title);
    // badges are hand-edited and their titles are sometimes copied from a neighbour: trust alt first,
    // and never let a badge overwrite seats already given to a party
    const free = parties.filter(x => x.s === undefined);
    let p = free.find(x => x.k === key) || free.find(x => x.f && partyKey(x.f) === key)
      || free.find(x => title && x.f && partyKey(x.f) === partyKey(title))
      || free.find(x => color && x.c === color.toUpperCase());
    if (!p && parties.some(x => x.k === key)) return;
    if (!p) {
      p = party(alt || title, { f: title ? decode(title) : undefined, c: color ? color.toUpperCase() : undefined });
      if (SKIP_PARTY.test(p.k)) return;
      parties.push(p);
    }
    if (s) p.s = s;
    p.o = o;
    if (ref && /^\s*\d+\s*$/.test(decode(ref))) p.rs = +decode(ref).trim();
  });

  const ficha = {};
  for (const m of html.matchAll(/<span class="field-label">([^<]+)<\/span>\s*<span class="field-value"[^>]*>(.*?)<\/span>/gs)) {
    ficha[decode(m[1]).trim()] = stripTags(m[2]);
  }
  const head = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  return {
    parties, total, majority,
    pollster: ficha['Encuestadora'], client: ficha['Cliente'], method: ficha['Método'],
    sample: intLoose(ficha['Muestra']), field: ficha['Fecha realización'],
    lastElection: dmy(ficha['Última elección']),
    total2: intLoose(ficha['Escaños']), majority2: intLoose(ficha['Mayoría absoluta']),
    areaName: head ? stripTags(head[1]) : undefined,
  };
}

// ---------- T3 ----------
function sections(html) {
  const out = [];
  const re = /<div class="titulo_[a-z]+">([^<]*)<\/div>/g;
  const ms = [...html.matchAll(re)];
  ms.forEach((m, i) => out.push({ title: decode(m[1]).trim(), html: html.slice(m.index + m[0].length, i + 1 < ms.length ? ms[i + 1].index : html.length) }));
  return out;
}

function rowCells(tr) {
  const cells = [];
  for (const m of tr.matchAll(/<td([^>]*)>(.*?)<\/td>/gs)) {
    const span = +(m[1].match(/colspan="?(\d+)/)?.[1] || 1);
    cells.push({ attrs: m[1], html: m[2], span });
  }
  return cells;
}

function t3(html) {
  const secs = sections(html);
  const voteSec = secs.find(s => /^(ESTIMACIÓN DE VOTO|VOTO \(|VOTO - PROPORCIONAL|VOTO CÁMARA|PRIMERA VUELTA|VOTO POPULAR)/i.test(s.title))
    || secs.find(s => /INTENCIÓN DIRECTA|VOTO/i.test(s.title));
  const parties = [];
  if (voteSec) {
    for (const blk of voteSec.html.split('<div class="partido"').slice(1)) {
      const color = blk.match(/^[^>]*color:\s*(#[0-9A-Fa-f]{3,8})/)?.[1] || blk.match(/overlay_sigla" style="background-color:\s*(#[0-9A-Fa-f]{3,8})/)?.[1];
      let full = blk.match(/<img class="logo_partido"[^>]*title="([^"]*)"/)?.[1];
      let name;
      const sigla = blk.match(/class="sigla"[^>]*>\s*<b>(.*?)<\/b>/s);
      if (sigla) {
        // "<b>Sverigedemokraterna (SD)</b> · Demócratas Suecos": the code in brackets is the short name
        const b = stripTags(sigla[1]);
        const code = b.match(/^(.*?)\s*\(([^()]+)\)$/);
        name = code ? code[2] : b;
        if (code) full = code[1];
      } else {
        const inner = blk.slice(blk.indexOf('>') + 1);
        name = stripTags(inner.split(/<div class="grupo_pe"|<\/div>/)[0].replace(/<img[^>]*>/g, ''));
      }
      if (/\s\+\s/.test(name)) continue; // bloc totals such as "S + V + C + MP"
      const v = blk.match(/<span class="dato_encuesta">([^<]*)<\/span>/)?.[1];
      if (!name || v == null) continue;
      const p = party(name, { f: full ? decode(full).trim() : undefined, c: color ? color.toUpperCase() : undefined, v: num(v) });
      const ref = blk.match(/<div class="res_elec">(.*?)<\/div>/s)?.[1];
      if (ref != null) {
        const r = stripTags(ref);
        if (/^\d/.test(r)) p.rv = num(r);
      }
      if (!SKIP_PARTY.test(p.k) && p.v != null) parties.push(p);
    }
    parties.splice(0, parties.length, ...firstRun(parties));
  }

  let total = null;
  const seatSecs = secs.filter(s => /^(ESCAÑOS|DIPUTADOS ELECTOS)/i.test(s.title) && !/GRUPOS/i.test(s.title));
  const seatSec = seatSecs[0];
  if (seatSec) {
    const nums = (seatSec.title.match(/\(([^)]*)\)/)?.[1] || '').match(/\d+/g);
    if (nums) total = +nums[nums.length - 1];
    for (const table of seatSec.html.split('<table').slice(1)) {
      const rows = [...table.matchAll(/<tr([^>]*)>(.*?)<\/tr>/gs)].map(m => ({ attrs: m[1], cells: rowCells(m[2]) }));
      if (!rows.length) continue;
      const header = rows.find(r => r.cells.some(c => /logo_partido|title=/.test(c.html))) || rows[0];
      const colorRow = rows.find(r => r.cells.some(c => /background-color/.test(c.attrs)));
      const est = rows.find(r => /escanos_encuesta/.test(r.attrs));
      const elec = rows.find(r => /escanos_elecciones/.test(r.attrs));
      if (!est) continue;
      const cols = [];
      header.cells.forEach(c => {
        const title = c.html.match(/title="([^"]*)"/)?.[1] || stripTags(c.html);
        for (let i = 0; i < c.span; i++) cols.push({ title: decode(title).trim() });
      });
      if (colorRow) {
        let i = 0;
        for (const c of colorRow.cells) {
          const color = c.attrs.match(/background-color:\s*(#[0-9A-Fa-f]{3,8})/)?.[1];
          const id = c.attrs.match(/id="([^"]*)"/)?.[1];
          for (let j = 0; j < c.span; j++, i++) if (cols[i]) Object.assign(cols[i], { color: color?.toUpperCase(), id });
        }
      }
      const spread = (row, field) => {
        let i = 0;
        for (const c of row.cells) {
          if (c.span === 1 && cols[i]) cols[i][field] = stripTags(c.html);
          i += c.span;
        }
      };
      spread(est, 'est');
      if (elec) spread(elec, 'ref');
      cols.forEach((col, ci) => { col.o = cols.length > 1 ? ci / (cols.length - 1) : 0.5; });
      for (const col of cols) {
        const s = seats(col.est);
        if (!s && !/^\s*0\s*$/.test(col.est || '')) continue;
        const ft = partyKey(col.title);
        const free = parties.filter(x => x.s === undefined);
        let p = free.find(x => x.f && partyKey(x.f) === ft) || free.find(x => x.k === ft)
          || free.find(x => col.color && x.c === col.color)
          || free.find(x => col.id && partyKey(col.id) === x.k);
        if (!p && parties.some(x => (x.f && partyKey(x.f) === ft) || x.k === ft)) continue;
        if (!p) {
          p = party(col.title || col.id || '?', { c: col.color });
          if (SKIP_PARTY.test(p.k)) continue;
          parties.push(p);
        }
        p.s = s || [0, 0];
        p.o = col.o;
        if (col.ref && /^\d+$/.test(col.ref.trim())) p.rs = +col.ref.trim();
      }
    }
  }

  const ficha = {};
  for (const m of html.matchAll(/<b>([^<:]{2,40}):\s*<\/b>(.*?)(?=\s·\s|<\/small>|<br|<\/div>|<b>)/gs)) {
    const k = decode(m[1]).trim();
    if (!(k in ficha)) ficha[k] = stripTags(m[2]).replace(/\s*·\s*$/, '');
  }
  const by = html.match(/realizada por\s+(?:el\s+|la\s+)?(.*?)(?:\s+para\s+(.*?))?\.?\s*<\/p>/s);
  return {
    parties, total,
    pollster: by ? stripTags(by[1]) : undefined, client: by && by[2] ? stripTags(by[2]) : undefined,
    method: ficha['Método'], sample: intLoose(ficha['Muestra']),
    field: ficha['Periodo de campo'] || ficha['Fecha de realización'] || ficha['Trabajo de campo'],
    lastElection: dmy(ficha['Última elección']),
    total2: intLoose(ficha['Escaños']), majority2: intLoose(ficha['Mayoría']),
  };
}

// ---------- T2 / fallback: a text list ----------
export function parseList(raw, total = null) {
  let s = decode(raw).replace(/[\u{1F7E0}-\u{1F7EB}\u{2B1B}\u{2B1C}\u{25A0}-\u{25FF}\u{1F532}-\u{1F535}]/gu, ' ');
  const colon = s.indexOf(': ');
  if (colon >= 0 && !/\d\s*%/.test(s.slice(0, colon))) s = s.slice(colon + 2);
  // several scenarios in one line ("... // Gen.: ...", "1V/ ... 2Va/ ..."): keep the first one
  s = s.replace(/^\s*(?:1V\/|1R:|Autonómicas\s*-)\s*/i, '');
  s = s.split(/\s\/\/\s|\s(?:Gen\.|Generales\s*-|2R:|2V\w?\/|2nd round:)|\s\/\s/)[0];
  s = s.replace(/(\d),(\d)/g, '$1.$2');
  const toks = s.split(/\s*[|·;\n]\s*|,\s+/).map(t => t.trim()).filter(Boolean);
  const parties = [];
  let pctCount = 0;
  for (const t of toks) {
    let m = t.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*%\s*(?:\((\d+)(?:\s*[/–-]\s*(\d+))?\))?\.?$/);
    if (m) {
      pctCount++;
      const p = party(m[1], { v: +m[2] });
      if (m[3] != null) p.s = [+m[3], +(m[4] ?? m[3])];
      if (!SKIP_PARTY.test(p.k)) parties.push(p);
      continue;
    }
    m = t.match(/^(.+?)\s+(\d+(?:\.\d+)?)(?:\s*[/–-]\s*(\d+))?\.?$/);
    if (m && !/\d$/.test(m[1])) {
      const p = party(m[1], { raw: [+m[2], +(m[3] ?? m[2])] });
      if (!SKIP_PARTY.test(p.k)) parties.push(p);
    }
  }
  const bare = parties.filter(p => p.raw);
  let asVotes;
  if (pctCount === 0) {
    // no "%" anywhere: seat ranges or a sum far from 100 mean seats; otherwise percentages
    // (the build step re-checks whole-number lists against the chamber size)
    const sum = bare.reduce((a, p) => a + p.raw[0], 0);
    const ranges = bare.some(p => p.raw[1] !== p.raw[0]);
    asVotes = !ranges && sum > 90 && sum < 110 && sum !== total;
  } else {
    // old style "CUP 9, JxS 37.6, ..., PP 8.7%": one "%" closing the list marks every number as a vote share
    asVotes = pctCount === 1 && parties[parties.length - 1].v != null && bare.length > 0;
  }
  const out = [];
  for (const p of parties) {
    if (p.raw) {
      if (asVotes) out.push({ n: p.n, k: p.k, v: p.raw[0], ...(pctCount === 0 && Number.isInteger(p.raw[0]) ? { amb: 1 } : {}) });
      else if (pctCount === 0) out.push({ n: p.n, k: p.k, s: p.raw });
    } else out.push(p);
  }
  return firstRun(out);
}

function t2(html, title) {
  const extra = html.match(/<div class="extra">(.*?)(?:<img|<\/div>)/s);
  let parties = extra ? parseList(stripTags(extra[1].replace(/<br\s*\/?>/g, '\n'))) : [];
  const fromTitle = parseList(title);
  if (fromTitle.length > parties.length) parties = fromTitle;
  const ficha = {};
  for (const m of html.matchAll(/<b>([^<:]{2,40}):\s*(?:&nbsp;)?<\/b>(.*?)(?=\s·\s|<br|<\/small>|<\/div>|<b>)/gs)) {
    const k = decode(m[1]).trim();
    if (!(k in ficha)) ficha[k] = stripTags(m[2]);
  }
  const by = html.match(/realizada por\s+(?:el\s+|la\s+)?(.*?)(?:\s+para\s+(.*?))?\.?\s*<\/p>/s);
  return {
    parties,
    pollster: by ? stripTags(by[1]) : (ficha['Pollster'] || undefined),
    client: by && by[2] ? stripTags(by[2]) : (ficha['Client'] || undefined),
    sample: intLoose(ficha['Muestra'] || ficha['Sample size']),
    field: ficha['Periodo de campo'] || ficha['Fecha de realización'] || ficha['Trabajo de campo'],
    method: ficha['Método'] || ficha['Method'],
    partial: true,
  };
}

export function template(html) {
  if (html.includes('bar-fill-anim')) return 'T4';
  if (html.includes('dato_encuesta')) return 'T3';
  if (html.includes('class="extra"')) return 'T2';
  return 'T1';
}

// "Encuesta Sigma Dos 19/10/2026", "Encuesta GAPS (interna Junts) 17/10/2026", "Novus poll | January 2018"
export function pollsterFromTitle(t) {
  let m = t.match(/(?:Encuesta|Sondeo)\s+(?:de\s+)?(.+?)(?:\s+para\s+|\s+\d{1,2}\/\d{1,2}\/\d{4}|\s*[:·▪|]|\s+\(|\s+\[|$)/);
  if (m) return m[1].trim();
  m = t.match(/(?:^|[,·▪|]\s*|\.\s+)([^,·▪|.]+?)\s+poll\b/);
  if (m) return m[1].replace(/^[A-Z ]{3,}\s+/, '').trim();
  return null;
}

export function extract(post) {
  const html = post.content || '';
  const tpl = template(html);
  let r = tpl === 'T4' ? t4(html) : tpl === 'T3' ? t3(html) : tpl === 'T2' ? t2(html, post.title) : { parties: parseList(post.title), partial: true };
  // structured templates sometimes fail on odd posts: fall back to the text summary
  if ((tpl === 'T4' || tpl === 'T3') && r.parties.length < 2) {
    const alt = t2(html, post.title);
    if (alt.parties.length >= 2) r = { ...r, parties: alt.parties, partial: true };
  }
  // header cells that are really seat numbers ("3", "3/4", "14 15") are not parties
  r = { ...r, parties: r.parties.filter(p => !/^[\d\s/.,–-]+$/.test(p.n)) };
  const fw = fieldwork(r.field);
  const tdate = titleDate(post.title);
  const date = fw.end || tdate || post.published.slice(0, 10);
  const total = r.total || r.total2 || null;
  return {
    tpl,
    parties: r.parties,
    partial: !!r.partial,
    total,
    majority: r.majority || r.majority2 || (total ? Math.floor(total / 2) + 1 : null),
    pollster: (r.pollster && r.pollster.length < 60 ? r.pollster : null) || pollsterFromTitle(post.title),
    client: r.client && r.client !== 'n/a' && r.client.length < 80 ? r.client : null,
    method: r.method && r.method !== '?' ? r.method : null,
    sample: r.sample && r.sample > 50 && r.sample < 1e6 ? r.sample : null,
    start: fw.start, date, dateSource: fw.end ? 'fieldwork' : tdate ? 'title' : 'published',
    lastElection: r.lastElection || null,
    areaName: r.areaName,
  };
}
