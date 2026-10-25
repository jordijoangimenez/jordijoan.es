// Downloads the list of Christmas first prizes from Spanish Wikipedia ("Anexo:Sorteo Extraordinario de Navidad", via the
// MediaWiki API) into .cache/wiki-gordo.json: { year: "number" }. It is only used as a check: build.mjs shows a Christmas
// first prize when this number is printed in the BOE's own notice for that year, whose table cannot be checked otherwise.
//   node scripts/fetch-wiki.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const url = 'https://es.wikipedia.org/w/api.php?action=parse&page=Anexo:Sorteo_Extraordinario_de_Navidad&prop=wikitext&format=json&formatversion=2';
const res = await fetch(url, { headers: { 'user-agent': 'loterometro/1.0 (https://jordijoan.es/hobbylab/; personal project)' } });
if (!res.ok) throw new Error('Wikipedia HTTP ' + res.status);
const text = (await res.json()).parse.wikitext;
const out = {};
for (const m of text.matchAll(/^\|\s*(\d{4})\s*\|\|\s*(\d{5})\b/gm)) out[m[1]] ??= m[2];
await mkdir(join(ROOT, '.cache'), { recursive: true });
await writeFile(join(ROOT, '.cache', 'wiki-gordo.json'), JSON.stringify(out, null, 1));
console.log(`${Object.keys(out).length} years, ${Math.min(...Object.keys(out))}–${Math.max(...Object.keys(out))}`);
