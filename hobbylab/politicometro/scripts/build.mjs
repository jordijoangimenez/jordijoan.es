// Turns the extracted documents (.cache/<id>.json, from fetch-docs.mjs) into data/quotes.json:
//   - cuts each document into sentences and keeps the ones that read as proposals (numbered commitments, verbs in the
//     future, "proponemos"...), without changing a single character of them;
//   - sorts each one into topics and subtopics with the keywords of config/topics.json (a sentence with no keyword of
//     its own takes the topic of the numbered commitment or section heading it belongs to);
//   - marks whether it gives a figure, a deadline or calendar, or names a law (how concrete it is, not whether it is good);
//   - checks that every quote appears exactly in the document text, and refuses to write if one does not.
//   node scripts/build.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { parties } = JSON.parse(await readFile(join(ROOT, 'config', 'parties.json'), 'utf8'));
const { topics } = JSON.parse(await readFile(join(ROOT, 'config', 'topics.json'), 'utf8'));

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// keywords: "=word" must be a whole word, anything else may appear inside a longer text. A subtopic's keywords give
// the subtopic and its topic; a topic's own keywords (general words such as "vivienda") give only the topic.
const rx = k => k.startsWith('=') ? new RegExp('\\b' + esc(norm(k.slice(1))) + '\\b') : new RegExp(esc(norm(k)));
const SUBS = [], TOPIC_KW = [];
for (const t of topics) {
  if (t.kw) TOPIC_KW.push({ topic: t.id, res: t.kw.map(rx) });
  for (const s of t.subs) SUBS.push({ topic: t.id, sub: s.id, res: s.kw.map(rx) });
}
function classify(text) {
  const n = norm(text), subs = SUBS.filter(s => s.res.some(r => r.test(n)));
  const ts = subs.map(s => s.topic).concat(TOPIC_KW.filter(t => t.res.some(r => r.test(n))).map(t => t.topic));
  return { topics: [...new Set(ts)], subs: subs.map(s => s.sub) };
}

// how concrete a proposal is
const FLAGS = {
  cifra: /\d|\b(cien|ciento|mil|millon|millones|doble|mitad|por ciento)\b|%|€/,
  plazo: /\b(en|antes de|durante|dentro de|a lo largo de)\s+(los?\s+|las?\s+)?(primer[oa]?s?|proxim[oa]s?|\d+)\s+(horas?|dias?|semanas?|mes|meses|anos?|legislatura)\b|\bcada ano\b|\banual(es|mente)?\b|\b20[2-4]\d\b|\bprimeros? cien dias\b/,
  ley: /\bley(es)?\b|\breal decreto\b|\bcodigo penal\b|\bconstitucion\b|\breglamento\b/
};

// proposals: a numbered commitment, a verb in the future ("reforzaremos", "se reducirá", "tendrán"), an explicit proposal,
// or an item that starts with an infinitive ("Garantizar las pensiones..."); inside a numbered commitment, also its
// obligations ("exige actualizar...", "el objetivo es construir...")
const FUTURE = /[a-záéíóúñ]+(?:rá|rán|remos)(?![a-záéíóúñ])/i;
const PROPOSE = /\b(proponemos|propondremos|nos comprometemos a|impulsaremos|aprobaremos|crearemos)\b/i;
const INFINITIVE = /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:ar|er|ir)(?:se)?\b/;
const OBLIGATION = /\b(debe|deben|exige|exigen|tiene que|tienen que|objetivo)\b/i;
const isHeading = l => l.length <= 90 && /[A-ZÁÉÍÓÚÑ]{2}/.test(l) && !/[a-záéíóúñ]/.test(l);

