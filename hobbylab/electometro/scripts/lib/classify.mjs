// Works out which election a post belongs to, from its Blogger labels and its title.
import { fold, slug, titleCase, decode } from './text.mjs';

const n = s => fold(decode(s)).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const REGIONS = {
  And: 'Andalucía', Ara: 'Aragón', Ast: 'Asturias', Bal: 'Illes Balears', Can: 'Canarias', Ctb: 'Cantabria',
  CyL: 'Castilla y León', CLM: 'Castilla-La Mancha', Cat: 'Cataluña', Ceu: 'Ceuta', Ext: 'Extremadura',
  Gal: 'Galicia', Mad: 'Comunidad de Madrid', Mel: 'Melilla', Mur: 'Región de Murcia', Nav: 'Navarra',
  PV: 'País Vasco', Rio: 'La Rioja', Val: 'Comunitat Valenciana',
};
// Region label (as used on the blog) or title spelling -> code
const REGION_ALIASES = {
  'andalucia': 'And', 'aragon': 'Ara', 'asturias': 'Ast', 'principado de asturias': 'Ast', 'islas baleares': 'Bal',
  'illes balears': 'Bal', 'baleares': 'Bal', 'canarias': 'Can', 'cantabria': 'Ctb', 'castilla y leon': 'CyL',
  'castilla la mancha': 'CLM', 'cataluna': 'Cat', 'catalunya': 'Cat', 'ceuta': 'Ceu', 'extremadura': 'Ext',
  'galicia': 'Gal', 'comunidad de madrid': 'Mad', 'melilla': 'Mel', 'region de murcia': 'Mur', 'navarra': 'Nav',
  'comunidad foral de navarra': 'Nav', 'pais vasco': 'PV', 'euskadi': 'PV', 'la rioja': 'Rio',
  'comunidad valenciana': 'Val', 'comunitat valenciana': 'Val',
};
const REGION_LABELS = new Set(['Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias', 'Cantabria', 'Castilla y León',
  'Castilla-La Mancha', 'Cataluña', 'Ceuta', 'Extremadura', 'Galicia', 'Comunidad de Madrid', 'Melilla', 'Región de Murcia',
  'Navarra', 'País Vasco', 'La Rioja', 'Comunidad Valenciana']);

// Blog country label -> [ISO code, Spanish name]
export const COUNTRIES = {
  Spain: ['es', 'España'], Norway: ['no', 'Noruega'], Sweden: ['se', 'Suecia'], Denmark: ['dk', 'Dinamarca'],
  Germany: ['de', 'Alemania'], Netherlands: ['nl', 'Países Bajos'], Greece: ['gr', 'Grecia'], Portugal: ['pt', 'Portugal'],
  Iceland: ['is', 'Islandia'], Austria: ['at', 'Austria'], 'United Kingdom': ['gb', 'Reino Unido'], Finland: ['fi', 'Finlandia'],
  Poland: ['pl', 'Polonia'], Estonia: ['ee', 'Estonia'], 'Czech Republic': ['cz', 'Chequia'], Ireland: ['ie', 'Irlanda'],
  Italy: ['it', 'Italia'], France: ['fr', 'Francia'], Hungary: ['hu', 'Hungría'], Slovakia: ['sk', 'Eslovaquia'],
  Belgium: ['be', 'Bélgica'], Bulgaria: ['bg', 'Bulgaria'], Slovenia: ['si', 'Eslovenia'], Croatia: ['hr', 'Croacia'],
  Canada: ['ca', 'Canadá'], Russia: ['ru', 'Rusia'], Latvia: ['lv', 'Letonia'], Switzerland: ['ch', 'Suiza'],
  Australia: ['au', 'Australia'], Cyprus: ['cy', 'Chipre'], Israel: ['il', 'Israel'], Lithuania: ['lt', 'Lituania'],
  Romania: ['ro', 'Rumanía'], Malta: ['mt', 'Malta'], Luxembourg: ['lu', 'Luxemburgo'], Turkey: ['tr', 'Turquía'],
  India: ['in', 'India'], Moldova: ['md', 'Moldavia'], Serbia: ['rs', 'Serbia'], Ukraine: ['ua', 'Ucrania'],
  'New Zealand': ['nz', 'Nueva Zelanda'], Andorra: ['ad', 'Andorra'], Greenland: ['gl', 'Groenlandia'],
  Macedonia: ['mk', 'Macedonia del Norte'], Montenegro: ['me', 'Montenegro'], Mongolia: ['mn', 'Mongolia'],
  Indonesia: ['id', 'Indonesia'], 'South Africa': ['za', 'Sudáfrica'], USA: ['us', 'Estados Unidos'], Brazil: ['br', 'Brasil'],
  Uruguay: ['uy', 'Uruguay'], Gibraltar: ['gi', 'Gibraltar'],
};
// Title spellings (English and Spanish) for posts that carry no country label
const COUNTRY_TITLES = {};
for (const [label, [code, es]] of Object.entries(COUNTRIES)) { COUNTRY_TITLES[n(label)] = label; COUNTRY_TITLES[n(es)] = label; }
Object.assign(COUNTRY_TITLES, {
  'the netherlands': 'Netherlands', 'holanda': 'Netherlands', 'czechia': 'Czech Republic', 'republica checa': 'Czech Republic',
  'republic of ireland': 'Ireland', 'great britain': 'United Kingdom', 'reino unido gb': 'United Kingdom', 'gran bretana': 'United Kingdom',
  'eeuu': 'USA', 'estados unidos': 'USA', 'united states': 'USA', 'north macedonia': 'Macedonia', 'espana': 'Spain', 'spain': 'Spain',
});

