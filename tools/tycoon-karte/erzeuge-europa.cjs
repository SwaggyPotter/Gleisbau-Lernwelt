/**
 * Bereitet die kaufbaren Gebiete im Ausland (ganz Europa bis Griechenland, Russland bis etwa Moskau) als eine
 * GeoJSON-Datei auf; danach fuegt mapshaper sie mit den deutschen Landkreisen zusammen (siehe erzeuge-gebiete.cjs).
 *
 * Quellen (alle auch kommerziell nutzbar, Namensnennung):
 *   geoBoundaries gbOpen (https://www.geoboundaries.org, Runfola et al. 2020), je Land eigene Lizenz
 *     (CC0/Public Domain, CC BY, CC BY-SA, ODbL/OpenStreetMap, Etalab, OGL, swisstopo, INE) -> LIZENZEN unten.
 *   Natural Earth (Public Domain): deutsche Namen der Regionen (admin_1), Ortsnamen und Einwohner (populated_places).
 *
 * Einwohner (Schaetzung je Gebiet): Einwohner der Natural-Earth-Orte darin (pop_min) plus eine laendliche Grunddichte je
 * Land = (Landesbevoelkerung POP_EST - Summe der Orte) / Landesflaeche (admin_0).
 *
 * Aufruf: node tools/tycoon-karte/erzeuge-europa.cjs <gb-ordner> <ne_admin1.geojson> <ne_populated_places_simple.geojson>
 *           <ne_10m_admin_0_countries.geojson> <aus.geojson>
 *   gb-ordner enthaelt <ISO3>-<ADMx>.geojson (vereinfachte Fassung von geoBoundaries, "simplifiedGeometryGeoJSON").
 *
 * Je Land: Ebene der Gebiete (etwa Landkreis-Groesse, Ziel ~300-3000 km^2) und Ebene der Regionen ("Bundeslaender").
 * Spanien und Rumaenien haben keine passende Ebene (Provinzen/Kreise zu gross, Gemeinden zu klein): dort werden die
 * Gemeinden je Provinz/Kreis zu Gebieten von etwa CLUSTER_KM2 zusammengefasst und nach dem groessten Ort benannt.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const [GB, NE1, NEPP, NE0, AUS] = process.argv.slice(2);
const CLUSTER_KM2 = 1500;

/** iso3, iso2, Gebietsebene, Regionsebene (null = ganzes Land eine Region), optional Zusammenfassen (Gemeinden in Ebene). */
const LAENDER = [
  ['PRT', 'PT', 'ADM2', 'ADM1'], ['ESP', 'ES', 'ADM3', 'ADM1', 'ADM2'], ['FRA', 'FR', 'ADM3', 'ADM1'], ['BEL', 'BE', 'ADM3', 'ADM1'],
  ['NLD', 'NL', 'ADM2', 'ADM1'], ['LUX', 'LU', 'ADM1', null], ['GBR', 'GB', 'ADM2', 'ADM1'], ['IRL', 'IE', 'ADM2', 'ADM1'],
  ['CHE', 'CH', 'ADM1', null], ['AUT', 'AT', 'ADM2', 'ADM1'], ['ITA', 'IT', 'ADM3', 'ADM2'], ['DNK', 'DK', 'ADM2', 'ADM1'],
  ['NOR', 'NO', 'ADM2', 'ADM1'], ['SWE', 'SE', 'ADM2', 'ADM1'], ['FIN', 'FI', 'ADM3', 'ADM1'], ['POL', 'PL', 'ADM2', 'ADM1'],
  ['CZE', 'CZ', 'ADM2', 'ADM1'], ['SVK', 'SK', 'ADM2', 'ADM1'], ['HUN', 'HU', 'ADM2', 'ADM1'], ['SVN', 'SI', 'ADM2', null],
  ['HRV', 'HR', 'ADM1', null], ['BIH', 'BA', 'ADM3', 'ADM1'], ['SRB', 'RS', 'ADM2', 'ADM1'], ['MNE', 'ME', 'ADM1', null],
  ['XKX', 'XK', 'ADM2', null], ['ALB', 'AL', 'ADM2', 'ADM1'], ['MKD', 'MK', 'ADM2', 'ADM1'], ['GRC', 'GR', 'ADM3', 'ADM2'],
  ['BGR', 'BG', 'ADM2', 'ADM1'], ['ROU', 'RO', 'ADM2', 'ADM1', 'ADM1'], ['MDA', 'MD', 'ADM1', null], ['UKR', 'UA', 'ADM2', 'ADM1'],
  ['BLR', 'BY', 'ADM2', 'ADM1'], ['LTU', 'LT', 'ADM2', 'ADM1'], ['LVA', 'LV', 'ADM1', null], ['EST', 'EE', 'ADM1', null],
  ['RUS', 'RU', 'ADM2', 'ADM1'], ['AND', 'AD', 'GANZ', null], ['LIE', 'LI', 'GANZ', null], ['SMR', 'SM', 'GANZ', null],
];
/** Russland: nur der Westen bis etwa Moskau (Oblaste nach geoBoundaries-Namen). */
const RUSSLAND = new Set(['Kaliningrad', 'Leningrad oblast', 'Saint Petersburg', 'Pskov Oblast', 'Novgorod Oblast', 'Tver Oblast',
  'Smolensk Oblast', 'Moscow', 'Moscow Oblast', 'Kaluga Oblast', 'Bryansk Oblast', 'Tula Oblast', 'Oryol Oblast', 'Kursk Oblast',
  'Belgorod Oblast', 'Lipetsk Oblast', 'Yaroslavl Oblast', 'Republic of Karelia', 'Murmansk Oblast']);
