/**
 * Erzeugt src/app/modules/zusatz/tycoon/tycoon-einwohner-daten.ts: Einwohnerzahl je Tycoon-Gebiet.
 *
 * Quelle: Wikidata (CC0, gemeinfrei -- auch kommerziell ohne Auflagen nutzbar), Eigenschaft P1082 (Einwohnerzahl),
 * je Gebiet der neueste Wert (Stichtag P585). Zuordnung:
 *   Deutschland: NUTS-3-Code (P605), Berlin/Hamburg-Bezirke: OSM-Relation (P402),
 *   Ausland: ISO-3166-2-Code (P300) der Natural-Earth-Region (Kennung wie in erzeuge-gebiete.cjs).
 *
 * Aufruf: node tools/tycoon-karte/erzeuge-einwohner.cjs <pfad/zu/gebiete-topo.json>
 * (dieselbe Datei wie fuer erzeuge-gebiete.cjs; Internetzugang noetig)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const UA = 'GleisbauLernwelt/1.0 (+https://app.gleisbau-digital.org)';
const sparql = async (q) => {
  const r = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST', headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'query=' + encodeURIComponent(q),
  });
  if (!r.ok) throw new Error('Wikidata ' + r.status);
  return (await r.json()).results.bindings;
};
/** Neuester Wert je Schluessel (ohne Stichtag zaehlt der Wert als aeltester). */
const neueste = (zeilen, key) => {
  const m = new Map();
  for (const z of zeilen) {
    const k = z[key].value, pop = Math.round(+z.pop.value), d = z.datum ? z.datum.value : '0000';
    const alt = m.get(k);
    if (!alt || d > alt.d || (d === alt.d && pop > alt.pop)) m.set(k, { pop, d });
  }
  return m;
};

/** Natural Earth fuehrt fuer Tschechien und Polen noch die alten Buchstaben-Codes; Wikidata die aktuellen Zahlen-Codes. */
const ISO_NEU = {
  'CZ-PR': 'CZ-10', 'CZ-ST': 'CZ-20', 'CZ-JC': 'CZ-31', 'CZ-PL': 'CZ-32', 'CZ-KA': 'CZ-41', 'CZ-US': 'CZ-42', 'CZ-LI': 'CZ-51', 'CZ-KR': 'CZ-52',
  'CZ-PA': 'CZ-53', 'CZ-VY': 'CZ-63', 'CZ-JM': 'CZ-64', 'CZ-OL': 'CZ-71', 'CZ-ZL': 'CZ-72', 'CZ-MO': 'CZ-80',
  'PL-DS': 'PL-02', 'PL-KP': 'PL-04', 'PL-LU': 'PL-06', 'PL-LB': 'PL-08', 'PL-LD': 'PL-10', 'PL-MA': 'PL-12', 'PL-MZ': 'PL-14', 'PL-OP': 'PL-16',
  'PL-PK': 'PL-18', 'PL-PD': 'PL-20', 'PL-PM': 'PL-22', 'PL-SL': 'PL-24', 'PL-SK': 'PL-26', 'PL-WN': 'PL-28', 'PL-WP': 'PL-30', 'PL-ZP': 'PL-32',
};
/** Kennungen der Auslandsregionen wie in erzeuge-gebiete.cjs -> ISO-3166-2-Code. */
const auslandIso = (topoPfad) => {
  const topo = JSON.parse(fs.readFileSync(topoPfad, 'utf8'));
  const ausland = Object.values(topo.objects)[0].geometries.filter((g) => g.properties.iso_a2).map((g) => g.properties)
    .sort((a, b) => (a.iso_3166_2 < b.iso_3166_2 ? -1 : 1));
  const teile = new Map(), out = new Map();
  for (const p of ausland) {
    const land = p.iso_a2;
    if (!teile.has(land)) teile.set(land, [...new Set(ausland.filter((q) => q.iso_a2 === land).map((q) => q.region || ''))].sort());
    const t = teile.get(land).indexOf(p.region || '');
    const nr = ausland.filter((q) => q.iso_a2 === land).indexOf(p);
    out.set(land + t.toString(36).toUpperCase() + 'X' + nr.toString(36).toUpperCase().padStart(2, '0'), ISO_NEU[p.iso_3166_2] || p.iso_3166_2);
  }
  return out;
};