// Sub-national units abroad: label -> [country label, Spanish name]
const SUBNATIONAL = {
  Saxony: ['Germany', 'Sajonia'], Brandenburg: ['Germany', 'Brandeburgo'], Thuringia: ['Germany', 'Turingia'], Berlin: ['Germany', 'Berlín'],
  Bavaria: ['Germany', 'Baviera'], Hesse: ['Germany', 'Hesse'], Hamburg: ['Germany', 'Hamburgo'], Saarland: ['Germany', 'Sarre'],
  'Schleswig-Holstein': ['Germany', 'Schleswig-Holstein'], 'Saxony-Anhalt': ['Germany', 'Sajonia-Anhalt'],
  'Mecklenburg-Vorpommern': ['Germany', 'Mecklemburgo-Pomerania Occidental'], 'North Rhine-Westphalia': ['Germany', 'Renania del Norte-Westfalia'],
  'Rhineland-Palatinate': ['Germany', 'Renania-Palatinado'], 'Baden-Württemberg': ['Germany', 'Baden-Wurtemberg'],
  Vienna: ['Austria', 'Viena'], Styria: ['Austria', 'Estiria'], Estiria: ['Austria', 'Estiria'], Carinthia: ['Austria', 'Carintia'],
  Burgenland: ['Austria', 'Burgenland'], Vorarlberg: ['Austria', 'Vorarlberg'], Scotland: ['United Kingdom', 'Escocia'],
  Stockholm: ['Sweden', 'Estocolmo'], 'Skåne': ['Sweden', 'Escania'], 'Västra Götaland': ['Sweden', 'Västra Götaland'], Uppsala: ['Sweden', 'Upsala'],
  'Göteborg': ['Sweden', 'Gotemburgo'], 'Malmö': ['Sweden', 'Malmö'], Helsingborg: ['Sweden', 'Helsingborg'], Kristianstad: ['Sweden', 'Kristianstad'],
  Kalmar: ['Sweden', 'Kalmar'], Kronoberg: ['Sweden', 'Kronoberg'], Landskrona: ['Sweden', 'Landskrona'], Lund: ['Sweden', 'Lund'],
  Solna: ['Sweden', 'Solna'], Trelleborg: ['Sweden', 'Trelleborg'], 'Växjö': ['Sweden', 'Växjö'], 'Borås': ['Sweden', 'Borås'],
  Oslo: ['Norway', 'Oslo'], Bergen: ['Norway', 'Bergen'], 'Tromsø': ['Norway', 'Tromsø'], Horten: ['Norway', 'Horten'],
  'Reykjavík': ['Iceland', 'Reikiavik'], Paris: ['France', 'París'], Marseille: ['France', 'Marsella'], Nice: ['France', 'Niza'],
  Avignon: ['France', 'Aviñón'],
};
const SUB_MUNICIPAL = new Set(['Stockholm', 'Göteborg', 'Malmö', 'Helsingborg', 'Kristianstad', 'Landskrona', 'Lund', 'Solna', 'Trelleborg',
  'Växjö', 'Borås', 'Uppsala', 'Oslo', 'Bergen', 'Tromsø', 'Horten', 'Reykjavík', 'Paris', 'Marseille', 'Nice', 'Avignon', 'Vienna', 'Berlin', 'Hamburg']);

