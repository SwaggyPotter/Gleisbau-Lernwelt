/**
 * Erzeugt src/app/modules/zusatz/tycoon/tycoon-gebiete-daten.ts: alle kaufbaren Gebiete des Tycoon.
 * Deutschland = die 400 Landkreise und kreisfreien Staedte, dazu Regionen (Departements, Provinzen, Kantone,
 * Woiwodschaften ...) der Nachbarlaender im Kartenausschnitt. Berlin und Hamburg werden zur Laufzeit durch ihre
 * Bezirke ersetzt (tycoon-bezirke-daten.ts, OSM).
 *
 * Quellen (beide auch kommerziell nutzbar):
 *   Deutschland: BKG VG250 (Ebenen, Stand 01.01.), Ebene VG250_KRS, Datenlizenz Deutschland - Namensnennung 2.0,
 *     "© GeoBasis-DE / BKG (Jahr)". https://daten.gdz.bkg.bund.de/produkte/vg/vg250_ebenen_0101/aktuell/
 *     Als Kennung dient das Feld NUTS (gleiche IDs wie frueher mit Eurostat-Daten, Spielstaende bleiben gueltig).
 *   Ausland (seit 2026-10-28 ganz Europa): geoBoundaries gbOpen, aufbereitet mit erzeuge-europa.cjs (Lizenzen dort).
 *
 * Vorbereitung mit mapshaper (npx mapshaper), im Ordner mit den entpackten Daten:
 *   npx mapshaper -i VG250_KRS.shp -filter "GF==4" -each "A=this.area" -sort A descending  *     -dissolve NUTS copy-fields=GEN,BEZ -proj wgs84 -o format=geojson de.geojson
 *   npx mapshaper -i de.geojson ne_10m_admin_1_states_provinces.shp combine-files -rename-layers de,aus  *     -filter target=aus "<LAENDER ohne DE>.indexOf(iso_a2)>=0" -filter-fields target=aus iso_a2,name,name_de,region,iso_3166_2  *     -erase target=aus de -merge-layers target=de,aus force name=alle -clean gap-fill-area=20km2  *     -o format=topojson quantization=1000000 gebiete-topo.json
 * (-erase/-clean: die groben Natural-Earth-Grenzen werden an die genaue deutsche Grenze angepasst, Luecken gefuellt.)
 *
 * Seit 2026-10-28 (ganz Europa, aus.geojson von erzeuge-europa.cjs):
 *   npx mapshaper -i de.geojson aus.geojson combine-files -rename-layers de,aus -dissolve uid target=aus copy-fields=land,reg,rname,n sum-fields=ew
 *     -erase target=aus de -merge-layers target=de,aus force name=alle -clean gap-fill-area=30km2
 *     -o format=topojson quantization=2000000 europa-topo.json
 *
 * Aufruf: node tools/tycoon-karte/erzeuge-gebiete.cjs <pfad/zu/europa-topo.json> [Vereinfachung Ausland, Standard 0.9]
 *
 * Die Grenzen bleiben als gemeinsame Boegen (TopoJSON-Arcs) erhalten: jeder Bogen wird nur einmal vereinfacht,
 * deshalb passen Nachbargebiete ohne Luecken aneinander. Je Bogen wird die Grenzart gespeichert
 * (1 = Kreis, 2 = Bundesland/Landesteil, 3 = Staat/Kueste) fuer unterschiedlich kraeftige Linien.
 */
'use strict';
const fs = require('fs');
const path = require('path');


