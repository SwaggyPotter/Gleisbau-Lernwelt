/**
 * Holt die echten Stadtbezirke (Namen + Grenzen) der 38 Tycoon-Staedte aus OpenStreetMap (Overpass API)
 * und schreibt src/app/modules/zusatz/tycoon/tycoon-bezirke-daten.ts.
 *
 * Daten: (c) OpenStreetMap-Mitwirkende, ODbL 1.0 (https://www.openstreetmap.org/copyright).
 * Die erzeugte Datei ist eine abgeleitete Datenbank und steht damit ebenfalls unter ODbL.
 *
 * Aufruf: node tools/tycoon-karte/hole-bezirke.cjs <cache-ordner>
 *   Rohantworten werden im Cache-Ordner abgelegt (erneuter Lauf fragt nur Fehlendes ab).
 *   Bei ueberlastetem Server wird mit wachsender Pause erneut versucht.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CACHE = process.argv[2];
if (!CACHE) { console.error('Cache-Ordner fehlt'); process.exit(2); }
fs.mkdirSync(CACHE, { recursive: true });

// Reihenfolge = CITIES in tycoon-karte.ts. wikidata = Stadt (bei Bruessel: Region Bruessel-Hauptstadt).
const STAEDTE = [
  ['Berlin', 'Q64'], ['Hamburg', 'Q1055'], ['Rostock', 'Q2861'], ['Hannover', 'Q1715'], ['Leipzig', 'Q2079'],
  ['Dresden', 'Q1731'], ['Dortmund', 'Q1295'], ['Köln', 'Q365'], ['Frankfurt', 'Q1794'], ['Nürnberg', 'Q2090'],
  ['Stuttgart', 'Q1022'], ['München', 'Q1726'], ['Bremen', 'Q24879'], ['Kiel', 'Q1707'], ['Magdeburg', 'Q1733'],
  ['Erfurt', 'Q1729'], ['Kassel', 'Q2865'], ['Münster', 'Q2742'], ['Mannheim', 'Q2119'], ['Karlsruhe', 'Q1040'],
  ['Freiburg', 'Q2833'], ['Augsburg', 'Q2749'], ['Regensburg', 'Q2978'], ['Würzburg', 'Q2999'], ['Saarbrücken', 'Q1724'],
  ['Kopenhagen', 'Q1748'], ['Amsterdam', 'Q727'], ['Brüssel', 'Q240'], ['Luxemburg', 'Q1842'], ['Straßburg', 'Q6602'],
  ['Zürich', 'Q72'], ['Innsbruck', 'Q1735'], ['Salzburg', 'Q34713'], ['Wien', 'Q1741'], ['Prag', 'Q1085'],
  ['Breslau', 'Q1799'], ['Posen', 'Q268'], ['Stettin', 'Q393'],
];
/** Oertliche Namen fuer die Ersatzsuche, falls die Wikidata-ID keine Flaeche liefert. */
const LOKAL = { Kopenhagen: 'København', 'Brüssel': 'Région de Bruxelles-Capitale - Brussels Hoofdstedelijk Gewest', Luxemburg: 'Luxembourg',
  'Straßburg': 'Strasbourg', Prag: 'Praha', Breslau: 'Wrocław', Posen: 'Poznań', Stettin: 'Szczecin' };
const SERVER = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(abfrage, datei) {
  const ziel = path.join(CACHE, datei);
  if (fs.existsSync(ziel)) return JSON.parse(fs.readFileSync(ziel, 'utf8'));
  // NUR_CACHE=1: nichts abfragen (Vorschau aus dem bisher Geladenen).
  if (process.env.NUR_CACHE) return null;
  let pause = 20000;
  for (let versuch = 0; versuch < 40; versuch++) {
    const url = SERVER[versuch % SERVER.length];
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Gleisbau-Lernwelt/1.0 (Lern-App, einmaliger Abruf)' },
        body: 'data=' + encodeURIComponent(abfrage),
      });
      const text = await r.text();
      if (r.ok && text.trim().startsWith('{')) {
        fs.writeFileSync(ziel, text);
        await warte(4000);
        return JSON.parse(text);
      }
      console.log('  belegt (' + r.status + ') bei ' + url + ', warte ' + pause / 1000 + ' s');
    } catch (e) {
      console.log('  Netzfehler ' + e.message + ', warte ' + pause / 1000 + ' s');
    }
    await warte(pause);
    pause = Math.min(pause * 1.5, 180000);
  }
  throw new Error('Overpass nicht erreichbar: ' + datei);
}

