/**
 * Erzeugt src/app/modules/zusatz/tycoon/tycoon-karte-daten.ts aus Natural Earth 1:50m
 * (ne_50m_admin_0_countries.geojson, Public Domain, https://www.naturalearthdata.com/).
 * Aufruf: node tools/tycoon-karte/erzeuge-karte.cjs <pfad/zu/ne_50m_admin_0_countries.geojson>
 *
 * Kartenausschnitt: Deutschland mit Nachbarlaendern (Amsterdam bis Breslau, Kopenhagen bis Zuerich/Wien).
 * Projektion (muss zu tycoon-karte.ts passen): x = (lon - LON0) * cos(51.2°) * S + RAND,
 * y = (LAT0 - lat) * S + RAND. Laender werden auf das Kartenrechteck (plus Rand) geklemmt.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LON0 = 3.6, LON1 = 17.8, LAT0 = 56.2, LAT1 = 46.7, S = 115, RAND = 20, COS = Math.cos(51.2 * Math.PI / 180);
const W = Math.round((LON1 - LON0) * COS * S + 2 * RAND);
const H = Math.round((LAT0 - LAT1) * S + 2 * RAND);
const proj = ([lon, lat]) => [+((lon - LON0) * COS * S + RAND).toFixed(1), +((LAT0 - lat) * S + RAND).toFixed(1)];

const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ringe = (f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((p) => p[0]);

const M = 80; // Klemmrand ausserhalb der Karte
const klemme = ([x, y]) => [Math.min(W + M, Math.max(-M, x)), Math.min(H + M, Math.max(-M, y))];
const imBild = (pts) => pts.some(([x, y]) => x > -M && x < W + M && y > -M && y < H + M);
const deutschland = [], ausland = [];
for (const f of g.features) {
  for (const r of ringe(f)) {
    const pts = r.map(proj);
    if (!imBild(pts)) continue;
    const k = pts.map(klemme).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
    if (k.length < 3) continue;
    (f.properties.ADM0_A3 === 'DEU' ? deutschland : ausland).push(k);
  }
}

const fmt = (rs) => '[\n' + rs.map((r) => '  [' + r.map(([x, y]) => x + ',' + y).join(',') + ']').join(',\n') + ',\n]';
const out = `/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-karte.cjs -- nicht von Hand aendern.
 * Quelle: Natural Earth 1:50m Admin-0 Countries (Public Domain). */
/* eslint-disable */
export const KARTE_W = ${W};
export const KARTE_H = ${H};
export const KARTE_PROJ = { lon0: ${LON0}, lat0: ${LAT0}, s: ${S}, rand: ${RAND}, cos: ${COS} };
/** Deutschland (Festland + Inseln) als flache Zahlenlisten x0,y0,x1,y1,... in Weltkoordinaten. */
export const DEUTSCHLAND: number[][] = ${fmt(deutschland)};
/** Alle anderen Laender im Ausschnitt, auf das Kartenrechteck geklemmt. */
export const NACHBARN: number[][] = ${fmt(ausland)};
`;
const ziel = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-karte-daten.ts');
fs.writeFileSync(ziel, out);
console.log('geschrieben', ziel, 'W', W, 'H', H, 'DEU-Ringe', deutschland.length, 'Ausland-Ringe', ausland.length, 'Bytes', out.length);
