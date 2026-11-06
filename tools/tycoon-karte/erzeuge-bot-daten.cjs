/**
 * Erzeugt backend/src/tycoon-bots-daten.ts: kompakte Gebietsliste fuer die Tycoon-Bots auf dem Server
 * (Kennung, Land, Einwohner, Grundpreis, Punkt im Inneren, Nachbarn) -- aus denselben Daten wie das Spiel
 * (src/app/modules/zusatz/tycoon/tycoon-gebiete.ts). Nach jeder Aenderung der Gebiete neu ausfuehren:
 *   node tools/tycoon-karte/erzeuge-bot-daten.cjs
 */
const { buildSync } = require('esbuild');
const fs = require('fs');
const os = require('os');
const path = require('path');

const wurzel = path.resolve(__dirname, '../..');
const tmp = path.join(os.tmpdir(), 'tycoon-gebiete-bundle.cjs');
buildSync({ entryPoints: [path.join(wurzel, 'src/app/modules/zusatz/tycoon/tycoon-gebiete.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: tmp, logLevel: 'error' });
const { GEBIETE, innererPunkt, nachbarn } = require(tmp);

const t0 = Date.now();
const zeilen = GEBIETE.map((g) => {
  const p = innererPunkt(g);
  return [g.id.toString(36), g.land, g.ew, g.basis, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, g.staedte.length ? 1 : 0, nachbarn(g.id).map((n) => n.toString(36)).join(';')].join(',');
});
const kopf = `/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-bot-daten.cjs -- nicht von Hand aendern.
 * Je Gebiet: Kennung (Basis 36), Land, Einwohner, Grundpreis, Punkt im Inneren x, y (Weltkoordinaten wie im Spiel),
 * Spielstadt darin (1/0), Nachbarn (Kennungen Basis 36, mit ; getrennt). Quelle: tycoon-gebiete.ts im Frontend. */
export const BOT_GEBIETE = `;
fs.writeFileSync(path.join(wurzel, 'backend/src/tycoon-bots-daten.ts'), kopf + JSON.stringify(zeilen.join('|')) + ';\n');
console.log(GEBIETE.length, 'Gebiete,', Date.now() - t0, 'ms');