/** Kartenausschnitt (Laenge, Breite); Teile ausserhalb (Kanaren, Azoren, Svalbard ...) und in Afrika fallen weg. */
const imAusschnitt = (lon, lat) => lon > -11 && lon < 42 && lat > 34.5 && lat < 71.5 && !(lat < 36 && lon < 0);

/* ---------- Geometrie (Laenge/Breite) ---------- */
const polysVon = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : []);
const km = ([lon, lat]) => [lon * 111.32 * Math.cos(lat * Math.PI / 180), lat * 110.57];
const ringFlaeche = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const p = km(r[j]), q = km(r[i]); a += (p[0] + q[0]) * (p[1] - q[1]); } return Math.abs(a / 2); };
const polyFlaeche = (p) => p.reduce((a, r, i) => a + (i ? -1 : 1) * ringFlaeche(r), 0);
const imRing = (r, x, y) => {
  let drin = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
};
const imPoly = (p, x, y) => imRing(p[0], x, y) && !p.slice(1).some((h) => imRing(h, x, y));
const box = (polys) => {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  polys.forEach((p) => p[0].forEach(([x, y]) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }));
  return b;
};
/** Punkt sicher im Inneren des groessten Teils: Mitte des breitesten Abschnitts auf einigen waagerechten Linien. */
function innenPunkt(polys) {
  const p = polys.reduce((a, q) => (polyFlaeche(q) > polyFlaeche(a) ? q : a), polys[0]);
  const [x0, y0, x1, y1] = box([p]);
  let best = null, bw = -1;
  for (let k = 1; k < 12; k++) {
    const y = y0 + ((y1 - y0) * k) / 12, xs = [];
    for (const r of p) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > bw) { bw = xs[i + 1] - xs[i]; best = [(xs[i] + xs[i + 1]) / 2, y]; }
  }
  return best || [(x0 + x1) / 2, (y0 + y1) / 2];
}
/** Feature mit vorberechneten Teilen, Box, Flaeche und Innenpunkt. */
const aufbereiten = (f) => {
  const polys = polysVon(f.geometry);
  if (!polys.length) return null;
  return { props: f.properties, polys, box: box(polys), f: polys.reduce((a, p) => a + polyFlaeche(p), 0), p: innenPunkt(polys) };
};
const enthaelt = (u, [x, y]) => x >= u.box[0] && x <= u.box[2] && y >= u.box[1] && y <= u.box[3] && u.polys.some((p) => imPoly(p, x, y));
const laden = (iso3, ebene) => {
  const datei = path.join(GB, iso3 + '-' + ebene + '.geojson');
  return JSON.parse(fs.readFileSync(datei, 'utf8')).features.map(aufbereiten).filter(Boolean);
};
/** Nur Teile im Kartenausschnitt behalten. */
const beschneide = (u) => {
  const polys = u.polys.filter((p) => { const q = innenPunkt([p]); return imAusschnitt(q[0], q[1]); });
  if (!polys.length) return null;
  return polys.length === u.polys.length ? u : { ...u, polys, box: box(polys), f: polys.reduce((a, p) => a + polyFlaeche(p), 0), p: innenPunkt(polys) };
};
/** Name aufraeumen: erster Buchstabe gross, GROSSBUCHSTABEN-Namen normal, englische Zusaetze ("... District") weg. */
const gross = (s) => {
  if (!s) return s;
  if (s === s.toLocaleUpperCase('de') && /[A-ZÄÖÜ]{3}/.test(s)) s = s.toLocaleLowerCase('de').replace(/(^|[\s\-(])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase('de'));
  s = s.replace(/ (Urban Okrug|City Okrug)$/i, ' (Stadt)').replace(/ (Municipal District|District|Raion|Rayon|Municipality)$/i, '');
  return s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
};

/* ---------- Natural Earth: deutsche Regionsnamen, Orte ---------- */
const ne1 = JSON.parse(fs.readFileSync(NE1, 'utf8')).features.map(aufbereiten).filter(Boolean);
const orte = JSON.parse(fs.readFileSync(NEPP, 'utf8')).features.map((f) => ({ n: f.properties.name, iso: f.properties.iso_a2, pop: f.properties.pop_max || 0, popMin: f.properties.pop_min || 0, p: f.geometry.coordinates }));
/** Staat je ISO-Kuerzel; mehrere Eintraege (z. B. Clipperton-Insel = FR): der bevoelkerungsreichste. */
const staaten = new Map();
for (const f of JSON.parse(fs.readFileSync(NE0, 'utf8')).features) {
  const k = f.properties.ISO_A2_EH || f.properties.ISO_A2, alt = staaten.get(k);
  if (!alt || f.properties.POP_EST > alt.properties.POP_EST) staaten.set(k, f);
}
/** Laendliche Einwohner je km^2: was die Orte nicht abdecken, gleichmaessig verteilt (Russland: nur der Westen zaehlt, fest). */
function grunddichte(iso2) {
  if (iso2 === 'RU') return 25;
  const st = staaten.get(iso2);
  if (!st) return 40;
  // Ballungsraeume (pop_max) ueberlappen sich teils, deshalb mindestens 30 % der Landesdichte.
  const u = aufbereiten(st), inOrten = orte.filter((o) => o.iso === iso2).reduce((a, o) => a + o.pop, 0);
  return Math.max(4, 0.3 * st.properties.POP_EST / u.f, (st.properties.POP_EST - inOrten) / u.f);
}

/** Deutscher Name einer Region, wenn Natural Earth genau dieselbe Region kennt (gegenseitig enthalten, aehnlich gross). */
function deutscherName(iso2, g) {
  const kand = ne1.filter((n) => n.props.iso_a2 === iso2 && enthaelt(n, g.p));
  if (kand.length !== 1) return null;
  const n = kand[0];
  if (!enthaelt(g, n.p) || n.f / g.f < 0.6 || n.f / g.f > 1.6) return null;
  return n.props.name_de || null;
}

/* ---------- Zusammenfassen (Spanien, Rumaenien) ---------- */
/** k-Means (nach Flaeche gewichtet) auf den Gemeinde-Innenpunkten; deterministische Startwerte (entferntester Punkt). */
function zusammenfassen(gemeinden, k) {
  if (k <= 1) return gemeinden.map(() => 0);
  const pts = gemeinden.map((g) => km(g.p));
  const zentren = [pts[gemeinden.reduce((b, g, i) => (g.f > gemeinden[b].f ? i : b), 0)]];
  while (zentren.length < k) {
    let bi = 0, bd = -1;
    pts.forEach((p, i) => { const d = Math.min(...zentren.map((z) => Math.hypot(p[0] - z[0], p[1] - z[1]))); if (d > bd) { bd = d; bi = i; } });
    zentren.push(pts[bi]);
  }
  let zu = pts.map(() => 0);
  for (let it = 0; it < 25; it++) {
    zu = pts.map((p) => { let b = 0, bd = Infinity; zentren.forEach((z, i) => { const d = Math.hypot(p[0] - z[0], p[1] - z[1]); if (d < bd) { bd = d; b = i; } }); return b; });
    zentren.forEach((z, i) => {
      let sx = 0, sy = 0, sw = 0;
      pts.forEach((p, j) => { if (zu[j] === i) { sx += p[0] * gemeinden[j].f; sy += p[1] * gemeinden[j].f; sw += gemeinden[j].f; } });
      if (sw) zentren[i] = [sx / sw, sy / sw];
    });
  }
  return zu;
}

/* ---------- Laender durchgehen ---------- */
const aus = [];
const bericht = [];
for (const [iso3, iso2, ebene, regEbene, zfIn] of LAENDER) {
  let einheiten;
  if (ebene === 'GANZ') {
    // Kleinstaat: alles ein Gebiet.
    const teile = laden(iso3, 'ADM1');
    einheiten = [{ props: { shapeName: '' }, polys: teile.flatMap((t) => t.polys) }].map((u) => ({ ...u, box: box(u.polys), f: u.polys.reduce((a, p) => a + polyFlaeche(p), 0), p: innenPunkt(u.polys) }));
  } else einheiten = laden(iso3, ebene);
  einheiten = einheiten.map(beschneide).filter(Boolean);
  let regionen = regEbene ? laden(iso3, regEbene).map(beschneide).filter(Boolean) : [];
  if (iso3 === 'RUS') {
    regionen = regionen.filter((r) => RUSSLAND.has(r.props.shapeName));
    einheiten = einheiten.filter((u) => regionen.some((r) => enthaelt(r, u.p)));
  }
  // Regionen ohne Unterteilung in den Daten (z. B. die Stadtstaaten Moskau und Sankt Petersburg): als ein Gebiet.
  if (regEbene && !zfIn) for (const r of regionen) if (!einheiten.some((u) => enthaelt(r, u.p))) einheiten.push({ ...r, props: { shapeName: deutscherName(iso2, r) || r.props.shapeName } });
  const regionVon = (u) => (regEbene ? regionen.findIndex((r) => enthaelt(r, u.p)) : 0);
  const regName = regionen.map((r) => deutscherName(iso2, r) || gross(r.props.shapeName));
  let gebiete = [];
  if (zfIn) {
    // Gemeinden je Provinz/Kreis (zfIn) zusammenfassen.
    const ober = laden(iso3, zfIn).map(beschneide).filter(Boolean);
    const landOrte = orte.filter((o) => o.iso === iso2 && imAusschnitt(o.p[0], o.p[1]));
    ober.forEach((o, oi) => {
      const gem = einheiten.filter((u) => enthaelt(o, u.p));
      if (!gem.length) return;
      const flaeche = gem.reduce((a, g) => a + g.f, 0), k = Math.max(1, Math.round(flaeche / CLUSTER_KM2));
      const zu = zusammenfassen(gem, k);
      for (let c = 0; c < k; c++) {
        const teil = gem.filter((_, i) => zu[i] === c);
        if (!teil.length) continue;
        const ort = landOrte.filter((p) => teil.some((g) => enthaelt(g, p.p))).sort((a, b) => b.pop - a.pop)[0];
        const groesste = teil.reduce((a, g) => (g.f > a.f ? g : a), teil[0]);
        const name = k === 1 ? gross(o.props.shapeName) : ort ? ort.n : gross(groesste.props.shapeName);
        gebiete.push({ teile: teil, n: name, r: regionVon({ p: groesste.p }), sort: oi * 1000 + c });
      }
    });
  } else {
    gebiete = einheiten.map((u, i) => ({ teile: [u], n: ebene === 'GANZ' ? '' : gross(u.props.shapeName), r: regionVon(u), sort: i }));
  }
  gebiete = gebiete.filter((g) => g.r >= 0);
  // Einwohner: Grunddichte x Flaeche, Kernstadt (pop_min) im Gebiet des Orts, das Umland (pop_max - pop_min) nach
  // Flaeche und Naehe auf die Gebiete im Umkreis verteilt (Radius waechst mit der Groesse des Ballungsraums).
  const dichte = grunddichte(iso2), landOrte2 = orte.filter((o) => o.iso === iso2 && imAusschnitt(o.p[0], o.p[1]));
  for (const g of gebiete) {
    g.fl = g.teile.reduce((a, t) => a + t.f, 0);
    g.mitte = km(g.teile.reduce((a, t) => (t.f > a.f ? t : a), g.teile[0]).p);
    // Polen: kreisfreie Staedte heissen ohne "Powiat" und haben mindestens staedtische Dichte.
    const stadtkreis = iso2 === 'PL' && !/^Powiat /i.test(g.n);
    g.ew = (stadtkreis ? Math.max(1500, dichte) : dichte) * g.fl;
  }
  for (const o of landOrte2) {
    // pop_min ist bei manchen Grossstaedten unbrauchbar (Paris 11.177): Kern = so viel, wie das Gebiet bei
    // hoechstens 20.000 Einwohnern/km^2 fasst; der Rest des Ballungsraums geht ins Umland.
    const drin = gebiete.find((g) => g.teile.some((t) => enthaelt(t, o.p)));
    const kern = drin ? Math.min(o.pop, 20000 * drin.fl) : 0;
    if (drin) drin.ew += kern;
    const umland = Math.max(0, o.pop - kern);
    if (!umland) continue;
    const p = km(o.p), radius = 8 + Math.sqrt(o.pop) / 60;
    // Gewicht: Flaeche, nach aussen abnehmend (Vororte dichter als das weitere Umland).
    const gewicht = (g) => { const d = Math.hypot(g.mitte[0] - p[0], g.mitte[1] - p[1]); return d < radius ? g.fl / (1 + (d / (radius / 4)) ** 2) : 0; };
    const nah = gebiete.filter((g) => g !== drin && gewicht(g) > 0);
    const summe = nah.reduce((a, g) => a + gewicht(g), 0);
    if (!summe) { if (drin) drin.ew += umland; continue; }
    nah.forEach((g) => (g.ew += (umland * gewicht(g)) / summe));
  }
  gebiete.forEach((g) => (g.ew = Math.round(g.ew / 100) * 100));
  // Feste Reihenfolge: Region, Name.
  gebiete.sort((a, b) => a.r - b.r || a.n.localeCompare(b.n, 'de') || a.sort - b.sort);
  gebiete.forEach((g, i) => {
    const uid = iso2 + ':' + i;
    // Einwohner nur am ersten Teil (beim Zusammenfassen mit sum-fields addiert).
    g.teile.forEach((t, ti) => {
      aus.push({ type: 'Feature', properties: { uid, land: iso2, reg: g.r, rname: regEbene ? regName[g.r] : '', n: g.n, ew: ti ? 0 : g.ew }, geometry: { type: 'MultiPolygon', coordinates: t.polys } });
    });
  });
  const fl = gebiete.map((g) => g.teile.reduce((a, t) => a + t.f, 0));
  bericht.push(iso2 + ' ' + Math.round(gebiete.reduce((a, g) => a + g.ew, 0) / 1e5) / 10 + ' Mio. EW, ' + gebiete.length + ' Gebiete, ' + (regEbene ? regionen.length : 1) + ' Regionen, Ø ' + Math.round(fl.reduce((a, b) => a + b, 0) / (fl.length || 1)) + ' km², max ' + Math.round(Math.max(...fl)));
}
fs.writeFileSync(AUS, JSON.stringify({ type: 'FeatureCollection', features: aus }));
console.log(bericht.join('\n'));
console.log('Teile', aus.length, '->', AUS);