(async () => {
  const iso = auslandIso(process.argv[2]);
  const de = neueste(await sparql('SELECT ?nuts ?pop ?datum WHERE { ?item wdt:P605 ?nuts . FILTER(STRSTARTS(?nuts,"DE") && STRLEN(?nuts)=5) ?item p:P1082 ?st . ?st ps:P1082 ?pop . OPTIONAL { ?st pq:P585 ?datum } }'), 'nuts');
  const bez = neueste(await sparql('SELECT ?osm ?pop ?datum WHERE { VALUES ?land { wd:Q64 wd:Q1055 } ?item wdt:P131 ?land ; wdt:P402 ?osm . ?item p:P1082 ?st . ?st ps:P1082 ?pop . OPTIONAL { ?st pq:P585 ?datum } }'), 'osm');
  const aus = neueste(await sparql('SELECT ?iso ?pop ?datum WHERE { VALUES ?iso { ' + [...iso.values()].map((i) => '"' + i + '"').join(' ') + ' } ?item wdt:P300 ?iso . ?item p:P1082 ?st . ?st ps:P1082 ?pop . OPTIONAL { ?st pq:P585 ?datum } }'), 'iso');
  const daten = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon');
  const roh = fs.readFileSync(path.join(daten, 'tycoon-gebiete-daten.ts'), 'utf8'), bezRoh = fs.readFileSync(path.join(daten, 'tycoon-bezirke-daten.ts'), 'utf8');
  const ids = [...roh.matchAll(/"id":"([A-Z0-9]+)"/g)].map((m) => m[1]);
  const osm = [...bezRoh.matchAll(/"osm":(\d+)/g)].map((m) => m[1]);
  const out = {}, fehlt = [];
  for (const id of new Set(ids)) {
    if (id === 'DE300' || id === 'DE600') continue;
    const w = id.length === 5 ? de.get(id) : aus.get(iso.get(id));
    if (w) out[parseInt(id, 36)] = w.pop; else fehlt.push(id);
  }
  for (const o of osm) { const w = bez.get(o); if (w) out[o] = w.pop; else fehlt.push('osm' + o); }
  // Deutsche Kreise ohne passenden NUTS-Code in Wikidata: ueber den Namen suchen (Landkreis in Deutschland, Q106658).
  const deFehlt = fehlt.filter((id) => id.length === 5 && id.startsWith('DE'));
  if (deFehlt.length) {
    const namen = new Map(deFehlt.map((id) => [id, (roh.match(new RegExp('"id":"' + id + '","n":"([^"]+)"')) || [])[1]]));
    const z = await sparql('SELECT ?name ?pop ?datum WHERE { VALUES ?name { ' + [...namen.values()].filter((n) => n).map((n) => '"' + n + '"@de "Landkreis ' + n + '"@de').join(' ') +
      ' } ?item rdfs:label ?name ; wdt:P31 wd:Q106658 . ?item p:P1082 ?st . ?st ps:P1082 ?pop . OPTIONAL { ?st pq:P585 ?datum } }');
    const nachName = neueste(z.map((r) => ({ ...r, name: { value: r.name.value.replace(/^Landkreis /, '') } })), 'name');
    for (const [id, n] of namen) { const w = n && nachName.get(n); if (w) { out[parseInt(id, 36)] = w.pop; fehlt.splice(fehlt.indexOf(id), 1); } }
  }
  const ts = '/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-einwohner.cjs -- nicht von Hand aendern.\n' +
    ' * Einwohnerzahlen: Wikidata (CC0), je Gebiet der neueste Wert. Schluessel = Gebiet.id (tycoon-gebiete.ts). */\n/* eslint-disable */\n' +
    'export const EINWOHNER: Record<number, number> = ' + JSON.stringify(out) + ';\n';
  fs.writeFileSync(path.join(daten, 'tycoon-einwohner-daten.ts'), ts);
  console.log('Gebiete mit Einwohnern:', Object.keys(out).length, '· ohne:', fehlt.length, fehlt.slice(0, 20).join(' '));
})().catch((e) => { console.error(e); process.exit(1); });