// Title spellings of Spanish places that differ from the blog's label
const PLACE_ALIASES = {
  'valencia': 'Valencia', 'castello de la plana': 'Castellón de la Plana', 'castellon castello de la plana': 'Castellón de la Plana',
  'castellon de la plana castello de la plana': 'Castellón de la Plana', 'burriana': 'Borriana', 'palma': 'Palma de Mallorca',
  'eivissa': 'Ibiza/Eivissa-Vila', 'mao': 'Maó-Mahón', 'la linea': 'La Línea de la Concepción', 'el puerto de sta maria': 'El Puerto de Santa María',
  'alcazar de s juan': 'Alcázar de San Juan', 'vizcaya': 'Bizkaia', 'jj gg vizcaya': 'Bizkaia', 'alava': 'Álava-Araba', 'araba': 'Álava-Araba',
  'guipuzcoa': 'Gipuzkoa', 'alicante alacant': 'Alicante', 'elche elx': 'Elche/Elx', 'elche': 'Elche/Elx', 'elx': 'Elche/Elx', 'san sebastian': 'Donostia-San Sebastián',
  'donostia san sebastian': 'Donostia-San Sebastián', 'bilbao': 'Bilbao-Bilbo', 'vitoria gasteiz': 'Vitoria-Gasteiz', 'monforte de lemos': 'Monforte',
  'l hospitalet de llobregat': 'Hospitalet', 'hospitalet de llobregat': 'Hospitalet', 'gran canaria': 'Gran Canaria',
};

const TYPE_LABELS = new Set(['Spain', 'Generales', 'Autonómicas', 'Municipales', 'Europeas', 'Europeas_Esp', 'Generales_CCAA', 'Forales',
  'Cabildos Insulares', 'Consells Insulars', 'Internacional', 'Results', 'Exit polls', 'Sondeos internos', 'Otros estudios', 'Panels',
  'Otras entidades', 'Landstingsval', 'Kommunval', 'Kommunestyrevalg', 'Riksdagsval', 'Legislative', 'Congreso de los Diputados', 'EP2014', 'Greens']);
const OFF_TOPIC = new Set(['Otros estudios', 'Apoyo a la independencia', 'Referéndum 1-O', 'moción de censura', 'estado de alarma']);

// Text before the first separator, minus "[G]" tags and flag emoji: "MONFORTE DE LEMOS · Elecciones ..." -> "MONFORTE DE LEMOS"
export function titleArea(t) {
  let s = t.replace(/^[\u{1F1E6}-\u{1F1FF}\s]+/u, '').replace(/^\[[^\]]*\]\s*/, '')
    .replace(/([A-ZÁÉÍÓÚÑÜ])(Sondeo|Encuesta)\b/u, '$1 $2'); // "ESPAÑASondeo NC Report" (2017)
  const m = s.match(/^(.*?)(?:\s+[·▪|]\s+|,\s|:\s|\s+(?:Sondeo|Encuesta|Resultados|Elecciones)\b|\s+(?=[A-Z][a-zé]))/u);
  s = (m ? m[1] : s).trim();
  const q = s.match(/^(.*?)\s*\(([^)]*)\)?\.?$/);
  return q ? { area: q[1].trim(), qual: q[2].trim() } : { area: s.replace(/\.$/, ''), qual: '' };
}

