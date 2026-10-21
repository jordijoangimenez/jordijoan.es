// Small text helpers shared by the parser: entity decoding, numbers, dates, slugs.

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', ndash: '–', mdash: '—',
  rarr: '→', larr: '←', hellip: '…', laquo: '«', raquo: '»', ordf: 'ª', ordm: 'º', deg: '°', plusmn: '±',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í',
  Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ccedil: 'ç', Ccedil: 'Ç',
  agrave: 'à', egrave: 'è', ograve: 'ò', Agrave: 'À', Egrave: 'È', Ograve: 'Ò', iuml: 'ï', ouml: 'ö',
  auml: 'ä', Ouml: 'Ö', Auml: 'Ä', aring: 'å', Aring: 'Å', oslash: 'ø', Oslash: 'Ø', aelig: 'æ', AElig: 'Æ',
  szlig: 'ß', euro: '€', bull: '•', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', iexcl: '¡', iquest: '¿',
};

export function decode(s) {
  if (!s) return '';
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e] ?? m;
  });
}

export const stripTags = s => decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

// "34,9" -> 34.9, "1.812" -> 1812 (thousands) only when asked, "–" -> null
export function num(s) {
  if (s == null) return null;
  const m = String(s).replace(/\s/g, '').match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const v = parseFloat(m[0].replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

export function intLoose(s) {
  if (s == null) return null;
  const m = String(s).match(/\d[\d.,\s]*/);
  if (!m) return null;
  const v = parseInt(m[0].replace(/[.,\s]/g, ''), 10);
  return Number.isFinite(v) ? v : null;
}

// Seats "132/137", "6-7", "10", "0/2" -> [lo, hi]; anything else -> null
export function seats(s) {
  if (s == null) return null;
  const t = decode(String(s)).replace(/\s/g, '');
  let m = t.match(/^(\d+)(?:[/–—-](\d+))?$/);
  if (!m) return null;
  const lo = parseInt(m[1], 10), hi = m[2] != null ? parseInt(m[2], 10) : lo;
  return hi >= lo ? [lo, hi] : [hi, lo];
}

const pad = n => String(n).padStart(2, '0');
const iso = (y, m, d) => {
  if (!(y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 ? `${y}-${pad(m)}-${pad(d)}` : null;
};

// Fieldwork strings: "19-22/05/2025", "28/09-05/10/2026", "05/2025", "01/02/2024-03/03/2024", "12/03/2024"
export function fieldwork(raw) {
  const s = decode(raw || '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const full = [...s.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)];
  let end = null, start = null;
  if (full.length) {
    const L = full[full.length - 1];
    end = iso(+L[3], +L[2], +L[1]);
    const head = s.slice(0, L.index);
    const F = full.length > 1 ? full[0] : null;
    if (F) start = iso(+F[3], +F[2], +F[1]);
    else {
      const dm = head.match(/(\d{1,2})\/(\d{1,2})\s*-\s*$/);
      const d = head.match(/(\d{1,2})\s*-\s*$/);
      if (dm) {
        let y = +L[3];
        if (+dm[2] > +L[2]) y -= 1;
        start = iso(y, +dm[2], +dm[1]);
      } else if (d) start = iso(+L[3], +L[2], +d[1]);
    }
  } else {
    const my = s.match(/(\d{1,2})\/(\d{4})/);
    if (my) end = iso(+my[2], +my[1], 15);
  }
  if (start && end && start > end) start = null;
  return { start, end };
}

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9,
  octubre: 10, noviembre: 11, diciembre: 12, january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

// Dates written in post titles: "19/10/2026", "Mayo 2015", "October 2013"
export function titleDate(t) {
  const m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  const w = t.toLowerCase().normalize('NFC').match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|sept?iembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)\.?,?\s+(\d{4})/);
  if (w) return iso(+w[2], MONTHS[w[1]], 15);
  return null;
}

export function dmy(s) {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? iso(+m[3], +m[2], +m[1]) : null;
}

export const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
export const slug = s => fold(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Key used to match the same party across polls: "Cs" == "CS", "Más País-Equo" == "MAS PAIS EQUO"
export const partyKey = s => fold(decode(s)).toUpperCase().replace(/['’]/g, '').replace(/[^A-Z0-9+]+/g, ' ').trim();

const LOWER = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'i', 'e', 'en', 'da', 'do', 'das', 'dos', 'der', 'und', 'von', 'van', 'of', 'the', 'and', 'sur', 'les', 'le', 'di']);
// "MONFORTE DE LEMOS" -> "Monforte de Lemos", "VITORIA-GASTEIZ" -> "Vitoria-Gasteiz"
export function titleCase(s) {
  return s.toLowerCase().split(' ').map((w, i) => {
    if (i > 0 && LOWER.has(w)) return w;
    return w.replace(/(^|[-/(.'’])(\p{L})/gu, (m, p, c) => p + c.toUpperCase());
  }).join(' ').replace(/(?<=\s)([DL])'(\p{L})/gu, (m, a, c) => a.toLowerCase() + "'" + c.toUpperCase());
}