function sentences(pages) {
  // one running text, remembering where each page and each heading starts
  let text = '';
  const pageAt = [], heads = [];
  pages.forEach((p, i) => {
    pageAt.push(text.length);
    for (const raw of p.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (isHeading(line)) heads.push({ at: text.length, text: line });
      if (text) {
        if (/[a-záéíóúñ]-$/.test(text) && /^[a-záéíóúñ]/.test(line)) text = text.slice(0, -1); // word split by a hyphen at the line end
        else text += ' ';
      }
      text += line;
    }
  });
  const pageOf = at => { let pg = 1; pageAt.forEach((a, i) => { if (at >= a) pg = i + 1; }); return pg; };
  const headOf = at => { let h = null; for (const x of heads) if (x.at <= at) h = x.text; return h; };

  const out = [];
  const cut = /(?<=[.!?…:])\s+(?=(?:\d{1,2}\.\s+)?[«"“(¿¡]?[A-ZÁÉÍÓÚÑ])/g;
  let from = 0, m, pendingItem = null;
  const ends = [];
  while ((m = cut.exec(text))) ends.push(m.index);
  ends.push(text.length);
  for (const end of ends) {
    let s = text.slice(from, end), at = from;
    from = end;
    const lead = s.match(/^\s+/); if (lead) { s = s.slice(lead[0].length); at += lead[0].length; }
    // "4." on its own: the splitter cut a numbered item from its text, which follows
    if (/^\d{1,2}\.$/.test(s.trim())) { pendingItem = parseInt(s, 10); continue; }
    let item = pendingItem;
    pendingItem = null;
    const num = s.match(/^(\d{1,2})\.\s+/);
    if (num) { item = +num[1]; s = s.slice(num[0].length); at += num[0].length; }
    s = s.trim();
    if (s) out.push({ text: s, at, page: pageOf(at), head: headOf(at), item });
  }
  return { text, list: out };
}

const docs = [], quotes = [], problems = [];
for (const p of parties) for (const d of p.docs || []) {
  const src = join(ROOT, '.cache', d.id + '.json');
  if (!existsSync(src)) { problems.push(`${d.id}: not extracted yet (run scripts/fetch-docs.mjs)`); continue; }
  const { pages } = JSON.parse(await readFile(src, 'utf8'));
  const { text, list } = sentences(pages);
  const flat = norm(text).replace(/\s+/g, ' ');
  docs.push({ party: p.id, id: d.id, kind: d.kind, title: d.title, url: d.url, date: d.date, pages: pages.length });
  // first pass: the proposals, each with its own keywords and the numbered commitment it belongs to
  const found = [], groups = [];
  let group = null, itemNo = null;
  for (const s of list) {
    if (s.item) { itemNo = s.item; group = { head: classify(s.text), all: new Set() }; groups.push(group); }
    const proposal = s.item || FUTURE.test(s.text) || PROPOSE.test(s.text) || INFINITIVE.test(s.text) || (group && OBLIGATION.test(s.text));
    if (!proposal || s.text.length < 20) continue;
    const own = classify(s.text);
    if (group) own.topics.forEach(t => group.all.add(t));
    found.push({ s, own, group, item: itemNo });
  }
  // second pass: inside a numbered commitment, a sentence also takes the commitment's topic (from its headline, or
  // from the rest of the commitment when the headline has no keyword); outside one, a sentence with no keyword of its
  // own takes the topic of its section heading
  let n = 0;
  for (const { s, own, group, item } of found) {
    let c = own, via = 'texto';
    if (group) {
      const ctx = group.head.topics.length ? group.head.topics : [...group.all];
      const extra = (own.topics.length && group.head.topics.length) ? group.head.topics : own.topics.length ? [] : ctx;
      if (extra.some(t => !own.topics.includes(t))) {
        c = { topics: [...new Set(own.topics.concat(extra))], subs: own.subs };
        via = own.topics.length ? 'texto y compromiso' : 'compromiso';
      }
    } else if (!own.topics.length && s.head) {
      const h = classify(s.head);
      if (h.topics.length) { c = { topics: h.topics, subs: [] }; via = 'apartado'; }
    }
    if (!flat.includes(norm(s.text).replace(/\s+/g, ' '))) { problems.push(`${d.id} p.${s.page}: quote not found in the document: ${s.text.slice(0, 60)}`); continue; }
    const n2 = norm(s.text);
    quotes.push({
      id: `${d.id}-${++n}`, party: p.id, doc: d.id, page: s.page, item, text: s.text,
      topics: c.topics, subs: c.subs, via,
      flags: Object.keys(FLAGS).filter(k => FLAGS[k].test(n2))
    });
  }
}
if (problems.length) { console.error('Not writing data/quotes.json:\n  ' + problems.join('\n  ')); process.exit(1); }
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data', 'quotes.json'), JSON.stringify({ generated: new Date().toISOString(), docs, quotes }, null, 1) + '\n');
const byTopic = {};
for (const q of quotes) for (const t of q.topics.length ? q.topics : ['(sin tema)']) byTopic[t] = (byTopic[t] || 0) + 1;
console.log(`${docs.length} documents, ${quotes.length} proposals; by topic: ${Object.entries(byTopic).map(([k, v]) => k + ' ' + v).join(', ')}`);