/* ---------- Projektion wie tycoon-karte-daten.ts ---------- */
const daten = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-karte-daten.ts'), 'utf8');
const P = JSON.parse(daten.match(/KARTE_PROJ = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
const proj = (lat, lon) => [(lon - P.lon0) * P.cos * P.s + P.rand, (P.lat0 - lat) * P.s + P.rand];

/* ---------- Ringe aus Wegen zusammensetzen ---------- */
const gleich = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
function ringe(rel) {
  const wege = rel.members.filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry).map((m) => m.geometry.map((g) => [g.lat, g.lon]));
  const out = [];
  while (wege.length) {
    let ring = wege.shift();
    let weiter = true;
    while (weiter && !gleich(ring[0], ring[ring.length - 1])) {
      weiter = false;
      for (let i = 0; i < wege.length; i++) {
        const w = wege[i], ende = ring[ring.length - 1];
        if (gleich(w[0], ende)) ring = ring.concat(w.slice(1));
        else if (gleich(w[w.length - 1], ende)) ring = ring.concat(w.slice().reverse().slice(1));
        else continue;
        wege.splice(i, 1); weiter = true; break;
      }
    }
    if (ring.length >= 4) out.push(ring);
  }
  return out;
}
const flaeche = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };

/**
 * Geschlossenen Ring vereinfachen: Anfang und Ende sind derselbe Punkt (Bezugslinie der Laenge 0), deshalb am
 * entferntesten Punkt teilen und beide Haelften einzeln mit Douglas-Peucker vereinfachen.
 */
function vereinfacheRing(pts, tol) {
  let m = 1, max = -1;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > max) { max = d; m = i; } }
  const a = vereinfache(pts.slice(0, m + 1), tol), b = vereinfache(pts.slice(m), tol);
  return a.concat(b.slice(1));
}

/** Douglas-Peucker in Weltkoordinaten (offene Linie). */
function vereinfache(pts, tol) {
  if (pts.length < 4) return pts;
  const behalten = new Uint8Array(pts.length); behalten[0] = behalten[pts.length - 1] = 1;
  const stapel = [[0, pts.length - 1]];
  while (stapel.length) {
    const [a, b] = stapel.pop();
    let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / l; if (d > max) { max = d; idx = i; } }
    if (max > tol) { behalten[idx] = 1; stapel.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => behalten[i]);
}

