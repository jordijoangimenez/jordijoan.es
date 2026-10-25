/* Sellómetro, ATM labels page: the Spanish version of its texts (the HTML is in English; ../shared/lang.js picks the language). */
(function () {
  'use strict';
  var L = window.HLLang || { apply: function () {} };
  var CORREOS_ATM = 'https://www.correos.es/es/es/particulares/filatelia/productos-filatelicos/etiquetas-franqueadoras-atm';
  var GAL = 'https://www.galeriaatm.com/es/';
  function link(path, text, src) { return '<li><a href="' + path + '" rel="noopener">' + text + '<small>' + src + '</small></a></li>'; }
  L.apply({ es: {
    _title: 'Etiquetas ATM · Sellómetro',
    _description: 'Qué son las etiquetas ATM de valor variable, qué máquinas ha usado Correos en España, cómo se lee su código, tarifas y dónde consultar cada emisión.',
    skip: 'Saltar al contenido', sections: 'Secciones', nav_eras: 'Épocas', nav_issues: 'Emisiones', theme: 'Cambiar tema', about: 'Sobre esta página',
    pills: '<li>Etiquetas de franqueo</li><li>Valor variable</li><li>Desde 1980</li>',
    h1: 'Etiquetas ATM',
    sub: 'Las etiquetas de franqueo que imprime una máquina con el valor que se elige en el momento: qué son, qué máquinas ha usado Correos en España, cómo se lee su código y dónde consultar cada emisión. Estas etiquetas no se aprueban en el BOE, así que no forman parte del catálogo de emisiones del Sellómetro.',
    what_h: 'Qué son',
    what_body: '<p><b>ATM</b> viene del alemán <i lang="de">Automatenmarken</i>, «sellos de máquina». Son etiquetas autoadhesivas o engomadas que una máquina expendedora imprime al momento con el valor de franqueo que pide el cliente. El dibujo de fondo puede venir preimpreso en el rollo o imprimirse entero, y el valor y un código se añaden en la impresión. Correos las llama <i>etiquetas franqueadoras</i>; los coleccionistas también hablan de <i>sellos de valor variable</i>.</p>' +
      '<p>Se coleccionan por motivo, por máquina, por valor y por el código que lleva cada etiqueta, que identifica la máquina, el mes y la sesión de compra.</p>',
    hist_h: 'Las máquinas en España', hist_hint: 'Etapas según la clasificación de Galería ATM y la información de Correos',
    timeline: '<li><b>1980–1993</b><span>Emisiones de las máquinas Frama y Epelsa: las básicas de Epelsa, las de cada año y las Frama SG-15.</span></li>' +
      '<li><b>1989–1990</b><span>Emisión de las máquinas Frama.</span></li>' +
      '<li><b>1992–1996</b><span>Máquinas Klüssendorf e IBM, con emisiones especiales como Barcelona 92 y la Expo 92.</span></li>' +
      '<li><b>1992–2007</b><span>Etiquetas térmicas de las máquinas Epelsa y MOBBA. Correos dejó de ofrecer etiquetas en 2006, al retirar las máquinas Epelsa.</span></li>' +
      '<li><b>2003</b><span>Correo Digital (eCarta).</span></li>' +
      '<li><b>2010</b><span>Emisiones de las máquinas ARM.</span></li>' +
      '<li><b>Desde 2016</b><span>Punto Filatélico ATM: una máquina de Correos que imprime etiquetas térmicas autoadhesivas con motivos que cambian según el evento. Se instaló por primera vez en la Feria Nacional del Sello de Madrid, del 21 al 24 de abril de 2016.</span></li>',
    code_h: 'Cómo se lee una etiqueta actual',
    code_body: '<p>Cada etiqueta del Punto Filatélico lleva impresa una secuencia como esta:</p>' +
      '<p class="codebox" aria-label="Ejemplo de código: B9ES16 ES01-0001-001"><span>B</span><span>9</span><span>ES</span><span>16</span><span>ES01</span><span>0001</span><span>001</span></p>' +
      '<dl class="legend"><dt>B</dt><dd>Modalidad de la máquina (en los pedidos por encargo, <code>P</code>)</dd><dt>9</dt><dd>Mes de la compra</dd><dt>ES</dt><dd>País</dd>' +
      '<dt>16</dt><dd>Año</dd><dt>ES01</dt><dd>Número de máquina</dd><dt>0001</dt><dd>Número de sesión, que aumenta con cada compra</dd>' +
      '<dt>001</dt><dd>Número de la etiqueta dentro de la sesión (hasta 875 por sesión)</dd></dl>' +
      '<p>Así cada etiqueta tiene un código que no se repite.</p>',
    tar_h: 'Tarifas y formatos',
    tar_body: '<p>La máquina franquea con las tarifas de Correos de cada año, identificadas por una letra. En 2026 son: <b>A</b> 0,96 €, <b>A2</b> 1,15 €, <b>B</b> 2,00 € y <b>C</b> 2,10 €.</p>' +
      '<ul><li><b>Tira de cuatro etiquetas</b>: una de cada tarifa (A, A2, B y C) o cuatro de la tarifa A.</li>' +
      '<li><b>Etiquetas sueltas</b>: de cualquier tarifa, en la cantidad que se quiera y con el motivo disponible.</li></ul>' +
      '<p>La impresión es térmica y se mantiene legible unos diez años. Las etiquetas recientes miden 55 × 25 mm, y Correos tiene un matasellos especial para ellas.</p>',
    buy_h: 'Dónde se consiguen',
    buy_body: '<ul><li>En <b>ferias y exposiciones</b> filatélicas donde Correos instala el Punto Filatélico, con motivos propios de cada evento.</li>' +
      '<li>En la <b>oficina de Correos de la calle Conde de Peñalver 19, en Madrid</b>, donde la máquina tiene ubicación fija (de lunes a viernes, de 9 a 14 h). Se paga con tarjeta.</li>' +
      '<li><b>Por encargo</b> a Correos, para quien no vaya a una feria, con un importe mínimo de 100 € más el envío. Las condiciones están en la <a href="' + CORREOS_ATM + '" rel="noopener">página de etiquetas ATM de Correos</a>.</li></ul>',
    cat_h: 'Catálogos de emisiones', cat_hint: 'Para ver cada diseño, con imágenes',
    cat_links: link(GAL + '2478-espana-emisiones-atm-2026', 'España 2026', 'Galería ATM') + link(GAL + '2363-espana-emisiones-atm-2025', 'España 2025', 'Galería ATM') +
      link(GAL + '2287-espana-emisiones-atm-2024', 'España 2024', 'Galería ATM') + link(GAL + '2207-espana-emisiones-atm-2023', 'España 2023', 'Galería ATM') +
      link(GAL + '2125-espana-emisiones-atm-2022', 'España 2022', 'Galería ATM') + link(GAL + '2053-espana-emisiones-atm-2021', 'España 2021', 'Galería ATM') +
      link(GAL + '1622-a-partir-de-2016-emisiones-atm-intelligent-ar', 'Punto Filatélico desde 2016', 'Galería ATM') + link(GAL + '99-emisiones-arm', 'Máquinas ARM, 2010', 'Galería ATM') +
      link(GAL + '1621-1992-2007-emisiones-termicas-epelsa-y-mobba', 'Térmicas Epelsa y MOBBA, 1992–2007', 'Galería ATM') +
      link(GAL + '74-1992-1996-emisiones-kluessendorf-ibm', 'Klüssendorf e IBM, 1992–1996', 'Galería ATM') + link(GAL + '76-1989-1990-emision-frama', 'Frama, 1989–1990', 'Galería ATM') +
      link(GAL + '79-1980-1993-etiquetas-postales', 'Frama y Epelsa, 1980–1993', 'Galería ATM') + link(CORREOS_ATM, 'Etiquetas franqueadoras ATM', 'Correos') +
      link('https://www.ateeme.com/', 'Estudio de los sellos de valor variable', 'ATEEME'),
    labels_h: 'Etiquetas emitidas por Correos', labels_loading: 'Cargando etiquetas…', labels_filter: 'Filtrar por tipo',
    note_h: 'Sobre esta página',
    note_body: '<p>El texto es propio y resume la información publicada por Correos y la clasificación por etapas de Galería ATM. La lista de etiquetas viene de las fichas de Filatelia de Correos (título, fecha y lugar de cada una), con sus imágenes mostradas desde correos.es, sin copiarlas. De Galería ATM no se toma nada: se enlaza. Galería ATM es una tienda especializada y ATEEME, un grupo de estudio de los sellos de valor variable; ni ellos ni Correos participan en esta página.</p>',
    foot1: 'Textos: elaboración propia a partir de la información de <a href="' + CORREOS_ATM + '" rel="noopener">Correos</a> (máquina, código, tarifas y dónde comprar) y de la clasificación por etapas de <a href="' + GAL + '56-espana" rel="noopener">Galería ATM</a>. Lista de etiquetas: fichas de Filatelia de Correos, con sus imágenes mostradas desde correos.es. Diseños de las etiquetas: &copy; sus autores y Correos; las imágenes se muestran solo para identificar cada etiqueta (<a href="./#rights">derechos</a>). Esta página no es oficial: consulta siempre en Correos las tarifas y condiciones vigentes (las de esta página son de 2026).',
    foot2: 'Un proyecto de', foot3: 'en', updated: 'Página actualizada:', updated_date: '24 de octubre de 2026'
  } });

  // ---- the labels of the Correos pages (data/atm.json): by year, filtered by kind; pictures shown from correos.es ----
  var ES = L.lang === 'es';
  var CORREOS = 'https://www.correos.es';
  var GROUPS = ES
    ? { ferias: 'Ferias y eventos', 'ubicacion-fija': 'Ubicación fija', 'de-coleccion': 'De colección', 'etiquetas-franqueadoras-2006-1989': '1989–2006' }
    : { ferias: 'Fairs and events', 'ubicacion-fija': 'Permanent machine', 'de-coleccion': 'Collection labels', 'etiquetas-franqueadoras-2006-1989': '1989–2006' };
  var T = ES
    ? { all: 'Todas', count: function (n) { return n + (n === 1 ? ' etiqueta' : ' etiquetas') + ' · abre una para ver su ficha en Correos'; }, none: 'No se han podido cargar las etiquetas.' }
    : { all: 'All', count: function (n) { return n + (n === 1 ? ' label' : ' labels') + ' · open one for its record on Correos'; }, none: 'The labels could not be loaded.' };
  var MONTHS = ES ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var labels = [], group = '';
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) { if (k === 'text') n.textContent = props[k]; else if (k === 'class') n.className = props[k]; else n.setAttribute(k, props[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function day(iso) { if (!iso) return ''; var p = iso.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function card(a) {
    var kids = [];
    if (a.i) {
      var img = el('img', { src: CORREOS + encodeURI(a.i), alt: '', loading: 'lazy', decoding: 'async' });
      var box = el('span', { class: 'atm-pic', 'aria-hidden': 'true' }, [img]);
      img.addEventListener('error', function () { box.remove(); });
      kids.push(box);
    }
    kids.push(el('span', { class: 'card-meta', text: [day(a.d), a.place].filter(Boolean).join(' · ') }));
    var t = el('span', { class: 'card-subject', text: a.t });
    if (!ES) t.setAttribute('lang', 'es');
    kids.push(t);
    return el('li', {}, [el('a', { class: 'atm-card', href: CORREOS + a.p, target: '_blank', rel: 'noopener' }, kids)]);
  }
  function render() {
    var box = document.getElementById('atm-list');
    box.textContent = '';
    var list = labels.filter(function (a) { return !group || a.g === group; });
    var years = {};
    list.forEach(function (a) { var y = (a.d || '').slice(0, 4) || '–'; (years[y] = years[y] || []).push(a); });
    Object.keys(years).sort().reverse().forEach(function (y, i) {
      box.appendChild(el('section', { class: 'group', 'aria-labelledby': 'ay-' + i }, [
        el('h3', { id: 'ay-' + i, class: 'group-h', text: y }),
        el('ul', { class: 'grid atm-grid', 'aria-label': y }, years[y].map(card))
      ]));
    });
    document.getElementById('atm-count').textContent = T.count(list.length);
    Array.prototype.forEach.call(document.querySelectorAll('#atm-groups button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === group)); });
  }
  fetch('data/atm.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (data) {
    labels = data;
    var counts = {};
    labels.forEach(function (a) { counts[a.g] = (counts[a.g] || 0) + 1; });
    var chips = document.getElementById('atm-groups');
    chips.appendChild(el('button', { type: 'button', class: 'chip', 'data-g': '', 'aria-pressed': 'true', text: T.all }));
    Object.keys(GROUPS).forEach(function (g) {
      if (counts[g]) chips.appendChild(el('button', { type: 'button', class: 'chip', 'data-g': g, 'aria-pressed': 'false' }, [GROUPS[g], el('small', { text: String(counts[g]) })]));
    });
    chips.hidden = false;
    chips.addEventListener('click', function (e) { var b = e.target.closest('button[data-g]'); if (!b) return; group = b.getAttribute('data-g'); render(); });
    render();
  }).catch(function () { document.getElementById('atm-count').textContent = T.none; });
})();
