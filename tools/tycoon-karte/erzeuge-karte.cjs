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

// Ganz Europa wird gezeichnet (Spielgebiet bleibt W x H): Laender auf den Europa-Ausschnitt klemmen.
const [EX0, EY0] = proj([-12, 71]), [EX1, EY1] = proj([36, 34]);
const klemme = ([x, y]) => [Math.min(EX1, Math.max(EX0, x)), Math.min(EY1, Math.max(EY0, y))];
const imBild = (pts) => pts.some(([x, y]) => x > EX0 && x < EX1 && y > EY0 && y < EY1);
/** Douglas-Peucker fuer geschlossene Ringe (am entferntesten Punkt teilen). */
function dp(pts, tol) {
  if (pts.length < 4) return pts;
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
function vereinfache(pts, tol) {
  let m = 1, max = -1;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > max) { max = d; m = i; } }
  return dp(pts.slice(0, m + 1), tol).concat(dp(pts.slice(m), tol).slice(1));
}
const deutschland = [], ausland = [];
for (const f of g.features) {
  for (const r of ringe(f)) {
    const pts = r.map(proj);
    if (!imBild(pts)) continue;
    const deu = f.properties.ADM0_A3 === 'DEU';
    const k = vereinfache(pts.map(klemme), deu ? 0.25 : 0.8).map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)])
      .filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
    if (k.length < 4) continue;
    (deu ? deutschland : ausland).push(k);
  }
}

const fmt = (rs) => '[\n' + rs.map((r) => '  [' + r.map(([x, y]) => x + ',' + y).join(',') + ']').join(',\n') + ',\n]';
const out = `/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-karte.cjs -- nicht von Hand aendern.
 * Quelle: Natural Earth 1:50m Admin-0 Countries (Public Domain). */
/* eslint-disable */
export const KARTE_W = ${W};
export const KARTE_H = ${H};
export const KARTE_PROJ = { lon0: ${LON0}, lat0: ${LAT0}, s: ${S}, rand: ${RAND}, cos: ${COS} };
/** Europa-Ausschnitt in Weltkoordinaten (Spielgebiet ist 0..KARTE_W x 0..KARTE_H). */
export const EUROPA = { x0: ${EX0.toFixed(1)}, y0: ${EY0.toFixed(1)}, x1: ${EX1.toFixed(1)}, y1: ${EY1.toFixed(1)} };
/** Deutschland (Festland + Inseln) als flache Zahlenlisten x0,y0,x1,y1,... in Weltkoordinaten. */
export const DEUTSCHLAND: number[][] = ${fmt(deutschland)};
/** Alle anderen Laender Europas (auf den Europa-Ausschnitt geklemmt, vereinfacht). */
export const NACHBARN: number[][] = ${fmt(ausland)};
`;
const ziel = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-karte-daten.ts');
fs.writeFileSync(ziel, out);
console.log('geschrieben', ziel, 'W', W, 'H', H, 'DEU-Ringe', deutschland.length, 'Ausland-Ringe', ausland.length, 'Bytes', out.length);
