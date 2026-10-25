/* Sellómetro: the stamp catalogue, in English or Spanish (../shared/lang.js). The issue texts themselves (BOE provisions,
   series names, FESOFI subjects and technical details) stay in Spanish, as published. */
(function () {
  'use strict';

  var L = window.HLLang || { lang: 'en', apply: function () {} };
  var ES = L.lang === 'es';
  L.apply({ es: {
    _description: 'Todas las emisiones de sellos de correo de España desde 1850, por año, época y tema: desde 1960 con el texto oficial y la ficha técnica del BOE, y con las imágenes del catálogo de FESOFI.',
    skip: 'Saltar a las emisiones', sections: 'Secciones', nav_eras: 'Épocas', nav_issues: 'Emisiones', nav_method: 'Método', theme: 'Cambiar tema',
    filters: 'Filtrar emisiones', f_q: 'Buscar', f_q_ph: 'Serie, motivo, personaje, lugar…', f_era: 'Época', all_eras: 'Todas las épocas',
    f_from: 'Desde', f_to: 'Hasta', any_year: 'Cualquier año', f_kind: 'Tipo', all_kinds: 'Todos los tipos', k_sellos: 'Sellos y hojas bloque',
    k_tarjeta: 'Tarjetas prefranqueadas', k_sobre: 'Sobres y enteros postales', k_aerograma: 'Aerogramas', k_etiqueta: 'Etiquetas',
    f_terr: 'Territorio', all_terr: 'España, Andorra y África', t_espana: 'España', t_andorra: 'Andorra (correo español)', t_africa: 'Territorios de África',
    f_sort: 'Orden', s_new: 'Más recientes primero', s_old: 'Más antiguas primero', s_series: 'Serie, de la A a la Z', reset: 'Limpiar',
    about: 'Sobre este catálogo',
    sub: 'Todas las emisiones de sellos de correo de España, de 1850 a hoy, por año, época y tema. Desde 1960 cada emisión muestra el texto oficial y la ficha técnica de su disposición en el Boletín Oficial del Estado. Las imágenes vienen del catálogo de FESOFI y de la web de Filatelia de Correos, enlazadas desde ellas, y las emisiones anteriores, de FESOFI. Un catálogo no oficial.',
    eras_h: 'Sellos por época', eras_hint: 'Pulsa una época para ver sus emisiones', issues_h: 'Emisiones', loading: 'Cargando emisiones…',
    views: 'Agrupar emisiones', v_year: 'Por año', v_era: 'Por época', v_topic: 'Por tema', v_all: 'Todas', by_topic: 'Filtrar por tema',
    method: 'Cómo funciona',
    method_body: '<h3>Fuente</h3><p>Cada emisión de sellos de correo se aprueba con una disposición publicada en el Boletín Oficial del Estado: una orden ministerial hasta los años noventa y, después, una resolución conjunta de las subsecretarías competentes. El catálogo recorre los sumarios diarios del BOE desde 1960 con su <a href="https://www.boe.es/datosabiertos/" rel="noopener">API de datos abiertos</a> y recoge todas las disposiciones sobre emisión de sellos, tarjetas y sobres.</p>' +
      '<h3>Copiado, no reescrito</h3><p>El nombre de la serie, el texto que presenta cada emisión, la fecha de puesta en circulación y las características técnicas (impresión, papel, dentado, formato, valor, tirada) se copian del texto del BOE. Si el BOE publicó después una corrección de errores, la emisión la enlaza.</p>' +
      '<h3>Antes de 1995</h3><p>El BOE solo ofrece el texto de casi todas las disposiciones anteriores a 1995 como imagen escaneada en PDF. Para esas emisiones el catálogo muestra el título oficial, la fecha de publicación y el enlace al PDF, sin características técnicas.</p>' +
      '<h3>Antes de 1960</h3><p>Los datos abiertos del BOE empiezan en 1960. Las emisiones anteriores, de Isabel II a la posguerra, y las pocas posteriores que no aparecen en el BOE vienen del <a href="https://catalogodesellos.fesofi.es/" rel="noopener">Catálogo de Sellos de España de FESOFI</a>, con lo mínimo para identificarlas: fecha, serie, motivo y valor de cada sello. La ficha completa está en FESOFI.</p>' +
      '<h3>Imágenes</h3><p>Cada emisión del BOE se empareja con sus sellos en FESOFI por la fecha y el nombre de la serie, y muestra sus imágenes y la lista de sus valores. Cuando FESOFI no tiene imagen (las emisiones más nuevas, algunas recientes, Andorra, las tarjetas prefranqueadas), muestra la imagen oficial de la web de Filatelia de Correos, emparejada por fecha y título; Correos las publica desde 1997. El emparejamiento es automático: alguna emisión puede quedar sin imágenes o, si los catálogos la llaman de forma distinta, aparecer dos veces.</p>' +
      '<h3 id="rights">Imágenes y derechos</h3><p>Este es un catálogo informativo y sin ánimo de lucro. Las imágenes se muestran directamente desde las webs de FESOFI y de Correos, sin copiarlas: este sitio no guarda ninguna, y al abrir la página tu navegador las pide a sus servidores. Si dejan de cargarse, cada emisión se dibuja como un sello de texto. El diseño de cada sello pertenece a sus autores y a Correos, y las fotos, a FESOFI y a Correos. Si tienes derechos sobre algún contenido de esta página y quieres que se retire, <a href="https://github.com/jordijoangimenez/jordijoan.es/issues" rel="noopener">abre una incidencia en GitHub</a> y se quitará.</p>' +
      '<h3>Temas</h3><p>Cada emisión se clasifica en uno o varios temas (arte, naturaleza, personajes, deporte…) a partir de las palabras de su texto oficial. Es una clasificación automática y no oficial, así que alguna emisión puede caer en un tema inesperado.</p>' +
      '<h3>Territorios</h3><p>Además de España, el BOE recoge las emisiones del correo español en Andorra y, hasta los años setenta, las de los territorios de África (Sahara, Ifni, Guinea). Se pueden filtrar aparte.</p>' +
      '<h3>Etiquetas ATM</h3><p>Las etiquetas de franqueo de valor variable no se publican en el BOE. Tienen su propia página, con su historia, cómo leerlas y dónde consultar las emisiones: <a href="atm.html">etiquetas ATM</a>.</p>',
    foot1: 'Textos: disposiciones del Boletín Oficial del Estado (<a href="https://www.boe.es/" rel="noopener">BOE</a>). Fuente de los datos: Agencia Estatal Boletín Oficial del Estado, reutilización autorizada citando la fuente; los temas y las épocas son una elaboración propia basada en esos datos. Imágenes: <a href="https://catalogodesellos.fesofi.es/" rel="noopener">Catálogo de Sellos de España</a> de la Federación Española de Sociedades Filatélicas (FESOFI) y <a href="https://www.correos.es/es/es/particulares/filatelia" rel="noopener">Filatelia de Correos</a>, enlazadas desde sus webs; emisiones anteriores a 1960: FESOFI. Diseños de los sellos: &copy; sus autores y Correos; las imágenes se muestran solo para identificar cada emisión (<a href="#rights">derechos</a>). Este catálogo no es oficial y ni el BOE, ni FESOFI, ni Correos participan en él: consulta siempre la fuente original.',
    foot2: 'Un proyecto de', foot3: 'en', updated: 'Datos actualizados:', prev: '&larr; Anterior', next: 'Siguiente &rarr;', close: 'Cerrar'
  } });

  var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var S = ES ? {
    eras: { 'isabel-ii': 'Isabel II', 'duque-de-la-torre': 'Regencia del Duque de la Torre', 'amadeo-i': 'Amadeo I', 'primera-republica': 'I República',
      'carlos-vii': 'Carlos VII', 'alfonso-xii': 'Alfonso XII', 'alfonso-xiii': 'Alfonso XIII', 'segunda-republica': 'II República',
      'francisco-franco': 'Francisco Franco', 'juan-carlos-i': 'Juan Carlos I', 'felipe-vi': 'Felipe VI' },
    since: 'desde ',
    kind: { sellos: 'Sellos', tarjeta: 'Tarjeta prefranqueada', sobre: 'Sobre o entero postal', aerograma: 'Aerograma', etiqueta: 'Etiquetas' },
    terr: { espana: 'España', andorra: 'Andorra (correo español)', africa: 'Territorios de África' },
    longDate: function (d, m, y) { return d + ' de ' + MONTHS_ES[m] + ' de ' + y; },
    shortDate: function (d, m, y) { return d + ' ' + MONTHS_ES[m].slice(0, 3) + ' ' + y; },
    monthYear: function (m, y) { return MONTHS_ES[m] + ' de ' + y; },
    noName: 'Emisión sin nombre en el título', issue: ['emisión', 'emisiones'], stamp: ['sello', 'sellos'], atLeast: 'al menos ', noTopic: 'Sin tema',
    more: function (n) { return 'Ver más (quedan ' + n + ')'; }, none: 'Ninguna emisión coincide con estos filtros.',
    all: function (n) { return 'Las ' + n + ' emisiones · abre una para ver su texto oficial'; },
    match: function (n) { return n === 1 ? '1 emisión coincide' : n + ' emisiones coinciden'; },
    preBoe: 'Antes del BOE abierto · ver en FESOFI ↗',
    issued: 'Puesta en circulación: ', pubNoDate: function (d) { return 'Publicada en el BOE el ' + d + ' (fecha de emisión no disponible)'; },
    issuedIn: 'Emitida en ', topics: 'Temas: ', official: 'Texto oficial', titleH: 'Título de la disposición',
    pdfOnly: 'El BOE solo ofrece esta disposición como PDF escaneado, así que la ficha técnica no está disponible aquí.',
    fesofiOnly: function (pre) { return (pre ? 'Esta emisión es anterior a los datos abiertos del BOE' : 'Esta emisión no se ha encontrado en los datos abiertos del BOE') + ', así que aquí solo figura lo necesario para identificarla. La ficha completa de cada sello está en el catálogo de FESOFI.'; },
    techH: 'Características técnicas', stampsH: function (n) { return n === 1 ? 'El sello en FESOFI' : 'Los ' + n + ' sellos en FESOFI'; },
    fesofiNo: 'Nº FESOFI ', sourceH: 'Fuente', provision: 'Disposición', published: 'Publicada', pics: 'Imágenes', dataPics: 'Datos e imágenes',
    fesofiCat: 'Catálogo de Sellos de España de FESOFI, enlazado desde su web', corrected: 'Corregida después por:',
    openBoe: 'Abrir en el BOE', pdf: 'PDF del BOE', fesofiPage: 'Ficha en FESOFI', yearOnFesofi: function (y) { return 'Sellos de ' + y + ' en FESOFI'; },
    picSrc: 'Imagen: catálogo de FESOFI', picSrcCorreos: 'Imagen: Filatelia de Correos', pos: function (i, n) { return i + ' de ' + n; },
    correosH: 'Imágenes en Correos', correosPage: 'Ficha en Correos', officialPics: 'Imágenes oficiales', correosSite: 'Filatelia de Correos, enlazadas desde su web',
    pills: function (y0, y1, last) { return ['Sellos de España', y0 + '–' + y1, 'BOE, FESOFI y Correos', 'Último BOE: ' + last]; },
    countLabel: function (y0, n) { return 'emisiones desde ' + y0 + ', ' + n + ' con imagen'; },
    countSmall: function (t, n) { return t + ' con texto oficial del BOE · ' + n + ' temas'; },
    allTopics: 'Todos los temas',
    fail: function (m) { return 'No se han podido cargar los datos (' + m + '). Si has abierto la página como archivo local, sírvela por http, por ejemplo con un servidor web estático.'; }
  } : {
    eras: { 'isabel-ii': 'Isabel II', 'duque-de-la-torre': 'Regency of the Duke of la Torre', 'amadeo-i': 'Amadeo I', 'primera-republica': 'First Republic',
      'carlos-vii': 'Carlos VII', 'alfonso-xii': 'Alfonso XII', 'alfonso-xiii': 'Alfonso XIII', 'segunda-republica': 'Second Republic',
      'francisco-franco': 'Francisco Franco', 'juan-carlos-i': 'Juan Carlos I', 'felipe-vi': 'Felipe VI' },
    since: 'since ',
    kind: { sellos: 'Stamps', tarjeta: 'Prepaid postcard', sobre: 'Envelope or postal stationery', aerograma: 'Aerogramme', etiqueta: 'Labels' },
    terr: { espana: 'Spain', andorra: 'Andorra (Spanish post)', africa: 'Territories in Africa' },
    longDate: function (d, m, y) { return d + ' ' + MONTHS_EN[m] + ' ' + y; },
    shortDate: function (d, m, y) { return d + ' ' + MONTHS_EN[m].slice(0, 3) + ' ' + y; },
    monthYear: function (m, y) { return MONTHS_EN[m] + ' ' + y; },
    noName: 'Issue without a name in the title', issue: ['issue', 'issues'], stamp: ['stamp', 'stamps'], atLeast: 'at least ', noTopic: 'No topic',
    more: function (n) { return 'Load more (' + n + ' left)'; }, none: 'No issues match these filters.',
    all: function (n) { return 'All ' + n + ' issues · open one for its official text'; },
    match: function (n) { return n + (n === 1 ? ' issue matches' : ' issues match'); },
    preBoe: 'Before the BOE open data · see FESOFI ↗',
    issued: 'First day of sale: ', pubNoDate: function (d) { return 'Published in the BOE on ' + d + ' (issue date not available)'; },
    issuedIn: 'Issued in ', topics: 'Topics: ', official: 'Official text (in Spanish)', titleH: 'Title of the provision (in Spanish)',
    pdfOnly: 'The BOE only offers this provision as a scanned PDF, so its technical details are not available here.',
    fesofiOnly: function (pre) { return (pre ? 'This issue predates the BOE open data' : 'This issue was not found in the BOE open data') + ', so only what is needed to identify it is shown here. The full record of each stamp is in the FESOFI catalogue.'; },
    techH: 'Technical details (in Spanish)', stampsH: function (n) { return n === 1 ? 'The stamp on FESOFI' : 'The ' + n + ' stamps on FESOFI'; },
    fesofiNo: 'FESOFI no. ', sourceH: 'Source', provision: 'Provision', published: 'Published', pics: 'Pictures', dataPics: 'Data and pictures',
    fesofiCat: 'Catálogo de Sellos de España by FESOFI, linked from its website', corrected: 'Later corrected by:',
    openBoe: 'Open in the BOE', pdf: 'BOE PDF', fesofiPage: 'Record on FESOFI', yearOnFesofi: function (y) { return 'Stamps of ' + y + ' on FESOFI'; },
    picSrc: 'Picture: FESOFI catalogue', picSrcCorreos: 'Picture: Correos Filatelia', pos: function (i, n) { return i + ' of ' + n; },
    correosH: 'Pictures on Correos', correosPage: 'Record on Correos', officialPics: 'Official pictures', correosSite: 'Correos Filatelia, linked from its website',
    pills: function (y0, y1, last) { return ['Spanish stamps', y0 + '–' + y1, 'BOE, FESOFI and Correos', 'Latest BOE: ' + last]; },
    countLabel: function (y0, n) { return 'issues since ' + y0 + ', ' + n + ' with a picture'; },
    countSmall: function (t, n) { return t + ' with the official BOE text · ' + n + ' topics'; },
    allTopics: 'All topics',
    fail: function (m) { return 'The data could not be loaded (' + m + '). If you opened this page as a local file, serve the folder over http instead, for example with a simple static web server.'; }
  };
  function plural(n, w) { return n + ' ' + (n === 1 ? w[0] : w[1]); }

  var PAGE = 60;
  var DEFAULTS = { q: '', era: '', from: '', to: '', kind: '', terr: '', sort: 'date-desc', view: 'year', topic: '' };
  var VIEWS = ['all', 'year', 'era', 'topic'];
  var SORTS = ['date-desc', 'date-asc', 'series'];
  var FESOFI = 'https://catalogodesellos.fesofi.es/product-category/';
  var FESOFI_SITE = 'https://catalogodesellos.fesofi.es/';
  // stamp pictures are shown straight from the FESOFI catalogue or, when it has none, from the Correos pages; nothing is
  // copied, and if they stop loading the drawn stamp stays
  var FESOFI_IMG = 'https://catalogodesellos.fesofi.es/wp-content/uploads/';
  var CORREOS = 'https://www.correos.es';
  // eras as Spanish philately groups its stamps; the BOE open data starts in 1960, the earlier ones come from FESOFI
  var ERAS = [
    { id: 'isabel-ii', range: '1850–1870' }, { id: 'duque-de-la-torre', range: '1870–1872' }, { id: 'amadeo-i', range: '1872–1873' },
    { id: 'primera-republica', range: '1873–1875' }, { id: 'carlos-vii', range: '1873–1875' }, { id: 'alfonso-xii', range: '1875–1885' },
    { id: 'alfonso-xiii', range: '1886–1931' }, { id: 'segunda-republica', range: '1931–1939' }, { id: 'francisco-franco', range: '1936–1975' },
    { id: 'juan-carlos-i', range: '1975–2014' }, { id: 'felipe-vi', range: S.since + '2014' }
  ];
  var eraLabel = S.eras;
  var KIND_LABEL = S.kind;
  var TERR_LABEL = S.terr;

  var items = [];
  var byId = {};
  var TOPICS = []; // [{ id, label, count }] from data/topics.json; an issue can have several
  var topicLabel = {};
  var topicIndex = {};
  var filtered = [];
  var shown = 0;
  var state = Object.assign({}, DEFAULTS);
  var currentId = '';
  var lastFocus = null;
  var firstRender = true; // only the first list rises into view (Hobby Lab motion); later filter changes show at once

  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('dlg');

  function el(tag, props, children) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  // a text in Spanish (series names, BOE and FESOFI texts) inside an English page
  function esText(tag, props) {
    var n = el(tag, props);
    if (!ES) n.setAttribute('lang', 'es');
    return n;
  }

  /* ---------- formatting ---------- */

  function longDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return S.longDate(+p[2], +p[1] - 1, p[0]);
  }
  function shortDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return S.shortDate(+p[2], +p[1] - 1, p[0]);
  }
  // 'Europa.–2011' -> 'Europa – 2011'
  function niceSeries(s) {
    return (s || '').replace(/\s*\.?\s*[–-]\s*/g, ' – ').replace(/\s+/g, ' ').trim() || S.noName;
  }
  // first face value, short: '0,65 euros' -> '0,65 €', 'Tarifa «A»' -> 'A'
  function faces(face) {
    if (!face) return [];
    var out = [];
    face.split(/\s·\s|;|\s+y\s+(?=\d)/).forEach(function (v) {
      var m = v.match(/(\d+(?:[.,]\d+)?)\s*(euros?|€|pesetas|ptas?\.?|pta|céntimos|cts)/i);
      var t = v.match(/tarifas?\s*[«"]?([A-C]2?)\b/i);
      var s = m ? m[1] + ' ' + (/^(e|€)/i.test(m[2]) ? '€' : /^c/i.test(m[2]) ? 'cts' : 'pta') : t ? t[1].toUpperCase() : '';
      if (s && out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }
  // the country as printed on the stamps
  function placeName(c) {
    if (c.terr === 'espana') return 'ESPAÑA';
    if (c.terr === 'andorra') return 'ANDORRA';
    var m = ((c.boe && c.boe.title) || '').match(/Sahara|Ifni|Fernando Poo|R[ií]o Muni|Guinea/i);
    return m ? m[0].toUpperCase() : 'ÁFRICA';
  }
  // '1931-09' -> 'September 1931'
  function looseDate(c) {
    if (c.date) return shortDate(c.date);
    if (c.boe) return 'BOE ' + shortDate(c.boe.date);
    var p = (c.dateText || String(c.year)).split('-');
    return p[1] ? S.monthYear(+p[1] - 1, p[0]) : p[0];
  }
  function correosUrl(path) { return CORREOS + encodeURI(path); }
  // the pictures to try, in order: the first FESOFI stamp that has one (small), then the official Correos picture
  function pictureUrls(c) {
    var urls = [];
    for (var i = 0; i < c.stamps.length; i++) if (c.stamps[i].i) { urls.push(FESOFI_IMG + c.stamps[i].i); break; }
    if (c.correos && c.correos.i.length) urls.push(correosUrl(c.correos.i[0]));
    return urls;
  }
  // the issue's picture; if one does not load the next is tried, and at the end the drawn stamp takes its place
  function pictureNode(c, big) {
    var urls = pictureUrls(c);
    if (!urls.length) return stampNode(c);
    var box = el('span', { class: (big ? 'photo photo-big' : 'photo') + (urls[0].indexOf(CORREOS) === 0 ? ' photo-c' : ''), 'aria-hidden': 'true' });
    var img = el('img', { src: urls[0], alt: '', loading: 'lazy', decoding: 'async', width: 247, height: 300 });
    var k = 0;
    img.addEventListener('error', function () {
      k++;
      if (k < urls.length) { box.classList.toggle('photo-c', urls[k].indexOf(CORREOS) === 0); img.src = urls[k]; }
      else if (box.parentNode) box.parentNode.replaceChild(stampNode(c), box);
    });
    box.appendChild(img);
    return box;
  }
  function ink(c) {
    var t = c.topics[0];
    if (t && topicIndex[t] != null) return 'ink-' + (topicIndex[t] % 10);
    var h = 0;
    for (var i = 0; i < c.series.length; i++) h = (h * 31 + c.series.charCodeAt(i)) % 997;
    return 'ink-' + (h % 10);
  }
  function stampNode(c) {
    var f = faces(c.face);
    var face = el('span', { class: 'st-face' }, [f[0] || String(c.year)]);
    if (f.length > 1) face.appendChild(el('small', { text: '+' + (f.length - 1) }));
    return el('span', { class: 'stamp', 'aria-hidden': 'true' }, [
      el('span', { class: 'stamp-in ' + ink(c) }, [
        el('span', { class: 'st-country', text: placeName(c) }),
        face,
        el('span', { class: 'st-title', text: niceSeries(c.series) }),
        el('span', { class: 'st-year', text: String(c.year) })
      ])
    ]);
  }
  function dateOf(c) { return c.date || (c.boe ? c.boe.date : '') || c.dateText || String(c.year); }

  /* ---------- URL hash state ---------- */

  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
    var s = Object.assign({}, DEFAULTS);
    Object.keys(DEFAULTS).forEach(function (k) { if (p.has(k)) s[k] = p.get(k); });
    if (SORTS.indexOf(s.sort) < 0) s.sort = DEFAULTS.sort;
    if (VIEWS.indexOf(s.view) < 0) s.view = DEFAULTS.view;
    if (s.kind && !KIND_LABEL[s.kind]) s.kind = '';
    if (s.terr && !TERR_LABEL[s.terr]) s.terr = '';
    if (s.era && !eraLabel[s.era]) s.era = '';
    if (s.topic && !topicLabel[s.topic]) s.topic = '';
    return { state: s, item: p.get('e') || '' };
  }

  function buildHash(s, item) {
    var p = new URLSearchParams();
    Object.keys(DEFAULTS).forEach(function (k) { if (s[k] && s[k] !== DEFAULTS[k]) p.set(k, s[k]); });
    if (item) p.set('e', item);
    var str = p.toString();
    return str ? '#' + str : '';
  }

  // Filter changes replace the history entry so Back does not step through every keystroke.
  function saveFilters() {
    history.replaceState(null, '', location.pathname + location.search + buildHash(state, currentId));
  }

  /* ---------- filtering and rendering ---------- */

  function applyFilters() {
    var words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var from = parseInt(state.from, 10) || 0;
    var to = parseInt(state.to, 10) || 9999;
    filtered = items.filter(function (c) {
      if (state.era && c.era !== state.era) return false;
      if (c.year < from || c.year > to) return false;
      if (state.kind && c.kind !== state.kind) return false;
      if (state.terr && c.terr !== state.terr) return false;
      if (state.topic && c.topics.indexOf(state.topic) < 0) return false;
      for (var i = 0; i < words.length; i++) if (c._search.indexOf(words[i]) < 0) return false;
      return true;
    });
    var asc = function (a, b) { return dateOf(a) < dateOf(b) ? -1 : dateOf(a) > dateOf(b) ? 1 : a.id < b.id ? -1 : 1; };
    var cmp = state.sort === 'date-asc' ? asc
      : state.sort === 'series' ? function (a, b) { return niceSeries(a.series).localeCompare(niceSeries(b.series), 'es') || asc(a, b); }
      : function (a, b) { return -asc(a, b); };
    if (state.view === 'year' || state.view === 'era') {
      // grouped by time: the groups follow the date order even when sorting by series inside them
      var dir = state.sort === 'date-asc' ? 1 : -1;
      var inner = state.sort === 'series' ? cmp : function (a, b) { return dir * asc(a, b); };
      var eraPos = {};
      ERAS.forEach(function (e, i) { eraPos[e.id] = i; });
      filtered.sort(function (a, b) {
        var ga = state.view === 'year' ? a.year : eraPos[a.era], gb = state.view === 'year' ? b.year : eraPos[b.era];
        return ga !== gb ? (state.sort === 'date-asc' ? ga - gb : gb - ga) : inner(a, b);
      });
    } else filtered.sort(cmp);
  }

  function groupOf(c) {
    if (state.view === 'year') return { key: String(c.year), title: String(c.year) };
    return { key: c.era, title: eraLabel[c.era] };
  }

  function renderGroups() {
    var box = $('groups');
    box.textContent = '';
    var groups = [];
    var last = null;
    if (state.view === 'topic') {
      // an issue with several topics appears under each of them
      TOPICS.forEach(function (t) {
        if (state.topic && t.id !== state.topic) return;
        var list = filtered.filter(function (c) { return c.topics.indexOf(t.id) >= 0; });
        if (list.length) groups.push({ key: t.id, title: t.label, items: list });
      });
      var none = filtered.filter(function (c) { return !c.topics.length; });
      if (none.length && !state.topic) groups.push({ key: '_', title: S.noTopic, items: none });
    } else filtered.forEach(function (c) {
      var g = groupOf(c);
      if (!last || last.key !== g.key) { last = { key: g.key, title: g.title, items: [] }; groups.push(last); }
      last.items.push(c);
    });
    var frag = document.createDocumentFragment();
    groups.forEach(function (g, i) {
      var stamps = 0;
      g.items.forEach(function (c) { stamps += c.count || 0; });
      var sub = plural(g.items.length, S.issue);
      if (stamps) sub += ' · ' + S.atLeast + plural(stamps, S.stamp);
      if (state.view !== 'year') {
        var ys = g.items.map(function (c) { return c.year; });
        sub += ' · ' + Math.min.apply(null, ys) + '–' + Math.max.apply(null, ys);
      }
      var ul = el('ul', { class: 'grid', 'aria-label': g.title });
      g.items.forEach(function (c) { ul.appendChild(cardNode(c)); });
      frag.appendChild(el('section', { class: 'group', 'aria-labelledby': 'g-' + i }, [
        el('h3', { id: 'g-' + i, class: 'group-h' }, [g.title, el('span', { class: 'group-sub', text: sub })]),
        ul
      ]));
    });
    box.appendChild(frag);
  }

  function cardNode(c) {
    var meta = looseDate(c);
    if (c.count) meta += ' · ' + plural(c.count, S.stamp);
    var btn = el('button', { type: 'button', class: 'card-btn', 'data-id': c.id }, [
      esText('span', { class: 'sr-only', text: niceSeries(c.series) + ', ' + (faces(c.face)[0] || '') + '. ' }),
      pictureNode(c),
      el('span', { class: 'card-meta', text: meta }),
      esText('span', { class: 'card-subject', text: niceSeries(c.series) }),
      c.motifs.length ? esText('span', { class: 'card-motifs', text: c.motifs.join(' · ') }) : null,
      c.kind !== 'sellos' ? el('span', { class: 'tag', text: KIND_LABEL[c.kind] }) : null,
      c.terr !== 'espana' ? el('span', { class: 'tag', text: c.terr === 'andorra' ? 'Andorra' : placeName(c).charAt(0) + placeName(c).slice(1).toLowerCase() }) : null
    ]);
    return el('li', { class: firstRender ? 'item hl-rise' : 'item' }, [btn]);
  }

  function renderMore() {
    var grid = $('grid');
    var frag = document.createDocumentFragment();
    var end = Math.min(shown + PAGE, filtered.length);
    for (var i = shown; i < end; i++) frag.appendChild(cardNode(filtered[i]));
    grid.appendChild(frag);
    shown = end;
    $('more').hidden = shown >= filtered.length;
    $('more').textContent = S.more(filtered.length - shown);
  }

  function render() {
    applyFilters();
    var grouped = state.view !== 'all';
    $('grid').hidden = grouped;
    $('groups').hidden = !grouped;
    $('grid').textContent = '';
    shown = 0;
    if (grouped) { renderGroups(); $('more').hidden = true; }
    else renderMore();
    var n = filtered.length;
    $('count').textContent = n === 0 ? S.none : n === items.length ? S.all(n) : S.match(n);
    renderEras();
    firstRender = false;
  }

  function syncControls() {
    $('f-q').value = state.q;
    $('f-era').value = state.era;
    $('f-from').value = state.from;
    $('f-to').value = state.to;
    $('f-kind').value = state.kind;
    $('f-terr').value = state.terr;
    $('f-sort').value = state.sort;
    Array.prototype.forEach.call(document.querySelectorAll('#views button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === state.view));
    });
    Array.prototype.forEach.call(document.querySelectorAll('#topics button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === state.topic));
    });
  }

  /* ---------- eras panel ---------- */

  function renderEras() {
    var box = $('era-list');
    box.textContent = '';
    var counts = {};
    items.forEach(function (c) { counts[c.era] = (counts[c.era] || 0) + 1; });
    ERAS.forEach(function (e) {
      var n = counts[e.id] || 0;
      var kids = [el('span', { class: 'era-name', text: eraLabel[e.id] }), el('span', { class: 'era-range', text: e.range })];
      var node;
      if (n) {
        kids.push(el('span', { class: 'era-count' }, [el('b', { text: String(n) }), n === 1 ? S.issue[0] : S.issue[1]]));
        node = el('button', { type: 'button', class: 'era-btn', 'data-era': e.id, 'aria-pressed': String(state.era === e.id) }, kids);
      } else {
        kids.push(el('span', { class: 'era-count', text: S.preBoe }));
        node = el('a', { class: 'era-btn is-ext', href: FESOFI + e.id + '/', rel: 'noopener' }, kids);
      }
      box.appendChild(el('li', {}, [node]));
    });
  }

  /* ---------- detail dialog ---------- */

  function fact(dl, label, value, spanish) {
    if (!value) return;
    dl.appendChild(spanish ? esText('dt', { text: label }) : el('dt', { text: label }));
    dl.appendChild(spanish ? esText('dd', { text: value }) : el('dd', { text: value }));
  }
  function linkBtn(href, text, primary) {
    return el('li', {}, [el('a', { class: 'btn btn-link' + (primary ? ' btn-primary' : ''), href: href, target: '_blank', rel: 'noopener', text: text })]);
  }

  function showItem(id) {
    var c = byId[id];
    if (!c) return;
    currentId = id;
    var box = $('dlg-content');
    box.textContent = '';

    var info = el('div');
    info.appendChild(esText('h2', { id: 'dlg-title', text: niceSeries(c.series) }));
    info.appendChild(el('p', { text: c.date ? S.issued + longDate(c.date) : c.boe ? S.pubNoDate(longDate(c.boe.date)) : S.issuedIn + looseDate(c) }));
    var tags = el('p', { class: 'dlg-tags' }, [el('span', { class: 'tag', text: KIND_LABEL[c.kind] }), el('span', { class: 'tag', text: eraLabel[c.era] })]);
    if (c.terr !== 'espana') tags.appendChild(el('span', { class: 'tag', text: TERR_LABEL[c.terr] }));
    info.appendChild(tags);

    if (c.topics.length) {
      var tp = el('p', { class: 'dlg-topics' }, [S.topics]);
      c.topics.forEach(function (tid, i) {
        if (i) tp.appendChild(document.createTextNode(' · '));
        tp.appendChild(el('a', { href: buildHash(Object.assign({}, DEFAULTS, { topic: tid }), ''), text: topicLabel[tid] }));
      });
      info.appendChild(tp);
    }

    if (c.text) {
      info.appendChild(el('h3', { text: S.official }));
      info.appendChild(esText('p', { class: 'official', text: c.text }));
    } else if (c.boe) {
      info.appendChild(el('h3', { text: S.titleH }));
      info.appendChild(esText('p', { text: c.boe.title }));
      if (!c.boe.text) info.appendChild(el('p', { text: S.pdfOnly }));
    } else {
      info.appendChild(el('p', { text: S.fesofiOnly(c.year < 1960) }));
    }

    if (c.facts.length) {
      info.appendChild(el('h3', { text: S.techH }));
      var dl = el('dl', { class: 'facts' });
      c.facts.forEach(function (f) { fact(dl, f[0], f[1], true); });
      info.appendChild(dl);
    }

    if (c.stamps.length) {
      // the values of the series, as in the FESOFI catalogue: picture, number, face value and subject, each to its page
      info.appendChild(el('h3', { text: S.stampsH(c.stamps.length) }));
      info.appendChild(el('ul', { class: 'vals' }, c.stamps.map(function (s) {
        var img = el('img', { src: FESOFI_IMG + s.i, alt: '', loading: 'lazy', decoding: 'async', width: 247, height: 300 });
        img.addEventListener('error', function () { img.remove(); });
        return el('li', {}, [el('a', { href: FESOFI_SITE + s.p, target: '_blank', rel: 'noopener' }, [
          s.i ? img : null,
          el('span', { class: 'val-n', text: S.fesofiNo + s.n }),
          s.v ? el('span', { class: 'val-v', text: s.v }) : null,
          s.m ? esText('span', { class: 'val-m', text: s.m }) : null
        ])]);
      })));
    }

    if (c.correos && c.correos.i.length) {
      // the official pictures on the Correos page of the issue
      info.appendChild(el('h3', { text: S.correosH }));
      info.appendChild(el('ul', { class: 'cpics' }, c.correos.i.map(function (p) {
        var img = el('img', { src: correosUrl(p), alt: '', loading: 'lazy', decoding: 'async' });
        var li = el('li', {}, [el('a', { href: CORREOS + c.correos.p, target: '_blank', rel: 'noopener', 'aria-label': S.correosPage }, [img])]);
        img.addEventListener('error', function () { li.remove(); });
        return li;
      })));
    }

    info.appendChild(el('h3', { text: S.sourceH }));
    var src = el('dl', { class: 'facts' });
    if (c.boe) {
      fact(src, S.provision, c.boe.title);
      if (!ES) src.lastChild.setAttribute('lang', 'es');
      fact(src, S.published, longDate(c.boe.date) + ' · ' + c.boe.id);
    }
    if (c.stamps.length) fact(src, c.boe ? S.pics : S.dataPics, S.fesofiCat);
    if (c.correos) fact(src, S.officialPics, S.correosSite);
    info.appendChild(src);
    if (c.corr.length) {
      info.appendChild(el('p', { text: S.corrected }));
      info.appendChild(el('ul', { class: 'corr' }, c.corr.map(function (r) {
        var a = el('a', { href: 'https://www.boe.es/diario_boe/txt.php?id=' + r.id, target: '_blank', rel: 'noopener', text: r.title });
        if (!ES) a.setAttribute('lang', 'es');
        return el('li', {}, [a, ' (' + longDate(r.date) + ')']);
      })));
    }
    var see = el('ul', { class: 'see' });
    if (c.boe) {
      see.appendChild(linkBtn('https://www.boe.es/diario_boe/txt.php?id=' + c.boe.id, S.openBoe, true));
      if (c.boe.pdf) see.appendChild(linkBtn(c.boe.pdf, S.pdf));
    }
    if (c.correos) see.appendChild(linkBtn(CORREOS + c.correos.p, S.correosPage));
    if (c.stamps.length) see.appendChild(linkBtn(FESOFI_SITE + c.stamps[0].p, S.fesofiPage, !c.boe));
    else if (c.terr === 'espana' && !c.correos) see.appendChild(linkBtn(FESOFI + c.era + '/?filter_ano-de-emision=' + c.year, S.yearOnFesofi(c.year)));
    info.appendChild(see);

    var urls = pictureUrls(c);
    var pic = el('div', { class: 'dlg-img' }, [pictureNode(c, true)]);
    if (urls.length) pic.appendChild(el('p', { class: 'pic-src', text: urls[0].indexOf(CORREOS) === 0 ? S.picSrcCorreos : S.picSrc }));
    box.appendChild(pic);
    box.appendChild(info);
    dlg.scrollTop = 0;

    var i = filtered.indexOf(c);
    $('dlg-pos').textContent = i >= 0 ? S.pos(i + 1, filtered.length) : '';
    $('dlg-prev').disabled = i <= 0;
    $('dlg-next').disabled = i < 0 || i >= filtered.length - 1;

    if (!dlg.open) {
      lastFocus = document.activeElement;
      dlg.showModal();
    }
  }

  function go(delta) {
    var i = filtered.indexOf(byId[currentId]) + delta;
    if (i >= 0 && i < filtered.length) location.hash = buildHash(state, filtered[i].id);
  }

  function closeDialog() { if (dlg.open) dlg.close(); }

  dlg.addEventListener('close', function () {
    // Esc or Close button: drop the issue from the hash.
    var wasOpen = currentId;
    currentId = '';
    if (wasOpen && readHash().item) location.hash = buildHash(state, '');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else {
      var b = document.querySelector('.card-btn[data-id="' + wasOpen + '"]');
      if (b) b.focus();
    }
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && !e.altKey) { if (!$('dlg-prev').disabled) go(-1); }
    else if (e.key === 'ArrowRight' && !e.altKey) { if (!$('dlg-next').disabled) go(1); }
  });
  $('dlg-close').addEventListener('click', closeDialog);
  $('dlg-prev').addEventListener('click', function () { go(-1); });
  $('dlg-next').addEventListener('click', function () { go(1); });

  /* ---------- hash sync ---------- */

  function onHash() {
    var h = readHash();
    if (JSON.stringify(h.state) !== JSON.stringify(state)) {
      state = h.state;
      syncControls();
      render();
    }
    if (h.item && byId[h.item]) showItem(h.item);
    else if (dlg.open) { currentId = ''; dlg.close(); }
  }

  /* ---------- setup ---------- */

  function fillSelects() {
    var years = {};
    items.forEach(function (c) { years[c.year] = 1; });
    ERAS.forEach(function (e) { $('f-era').appendChild(el('option', { value: e.id, text: eraLabel[e.id] + ' (' + e.range + ')' })); });
    var ys = Object.keys(years).map(Number).sort(function (a, b) { return a - b; });
    ['f-from', 'f-to'].forEach(function (id) {
      ys.forEach(function (y) { $(id).appendChild(el('option', { value: y, text: y })); });
    });
    hero(ys);
  }

  // pills and the count box at the top, in the format of the other Hobby Lab pages
  function hero(ys) {
    var withText = 0, withPics = 0, lastBoe = '';
    items.forEach(function (c) {
      if (c.text) withText++;
      if (pictureUrls(c).length) withPics++;
      if (c.boe && c.boe.date > lastBoe) lastBoe = c.boe.date;
    });
    var pills = $('pills');
    pills.textContent = '';
    S.pills(ys[0], ys[ys.length - 1], shortDate(lastBoe)).forEach(function (t) { pills.appendChild(el('li', { text: t })); });
    var box = $('hero-count');
    box.textContent = '';
    box.appendChild(el('b', { class: 'hl-num', text: String(items.length) }));
    box.appendChild(el('span', { text: S.countLabel(ys[0], withPics) }));
    box.appendChild(el('small', { text: S.countSmall(withText, TOPICS.length) }));
    box.hidden = false;
    var h = $('hero');
    if (window.HLMotion && h.classList.contains('hl-seen')) window.HLMotion.replay(h);
  }

  function bind() {
    var timer;
    function update() { saveFilters(); render(); }
    $('f-q').addEventListener('input', function (e) {
      state.q = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(update, 200);
    });
    [['f-era', 'era'], ['f-from', 'from'], ['f-to', 'to'], ['f-kind', 'kind'], ['f-terr', 'terr'], ['f-sort', 'sort']].forEach(function (p) {
      $(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; update(); });
    });
    $('views').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]');
      if (!b) return;
      state.view = b.getAttribute('data-view');
      syncControls();
      update();
    });
    $('era-list').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-era]');
      if (!b) return;
      var era = b.getAttribute('data-era');
      state.era = state.era === era ? '' : era;
      syncControls();
      update();
      $('browse').scrollIntoView({ block: 'start' });
    });
    $('filters').addEventListener('submit', function (e) { e.preventDefault(); });
    $('f-reset').addEventListener('click', function () {
      state = Object.assign({}, DEFAULTS);
      syncControls();
      update();
    });
    $('topics').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-topic]');
      if (!b) return;
      var t = b.getAttribute('data-topic');
      state.topic = state.topic === t ? '' : t;
      syncControls();
      update();
    });
    $('more').addEventListener('click', renderMore);
    ['grid', 'groups'].forEach(function (id) {
      $(id).addEventListener('click', function (e) {
        var b = e.target.closest('.card-btn');
        if (b) location.hash = buildHash(state, b.getAttribute('data-id'));
      });
    });
    window.addEventListener('hashchange', onHash);
  }

  function fail(msg) {
    var e = $('error');
    e.textContent = msg;
    e.hidden = false;
    $('count').textContent = '';
  }

  // topic chips: "All topics" plus one per topic with its number of issues
  function fillTopics() {
    var box = $('topics');
    box.textContent = '';
    if (!TOPICS.length) return;
    box.appendChild(el('button', { type: 'button', class: 'chip', 'data-topic': '', 'aria-pressed': 'true', text: S.allTopics }));
    TOPICS.forEach(function (t) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'data-topic': t.id, 'aria-pressed': 'false' }, [t.label, el('small', { text: String(t.count) })]));
    });
    box.hidden = false;
  }

  // topics are optional: without data/topics.json the catalogue works without them
  var topicsReq = fetch('data/topics.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });

  fetch('data/emisiones.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var lm = r.headers.get('Last-Modified');
      if (lm) {
        var d = new Date(lm);
        if (!isNaN(d)) {
          $('generated').textContent = d.toISOString().slice(0, 10);
          $('generated').setAttribute('datetime', d.toISOString());
        }
      }
      return Promise.all([r.json(), topicsReq]);
    })
    .then(function (res) {
      items = res[0];
      var tp = res[1] || { topics: [], items: {} };
      TOPICS = (tp.topics || []).filter(function (t) { return t.count > 0; });
      TOPICS.forEach(function (t, i) { if (ES && t.label_es) t.label = t.label_es; topicLabel[t.id] = t.label; topicIndex[t.id] = i; });
      if (!TOPICS.length) { var tb = document.querySelector('#views [data-view="topic"]'); if (tb) tb.hidden = true; }
      items.forEach(function (c) {
        byId[c.id] = c;
        c.topics = (tp.items && tp.items[c.id]) || [];
        c.motifs = c.motifs || [];
        c.facts = c.facts || [];
        c.corr = c.corr || [];
        c.stamps = c.stamps || [];
        c._search = [c.series, c.motifs.join(' '), c.text || '', c.boe ? c.boe.title : '', c.face || '', String(c.year)]
          .concat(c.stamps.map(function (s) { return (s.m || '') + ' ' + (s.v || '') + ' ' + s.n; }))
          .concat(c.topics.map(function (id) { return topicLabel[id]; })).join(' ').toLowerCase();
      });
      fillTopics();
      fillSelects();
      bind();
      var h = readHash();
      state = h.state;
      syncControls();
      render();
      if (h.item && byId[h.item]) showItem(h.item);
    })
    .catch(function (err) { fail(S.fail(err.message)); });
})();