function matchLabel(labels, area, exclude) {
  const na = n(area);
  if (!na) return null;
  const pool = labels.filter(l => !exclude.has(l));
  return pool.find(l => n(l) === na)
    || (PLACE_ALIASES[na] && pool.find(l => l === PLACE_ALIASES[na]))
    || pool.find(l => n(l).length > 3 && (na.startsWith(n(l) + ' ') || na.endsWith(' ' + n(l))))
    || null;
}

const regionCode = labels => {
  for (const l of labels) {
    const m = l.match(/^[AM]_(\w+)$/);
    if (m && REGIONS[m[1]]) return m[1];
  }
  for (const l of labels) if (REGION_ALIASES[n(l)]) return REGION_ALIASES[n(l)];
  return null;
};

// -> { id, kind, country, area, areaLabel, name } or { skip: reason }
export function classify(post) {
  const L = post.labels;
  const has = l => L.includes(l);
  const title = decode(post.title);
  if (/^(Votación|Moción|Encuesta socio-electoral)/i.test(title)) return { skip: 'vote-or-study' };
  if (L.some(l => OFF_TOPIC.has(l))) return { skip: 'off-topic' };

  const { area: tArea, qual } = titleArea(title);
  const nt = n(tArea);
  const flags = {
    internal: has('Sondeos internos') || /\(intern[ao]/i.test(title),
    result: has('Results') || /^(?:\S+\s+)?[^·]*·\s*Resultados\b|Resultados (?:de las )?elecciones|\bresults\b/i.test(title),
    exit: has('Exit polls') || /pie de urna|exit poll/i.test(title),
  };

  let country = Object.keys(COUNTRIES).find(c => has(c));
  if (!country && COUNTRY_TITLES[nt]) country = COUNTRY_TITLES[nt];
  const spanishType = ['Generales', 'Autonómicas', 'Municipales', 'Europeas_Esp', 'Generales_CCAA', 'Forales', 'Cabildos Insulares', 'Consells Insulars'].some(has);
  if (!country && (spanishType || L.some(l => /^[AM]_/.test(l)))) country = 'Spain';
  if (has('Spain') || (spanishType && !has('Internacional'))) country = 'Spain';
  if (!country) {
    const sub = Object.keys(SUBNATIONAL).find(has);
    if (sub) country = SUBNATIONAL[sub][0];
  }
  if (!country) return { skip: 'no-country' };

  const exclude = new Set([...TYPE_LABELS, ...Object.keys(COUNTRIES), ...REGION_LABELS]);
  if (country === 'Spain') {
    const rc = regionCode(L);
    if (/^(CAPITALES|CIUDADES|ALCALD|28M|26M|24M)/i.test(tArea) || /\by\s*$/i.test(qual)) return { skip: 'multi-area' };
    if (has('Europeas_Esp') || ((has('Europeas') || has('EP2014')) && !has('Autonómicas'))) {
      return { id: 'es-europeas', kind: 'europeas', country: 'es', area: 'España', flags };
    }
    // Navarra's parliament carries both "Autonómicas" and "Forales"; the Basque Juntas Generales only "Forales"
    let kind = has('Forales') && !has('Autonómicas') ? 'forales' : has('Cabildos Insulares') ? 'cabildo' : has('Consells Insulars') ? 'consell'
      : has('Municipales') && !has('Autonómicas') ? 'municipales'
      : has('Autonómicas') && !/congreso|generales/i.test(qual) ? 'autonomicas'
      : has('Generales_CCAA') || has('Generales') ? 'congreso' : null;
    // 2026 titles state the election outright: "PAMPLONA · Elecciones municipales · ..."
    const said = title.match(/·\s*Elecciones (municipales|autonómicas|forales|generales|a Juntas Generales|al? Cabildo|al? Consell)/i)?.[1].toLowerCase();
    if (said) kind = said.startsWith('muni') ? 'municipales' : said.startsWith('auto') ? 'autonomicas' : said.startsWith('gen') ? 'congreso'
      : /cabildo/.test(said) ? 'cabildo' : /consell/.test(said) ? 'consell' : 'forales';
    if (!kind) {
      if (/cabildo/i.test(qual + title)) kind = 'cabildo';
      else if (/consell/i.test(qual + title)) kind = 'consell';
      else if (/JJ\.?\s*GG|juntas generales/i.test(title)) kind = 'forales';
      else if (rc && REGION_ALIASES[nt]) kind = 'autonomicas';
      else if (nt === 'espana' || nt === 'spain') kind = 'congreso';
      else kind = 'municipales';
    }
    if (kind === 'congreso') {
      if (nt === 'espana' || nt === 'spain' || !tArea) return { id: 'es-congreso', kind, country: 'es', area: 'España', flags };
      const code = REGION_ALIASES[nt];
      if (code) return { id: `es-congreso-${slug(REGIONS[code])}`, kind: 'congreso-ccaa', country: 'es', area: REGIONS[code], flags };
      const lab = matchLabel(L, tArea.replace(/^PROV\.?\s*(DE\s+)?/i, ''), exclude) || titleCase(tArea.replace(/^PROV\.?\s*(DE\s+)?/i, ''));
      return { id: `es-congreso-${slug(lab)}`, kind: 'congreso-ccaa', country: 'es', area: lab, flags };
    }
    if (kind === 'autonomicas') {
      const code = rc || REGION_ALIASES[nt];
      if (!code) return { skip: 'no-region' };
      return { id: `es-autonomicas-${slug(REGIONS[code])}`, kind, country: 'es', area: REGIONS[code], region: code, flags };
    }
    // municipal, foral, island councils: area is a city / territory / island label
    const cleaned = tArea.replace(/^(JJ\.?\s*GG\.?|CABILDOS?|CONSELL)\s+(DE\s+|DEL\s+)?/i, '');
    let lab = matchLabel(L, cleaned, kind === 'forales' ? new Set([...TYPE_LABELS, ...Object.keys(COUNTRIES)]) : exclude);
    if (!lab && PLACE_ALIASES[n(cleaned)]) lab = PLACE_ALIASES[n(cleaned)];
    if (!lab) lab = titleCase(cleaned);
    if (kind === 'forales' && n(lab) === 'pais vasco') return { skip: 'multi-area' };
    // a region- or country-wide municipal summary is not one council
    if (kind === 'municipales' && (REGION_ALIASES[n(lab)] || COUNTRY_TITLES[n(lab)])) return { skip: 'multi-area' };
    if (kind === 'consell') lab = lab.replace(/-Vila$/, '');
    return { id: `es-${kind}-${slug(lab)}`, kind, country: 'es', area: lab, region: rc || undefined, flags };
  }

  const [code, es] = COUNTRIES[country];
  // Belgian polls are published per region (Flanders / Wallonia / Brussels), with no national figure to average
  if (code === 'be') return { skip: 'regional-lists' };
  const sub = Object.keys(SUBNATIONAL).find(has);
  if (has('Europeas') || has('EP2014') || /\(EP\s*\d{4}\)|europeas|parlamento europeo/i.test(qual + ' ' + title)) {
    return { id: `${code}-europeas`, kind: 'europeas', country: code, area: es, flags };
  }
  if (/presiden/i.test(qual + ' ' + title)) return { id: `${code}-presidenciales`, kind: 'presidenciales', country: code, area: es, flags };
  if (sub || has('Kommunval') || has('Kommunestyrevalg') || has('Landstingsval')) {
    const muni = has('Kommunval') || has('Kommunestyrevalg') || (sub && SUB_MUNICIPAL.has(sub) && !has('Landstingsval'));
    const name = sub ? SUBNATIONAL[sub][1] : titleCase(tArea);
    const kind = muni ? 'municipales' : 'regionales';
    return { id: `${code}-${kind}-${slug(name)}`, kind, country: code, area: name, parent: es, flags };
  }
  return { id: `${code}-legislativas`, kind: 'legislativas', country: code, area: es, flags };
}

export const KIND_NAMES = {
  congreso: 'Congreso de los Diputados', 'congreso-ccaa': 'Congreso (circunscripción)', autonomicas: 'Elecciones autonómicas',
  municipales: 'Elecciones municipales', forales: 'Juntas Generales', cabildo: 'Cabildo insular', consell: 'Consell insular',
  europeas: 'Parlamento Europeo', legislativas: 'Elecciones legislativas', presidenciales: 'Elecciones presidenciales',
  regionales: 'Elecciones regionales',
};
