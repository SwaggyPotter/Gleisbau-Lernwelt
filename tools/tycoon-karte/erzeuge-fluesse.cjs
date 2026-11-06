/**
 * Erzeugt src/app/modules/zusatz/tycoon/tycoon-fluesse-daten.ts aus Natural Earth 1:10m (Public Domain,
 * https://www.naturalearthdata.com/): ne_10m_rivers_lake_centerlines.geojson (grosse Fluesse) und
 * ne_10m_rivers_europe.geojson (europaeische Ergaenzung, kleinere Fluesse).
 * Aufruf: node tools/tycoon-karte/erzeuge-fluesse.cjs <ne_10m_rivers_lake_centerlines.geojson> <ne_10m_rivers_europe.geojson>
 *
 * Projektion wie erzeuge-karte.cjs. Groessenklasse aus scalerank: 1 = Strom (Rhein, Elbe, Donau, Oder ...),
 * 2 = grosser Fluss (Main, Weser, Mosel ...), 3 = Fluss (Neckar, Spree, Saale ...). Sehr kleine (scalerank 12) fallen weg.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LON0 = 3.6, LON1 = 17.8, LAT0 = 56.2, LAT1 = 46.7, S = 115, RAND = 20, COS = Math.cos(51.2 * Math.PI / 180);
const proj = ([lon, lat]) => [(lon - LON0) * COS * S + RAND, (LAT0 - lat) * S + RAND];
// Ganz Europa (Spielgebiet seit 2026-10-28), etwas ueber den Rand hinaus.
const imBild = ([lon, lat]) => lon > -12 && lon < 44 && lat > 34 && lat < 72;

/** Douglas-Peucker fuer offene Linien. */
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / l; if (d > max) { max = d; idx = i; } }
    if (max > tol) { keep[idx] = 1; st.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const klasse = (r) => (r <= 5 ? 1 : r <= 9 ? 2 : 3);

const fluesse = [];
for (const datei of process.argv.slice(2)) {
  const g = JSON.parse(fs.readFileSync(datei, 'utf8'));
  for (const f of g.features) {
    const r = f.properties.scalerank;
    if (r > 11 || f.properties.featurecla === 'Lake Centerline') continue;
    const n = f.properties.name_de || f.properties.name || '';
    if (!n) continue;
    const linien = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const l of linien) {
      // In zusammenhaengende Stuecke innerhalb des Ausschnitts teilen.
      let stueck = [];
      const fertig = () => {
        if (stueck.length >= 2) {
          const p = dp(stueck.map(proj), 0.35).map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]);
          if (p.length >= 2) fluesse.push({ n, k: klasse(r), p });
        }
        stueck = [];
      };
      for (const c of l) { if (imBild(c)) stueck.push(c); else fertig(); }
      fertig();
    }
  }
}

const out = `/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-fluesse.cjs -- nicht von Hand aendern.
 * Quelle: Natural Earth 1:10m Rivers + Lake Centerlines und Rivers Europe (Public Domain). */
/* eslint-disable */
/** Fluesse als Linien: n = Name, k = Groesse (1 Strom, 2 grosser Fluss, 3 Fluss), p = x0,y0,x1,y1,... in Weltkoordinaten. */
export const FLUESSE: { n: string; k: number; p: number[] }[] = [
${fluesse.map((f) => `  { n: ${JSON.stringify(f.n)}, k: ${f.k}, p: [${f.p.map(([x, y]) => x + ',' + y).join(',')}] },`).join('\n')}
];
`;
const ziel = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-fluesse-daten.ts');
fs.writeFileSync(ziel, out);
console.log('geschrieben', ziel, 'Linien', fluesse.length, 'Punkte', fluesse.reduce((a, f) => a + f.p.length, 0), 'Bytes', out.length);