(async () => {
  const ergebnis = [];
  for (let i = 0; i < STAEDTE.length; i++) {
    const [name, qid] = STAEDTE[i];
    console.log(i + ' ' + name + ' (' + qid + ')');
    let flaeche_ = `rel["wikidata"="${qid}"]["boundary"="administrative"];map_to_area->.a;`;
    let tags = await overpass(`[out:json][timeout:90];${flaeche_}rel(area.a)["boundary"="administrative"]["admin_level"~"^(8|9|10|11)$"];out tags;`, i + '-tags.json');
    if (tags && !tags.elements.length) {
      // Ersatz: Flaeche ueber den oertlichen Namen suchen.
      flaeche_ = `rel["name"="${LOKAL[name] || name}"]["boundary"="administrative"]["admin_level"~"^(4|5|6|7|8)$"];map_to_area->.a;`;
      tags = await overpass(`[out:json][timeout:90];${flaeche_}rel(area.a)["boundary"="administrative"]["admin_level"~"^(8|9|10|11)$"];out tags;`, i + '-tags-name.json');
      console.log('  Ersatzsuche ueber Namen: ' + (tags ? tags.elements.length : 0) + ' Treffer');
    }
    if (!tags) { ergebnis.push({ stadt: i, name, bezirke: [] }); continue; }
    const jeEbene = {};
    tags.elements.forEach((e) => { const l = e.tags.admin_level; (jeEbene[l] = jeEbene[l] || []).push(e); });
    // Ebene mit sinnvoller Bezirksanzahl (3..30), bevorzugt nah an 12, bei Gleichstand die groebere.
    const kandidaten = Object.entries(jeEbene).filter(([, l]) => l.length >= 3 && l.length <= 30);
    if (!kandidaten.length) { console.log('  keine passende Ebene: ' + JSON.stringify(Object.fromEntries(Object.entries(jeEbene).map(([k, v]) => [k, v.length])))); ergebnis.push({ stadt: i, name, bezirke: [] }); continue; }
    kandidaten.sort((a, b) => Math.abs(a[1].length - 12) - Math.abs(b[1].length - 12) || +a[0] - +b[0]);
    const ebene = kandidaten[0][0];
    const geo = await overpass(`[out:json][timeout:120];${flaeche_}rel(area.a)["boundary"="administrative"]["admin_level"="${ebene}"];out geom;`, i + '-geom-' + ebene + (flaeche_.includes('wikidata') ? '' : '-name') + '.json');
    if (!geo) { ergebnis.push({ stadt: i, name, bezirke: [] }); continue; }
    const bezirke = [];
    for (const rel of geo.elements) {
      const rs = ringe(rel).map((r) => r.map(([la, lo]) => proj(la, lo)));
      if (!rs.length) continue;
      const groesste = Math.max(...rs.map(flaeche));
      const behalten = rs.filter((r) => flaeche(r) > groesste * 0.05).map((r) => vereinfacheRing(r, 0.12));
      bezirke.push({
        n: (rel.tags['name:de'] || rel.tags.name || '?').replace(/^Ortsbeirat\s*\d+\s*:\s*/i, '').trim(),
        osm: rel.id,
        ringe: behalten.map((r) => r.flatMap(([x, y]) => [+x.toFixed(1), +y.toFixed(1)])),
        f: +behalten.reduce((a, r) => a + flaeche(r), 0).toFixed(1),
      });
    }
    bezirke.sort((a, b) => a.n.localeCompare(b.n, 'de'));
    console.log('  Ebene ' + ebene + ': ' + bezirke.length + ' Bezirke: ' + bezirke.map((b) => b.n).join(', '));
    ergebnis.push({ stadt: i, name, ebene: +ebene, bezirke });
  }
  const ziel = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-bezirke-daten.ts');
  const zeilen = ergebnis.map((s) => '  // ' + s.name + (s.ebene ? ' (admin_level ' + s.ebene + ')' : ' (keine Daten)') + '\n  ' + JSON.stringify(s.bezirke.map((b) => ({ n: b.n, osm: b.osm, f: b.f, r: b.ringe }))));
  fs.writeFileSync(ziel, `/* Automatisch erzeugt von tools/tycoon-karte/hole-bezirke.cjs -- nicht von Hand aendern.
 * Stadtbezirke: (c) OpenStreetMap-Mitwirkende, ODbL 1.0 (https://www.openstreetmap.org/copyright).
 * Diese Datei ist eine abgeleitete Datenbank und steht unter der ODbL 1.0.
 * Je Stadt (Index wie CITIES): Bezirke mit Name n, OSM-Relation osm, Flaeche f (Weltkoordinaten^2), Ringe r (x0,y0,x1,y1,...). */
/* eslint-disable */
export const STADT_BEZIRKE: { n: string; osm: number; f: number; r: number[][] }[][] = [
${zeilen.join(',\n')},
];
`);
  console.log('geschrieben: ' + ziel + ' (' + fs.statSync(ziel).size + ' Bytes)');
})();