/* ---------- Projektion wie tycoon-karte-daten.ts ---------- */
const kartenDatei = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-karte-daten.ts'), 'utf8');
const P = JSON.parse(kartenDatei.match(/KARTE_PROJ = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
const proj = (lon, lat) => [(lon - P.lon0) * P.cos * P.s + P.rand, (P.lat0 - lat) * P.s + P.rand];

const topo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const { scale, translate } = topo.transform;
/** Boegen entpacken (Delta-Kodierung + Transform) und projizieren. */
const boegen = topo.arcs.map((a) => {
  let x = 0, y = 0;
  return a.map(([dx, dy]) => { x += dx; y += dy; return proj(x * scale[0] + translate[0], y * scale[1] + translate[1]); });
});
const bogenPunkte = (ref) => (ref >= 0 ? boegen[ref] : boegen[~ref].slice().reverse());
const ringPunkte = (refs) => refs.flatMap((r, i) => (i ? bogenPunkte(r).slice(1) : bogenPunkte(r)));
const flaeche = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };

/* ---------- Gebiete auswaehlen ---------- */
const geoms = Object.values(topo.objects)[0].geometries;
/**
 * Auslaendische Gebiete (seit 2026-10-28): 6-stellige Kennung "<Land>Y<Nr>" (Nr Basis 36, 3 Stellen). Das Y an
 * 3. Stelle unterscheidet sie von den alten Natural-Earth-Kennungen ("<Land><Teil>X<Nr>", Teil 0..F) und von den
 * 5-stelligen NUTS-IDs; als Zahl zur Basis 36 passen sie in eine Postgres-integer-Spalte. Region (bl) = "<Land>" +
 * Regionsnummer (2 Stellen Basis 36), 4 Zeichen, also nie gleich einem deutschen NUTS-1-Kuerzel.
 */
const auslandId = (p) => p.land + 'Y' + (+p.uid.split(':')[1]).toString(36).toUpperCase().padStart(3, '0');
const auslandBl = (p) => p.land + (+p.reg).toString(36).toUpperCase().padStart(2, '0');
const regionen = {};
const gebiete = [];
for (const g of geoms) {
  const p = g.properties;
  const land = p.land || 'DE';
  const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  // Ringe (inkl. Loecher, gezeichnet wird mit evenodd); winzige Inseln weglassen, das groesste Teil bleibt immer.
  let ringe = polys.flat().map((refs) => ({ refs, f: flaeche(ringPunkte(refs)) }));
  if (!ringe.length) continue;
  const fmax = Math.max(...ringe.map((r) => r.f));
  ringe = ringe.filter((r) => r.f === fmax || r.f > 3);
  const pts = ringe.flatMap((r) => ringPunkte(r.refs));
  let id, n, typ, bl, ew = 0;
  if (land === 'DE') {
    id = p.NUTS; n = p.GEN; typ = p.BEZ === 'Kreisfreie Stadt' || p.BEZ === 'Stadtkreis' ? 1 : 0; bl = id.slice(0, 3);
  } else {
    // Kleinstaaten (ein Gebiet) haben keinen Namen, sie heissen wie das Land (tycoon-gebiete.ts).
    id = auslandId(p); bl = auslandBl(p); typ = 3; n = p.n || ''; ew = +p.ew || 0;
    if (p.rname) regionen[bl] = p.rname;
  }
  gebiete.push({ id, n: n.trim(), land, typ, bl, ew, ringe: ringe.map((r) => r.refs) });
}

/* ---------- Boegen klassifizieren und vereinfachen ---------- */
const nutzer = new Map();
gebiete.forEach((g, gi) => g.ringe.flat().forEach((r) => { const i = r < 0 ? ~r : r; (nutzer.get(i) || nutzer.set(i, []).get(i)).push(gi); }));
const genutzt = [...nutzer.keys()].sort((a, b) => a - b);
const neuIndex = new Map(genutzt.map((a, i) => [a, i]));
const stufe = genutzt.map((a) => {
  const u = [...new Set(nutzer.get(a))].map((gi) => gebiete[gi]);
  if (u.length < 2 || u[0].land !== u[1].land) return 3;
  return u[0].bl !== u[1].bl ? 2 : 1;
});

/** Douglas-Peucker (offene Linie, Endpunkte bleiben). */
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      const d = l < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / l;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { keep[idx] = 1; st.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
/** Geschlossene Boegen (Inseln) am entferntesten Punkt teilen, sonst bliebe nur der Anfangspunkt. */
function vereinfache(pts, tol) {
  const z = pts.length - 1;
  if (z > 2 && Math.hypot(pts[0][0] - pts[z][0], pts[0][1] - pts[z][1]) < 1e-9) {
    let m = 1, max = -1;
    for (let i = 1; i < z; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > max) { max = d; m = i; } }
    return dp(pts.slice(0, m + 1), tol).concat(dp(pts.slice(m), tol).slice(1));
  }
  return dp(pts, tol);
}
const rund = (v) => Math.round(v * 10);
/** Vereinfachung im Ausland (Welteinheiten ~ km); ganz Europa hat ~16x so viele Gebiete wie Deutschland. */
const TOL_AUSLAND = +(process.argv[3] || 0.9);
const kodiert = genutzt.map((a) => {
  const deutsch = nutzer.get(a).some((gi) => gebiete[gi].land === 'DE');
  const pts = vereinfache(boegen[a], deutsch ? 0.3 : TOL_AUSLAND).map(([x, y]) => [rund(x), rund(y)]);
  // Delta-kodiert in Zehntel-Einheiten: "x0,y0,dx1,dy1,..."
  const out = [pts[0][0], pts[0][1]];
  for (let i = 1; i < pts.length; i++) out.push(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return out.join(',');
});

/* ---------- Umriss Deutschland (Boegen, die nur ein deutsches Gebiet nutzt) ---------- */
const deStuecke = [];
gebiete.filter((g) => g.land === 'DE').forEach((g) => g.ringe.flat().forEach((r) => {
  const i = r < 0 ? ~r : r;
  if (nutzer.get(i).filter((gi) => gebiete[gi].land === 'DE').length === 1) deStuecke.push(r);
}));
const dekodiere = (s) => { const v = s.split(',').map(Number), o = [v[0], v[1]]; for (let i = 2; i < v.length; i += 2) o.push(o[i - 2] + v[i], o[i - 1] + v[i + 1]); return o; };
const stueckPunkte = (r) => {
  const f = dekodiere(kodiert[neuIndex.get(r < 0 ? ~r : r)]), p = [];
  for (let i = 0; i < f.length; i += 2) p.push([f[i], f[i + 1]]);
  return r < 0 ? p.reverse() : p;
};
const schluessel = (p) => p[0] + ':' + p[1];
const offen = new Map();
deStuecke.forEach((r) => { const p = stueckPunkte(r); (offen.get(schluessel(p[0])) || offen.set(schluessel(p[0]), []).get(schluessel(p[0]))).push(p); });
const deRinge = [];
for (const [k, liste] of offen) {
  while (liste.length) {
    let ring = liste.pop();
    for (let n = 0; n < 5000 && schluessel(ring[ring.length - 1]) !== k; n++) {
      const weiter = offen.get(schluessel(ring[ring.length - 1]));
      if (!weiter || !weiter.length) break;
      ring = ring.concat(weiter.pop().slice(1));
    }
    if (ring.length >= 4) deRinge.push(ring.flatMap(([x, y]) => [x / 10, y / 10]));
  }
}

/* ---------- Schreiben ---------- */
const ausgabe = gebiete.map((g) => ({ id: g.id, n: g.n, l: g.land, t: g.typ, b: g.bl, e: g.ew, r: g.ringe.map((refs) => refs.map((r) => (r < 0 ? ~neuIndex.get(~r) : neuIndex.get(r)))) }));
const ziel = path.join(__dirname, '..', '..', 'src', 'app', 'modules', 'zusatz', 'tycoon', 'tycoon-gebiete-daten.ts');
const text = `/* Automatisch erzeugt von tools/tycoon-karte/erzeuge-gebiete.cjs -- nicht von Hand aendern.
 * Verwaltungsgrenzen: Deutschland © GeoBasis-DE / BKG (VG250, Datenlizenz Deutschland - Namensnennung 2.0),
 * Ausland: geoBoundaries gbOpen (je Land CC0/CC BY/CC BY-SA/ODbL u. a., siehe erzeuge-europa.cjs), Namen teils Natural Earth.
 * Alles auch kommerziell nutzbar (mit Quellenangabe).
 * GEBIET_BOEGEN: gemeinsame Grenzlinien in Weltkoordinaten x 10, delta-kodiert ("x0,y0,dx1,dy1,...").
 * GEBIET_STUFE: Grenzart je Bogen (1 Kreis, 2 Bundesland/Landesteil, 3 Staat/Kueste).
 * GEBIETE_ROH: Kennung (DE: NUTS-ID, Ausland: <Land>Y<Nr>), Name n, Land l, Typ t (0 Landkreis, 1 kreisfreie Stadt, 3 Region im Ausland), Region b,
 *   Einwohner e (nur Ausland, geschaetzt; Deutschland: tycoon-einwohner-daten.ts),
 *   Ringe r als Bogen-Indizes (negativ ~i = rueckwaerts; Loecher zaehlen nach der evenodd-Regel). */
/* eslint-disable */
export const GEBIET_BOEGEN: string[] = ${JSON.stringify(kodiert)};
export const GEBIET_STUFE: number[] = ${JSON.stringify(stufe)};
export const GEBIETE_ROH: { id: string; n: string; l: string; t: number; b: string; e: number; r: number[][] }[] = ${JSON.stringify(ausgabe)};
/** Namen der Regionen im Ausland (Kuerzel b -> Name). */
export const REGIONEN: Record<string, string> = ${JSON.stringify(regionen)};
/** Umriss Deutschlands (aus denselben Grenzen) als flache Zahlenlisten x0,y0,x1,y1,... in Weltkoordinaten. */
export const DEUTSCHLAND_NUTS: number[][] = ${JSON.stringify(deRinge)};
`;
fs.writeFileSync(ziel, text);
const punkte = kodiert.reduce((a, s) => a + s.split(',').length / 2, 0);
console.log('Gebiete', gebiete.length, '(DE ' + gebiete.filter((g) => g.land === 'DE').length + ')', 'Boegen', kodiert.length, 'Punkte', punkte, 'DE-Ringe', deRinge.length, 'Bytes', text.length);

