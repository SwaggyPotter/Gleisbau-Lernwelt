import { GEBIET_BOEGEN, GEBIET_STUFE, GEBIETE_ROH, REGIONEN } from './tycoon-gebiete-daten';
import { STADT_BEZIRKE } from './tycoon-bezirke-daten';
import { EINWOHNER } from './tycoon-einwohner-daten';
import { CITIES, KARTE_PROJ } from './tycoon-karte';

/**
 * Kaufbare Gebiete des Tycoon: in Deutschland alle Landkreise und kreisfreien Staedte, in Berlin und Hamburg
 * die Bezirke, im Ausland (ganz Europa bis Griechenland, Russland bis etwa Moskau) Kreise, Bezirke, Arrondissements,
 * Provinzen ... in etwa Landkreis-Groesse. Strecken duerfen ueber eigene Gebiete (oder die aktiver Clan-Mitglieder)
 * gezeichnet werden, ueber fremde gegen Durchfahrt. Grenzen: BKG VG250 (dl-de/by-2-0), Ausland: geoBoundaries,
 * Berlin/Hamburg: OpenStreetMap, Einwohner: Wikidata (CC0), Ausland geschaetzt (Natural Earth). Alle Quellen erlauben auch
 * kommerzielle Nutzung (mit Quellenangabe, teils Weitergabe unter gleicher Lizenz: ODbL, CC BY-SA).
 */

/** Wert der Spalte tycoon_bezirke.stadt fuer Gebiete (alte Stadtbezirke hatten dort den Stadt-Index 0..99). */
export const GEBIET_STADT = 100;
/** Quellenvermerk als HTML (BKG verlangt Links auf bkg.bund.de und die Lizenz sowie einen Veraenderungshinweis). */
export const GEBIET_QUELLE =
  'Grenzen: © <a href="https://www.bkg.bund.de" target="_blank" rel="noopener">BKG</a> (2026) ' +
  '<a href="https://www.govdata.de/dl-de/by-2-0" target="_blank" rel="noopener">dl-de/by-2-0</a>, Datenquellen: ' +
  '<a href="https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf" target="_blank" rel="noopener">VG250</a>' +
  ' (vereinfacht und für das Spiel umgestaltet) · Ausland: <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">geoBoundaries</a>' +
  ' (Runfola et al. 2020; je Land CC0, CC BY, CC BY-SA, ODbL u. a.; vereinfacht, teils zusammengefasst), Natural Earth' +
  ' · Berlin/Hamburg und Teile des Auslands: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende (ODbL)';

export interface Gebiet {
  /** Feste Kennung, so wird Besitz gespeichert: NUTS-ID (Ausland: eigene 6-stellige Kennung) als Zahl
   * zur Basis 36, Bezirke: OSM-Relation. */
  id: number;
  n: string;
  /** Laenderkuerzel (DE, NL, ...). */
  land: string;
  /** Region: in Deutschland NUTS-1 = Bundesland (z. B. DE2 = Bayern), im Ausland "<Land><Nr>" (Name in REGIONEN). */
  bl: string;
  /** 0 Landkreis, 1 kreisfreie Stadt, 2 Bezirk (Berlin/Hamburg), 3 Region im Ausland. */
  typ: number;
  /** Flaeche in Welteinheiten^2 (ungefaehr km^2). */
  f: number;
  /** Grundpreis (freies Gebiet); fremde nur per Gebot, Durchfahrt kostet einen Anteil davon. */
  basis: number;
  /** Ringe x0,y0,x1,y1,... in Weltkoordinaten (Loecher nach evenodd-Regel). */
  ringe: number[][];
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Spielstaedte (Index in CITIES), die in diesem Gebiet liegen. */
  staedte: number[];
  /** Einwohner (Wikidata, tycoon-einwohner-daten.ts); ewGeschaetzt = geschaetzt (Ausland: aus Orten und Flaeche). */
  ew: number;
  ewGeschaetzt: boolean;
}

export const BUNDESLAENDER: Record<string, string> = {
  DE1: 'Baden-Württemberg', DE2: 'Bayern', DE3: 'Berlin', DE4: 'Brandenburg', DE5: 'Bremen', DE6: 'Hamburg', DE7: 'Hessen',
  DE8: 'Mecklenburg-Vorpommern', DE9: 'Niedersachsen', DEA: 'Nordrhein-Westfalen', DEB: 'Rheinland-Pfalz', DEC: 'Saarland',
  DED: 'Sachsen', DEE: 'Sachsen-Anhalt', DEF: 'Schleswig-Holstein', DEG: 'Thüringen',
};
export const LAND_NAMEN: Record<string, string> = {
  DE: 'Deutschland', NL: 'Niederlande', BE: 'Belgien', LU: 'Luxemburg', FR: 'Frankreich', CH: 'Schweiz', LI: 'Liechtenstein',
  AT: 'Österreich', CZ: 'Tschechien', PL: 'Polen', DK: 'Dänemark', SE: 'Schweden', PT: 'Portugal', ES: 'Spanien', AD: 'Andorra',
  GB: 'Vereinigtes Königreich', IE: 'Irland', IT: 'Italien', SM: 'San Marino', NO: 'Norwegen', FI: 'Finnland', SK: 'Slowakei',
  HU: 'Ungarn', SI: 'Slowenien', HR: 'Kroatien', BA: 'Bosnien und Herzegowina', RS: 'Serbien', ME: 'Montenegro', XK: 'Kosovo',
  AL: 'Albanien', MK: 'Nordmazedonien', GR: 'Griechenland', BG: 'Bulgarien', RO: 'Rumänien', MD: 'Moldau', UA: 'Ukraine',
  BY: 'Belarus', LT: 'Litauen', LV: 'Lettland', EE: 'Estland', RU: 'Russland',
};
/** Beschriftung der Bundeslaender (Breite, Laenge), so gesetzt, dass sie nicht auf den Stadtnamen liegt. Stadtstaaten ohne. */
const BL_SCHRIFT: [string, number, number][] = [
  ['Baden-Württemberg', 48.45, 9.25], ['Bayern', 49.15, 11.95], ['Brandenburg', 52.05, 13.95], ['Hessen', 50.55, 9.05],
  ['Mecklenburg-Vorpommern', 53.72, 12.55], ['Niedersachsen', 52.85, 8.85], ['Nordrhein-Westfalen', 51.2, 7.95],
  ['Rheinland-Pfalz', 49.95, 7.35], ['Saarland', 49.47, 6.78], ['Sachsen', 50.78, 13.05], ['Sachsen-Anhalt', 51.7, 11.65],
  ['Schleswig-Holstein', 54.12, 9.45], ['Thüringen', 50.68, 11.3],
];

/* ---------- Daten aufbereiten ---------- */
// In ganzen Zehnteln aufsummieren (genau und schneller als jeden Punkt mit toFixed zu runden).
const BOEGEN: number[][] = GEBIET_BOEGEN.map((s) => {
  const v = s.split(','), o: number[] = new Array(v.length);
  let x = +v[0], y = +v[1];
  o[0] = x / 10; o[1] = y / 10;
  for (let i = 2; i < v.length; i += 2) { x += +v[i]; y += +v[i + 1]; o[i] = x / 10; o[i + 1] = y / 10; }
  return o;
});
/** Ring aus Bogen-Indizes (negativ ~i = Bogen rueckwaerts). */
const ringAus = (refs: number[]): number[] => {
  const o: number[] = [];
  refs.forEach((ref, k) => {
    const b = BOEGEN[ref >= 0 ? ref : ~ref], n = b.length;
    // Folgeboegen ohne ihren ersten Punkt (= letzter Punkt des vorigen Bogens).
    if (ref >= 0) for (let i = k ? 2 : 0; i < n; i += 2) o.push(b[i], b[i + 1]);
    else for (let i = n - 2 - (k ? 2 : 0); i >= 0; i -= 2) o.push(b[i], b[i + 1]);
  });
  return o;
};

export const imRingFlach = (r: number[], x: number, y: number): boolean => {
  let drin = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
};
/** evenodd ueber alle Ringe: Loecher (z. B. eine kreisfreie Stadt mitten im Landkreis) gehoeren nicht dazu. */
const imGebiet = (g: Gebiet, x: number, y: number): boolean => {
  if (x < g.box.x0 || x > g.box.x1 || y < g.box.y0 || y > g.box.y1) return false;
  let n = 0;
  for (const r of g.ringe) if (imRingFlach(r, x, y)) n++;
  return n % 2 === 1;
};
const ringFlaeche = (r: number[]): number => {
  let a = 0;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += (r[j] + r[i]) * (r[j + 1] - r[i + 1]);
  return Math.abs(a / 2);
};
/** Grundpreis nach Flaeche (hoechstens 900); Staedte (kreisfrei, Bezirk) mindestens 250, mit Spielstadt darin +50 %. */
/** Grundpreis aus Flaeche, Art und Einwohnern (viele Einwohner = teurer, bringt aber auch mehr). */
const preisVon = (f: number, typ: number, mitStadt: boolean, ew: number): number => {
  let p = 100 + 0.2 * f;
  if (typ === 1 || typ === 2) p = Math.max(p, 250);
  p = Math.min(p, 900) * (mitStadt ? 1.5 : 1) * einwohnerPreisFaktor(ew);
  return Math.round(p / 50) * 50;
};
/** Preisfaktor nach Einwohnern: 200.000 = 1, Wurzel-Verlauf, 0,6 bis 2,5. */
export const einwohnerPreisFaktor = (ew: number) => Math.max(0.6, Math.min(2.5, Math.sqrt(ew / 200000)));
/** Einwohner pro km^2 als Schaetzung, wo weder Wikidata noch die Kartendaten eine Zahl liefern. */
const DICHTE: Record<string, number> = { DE: 233 };
const anzeigeName = (n: string, typ: number): string => {
  n = n.replace(/ \(DE\)$/, '');
  if (typ === 0 && !/kreis|Kreis|Region|Landkreis|Städteregion|Regionalverband/.test(n)) return 'Landkreis ' + n;
  if (typ === 1) return n + ' (Stadt)';
  return n;
};

/** Grenzboegen je Gebiet (fuer die Nachbarschaft); Berliner/Hamburger Bezirke haben eigene Ringe ohne Boegen. */
const boegenVon = new Map<number, number[]>();
const liste: (Omit<Gebiet, 'basis' | 'box' | 'staedte' | 'f' | 'ew' | 'ewGeschaetzt'> & { ewRoh?: number })[] = [];
for (const g of GEBIETE_ROH) {
  // Berlin und Hamburg: statt des ganzen Stadtstaats seine Bezirke (OpenStreetMap).
  const stadtstaat = g.id === 'DE300' ? 0 : g.id === 'DE600' ? 1 : -1;
  if (stadtstaat >= 0) {
    for (const b of STADT_BEZIRKE[stadtstaat]) liste.push({ id: b.osm, n: b.n, land: 'DE', bl: g.id.slice(0, 3), typ: 2, ringe: b.r });
    continue;
  }
  // Kleinstaaten (ein Gebiet ohne Namen) heissen wie das Land.
  liste.push({ id: parseInt(g.id, 36), n: anzeigeName(g.n || LAND_NAMEN[g.l] || g.l, g.t), land: g.l, bl: g.b, typ: g.t, ringe: g.r.map(ringAus), ewRoh: g.e || undefined });
  boegenVon.set(parseInt(g.id, 36), g.r.flat().map((ref) => (ref >= 0 ? ref : ~ref)));
}
export const GEBIETE: Gebiet[] = liste.map(({ ewRoh, ...g }) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  g.ringe.forEach((r) => { for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } });
  // Flaeche: Ringe, die in einem anderen Ring desselben Gebiets liegen, sind Loecher.
  // (Erst ueber die umgebenden Rechtecke pruefen: Gebiete mit vielen Inseln, z. B. in Norwegen, waeren sonst langsam.)
  const rb = g.ringe.map((r) => { let a0 = Infinity, b0 = Infinity, a1 = -Infinity, b1 = -Infinity; for (let i = 0; i < r.length; i += 2) { a0 = Math.min(a0, r[i]); a1 = Math.max(a1, r[i]); b0 = Math.min(b0, r[i + 1]); b1 = Math.max(b1, r[i + 1]); } return [a0, b0, a1, b1]; });
  const f = g.ringe.reduce((a, r, i) => a + ringFlaeche(r) * (g.ringe.some((o, j) => j !== i && r[0] >= rb[j][0] && r[0] <= rb[j][2] && r[1] >= rb[j][1] && r[1] <= rb[j][3] && imRingFlach(o, r[0], r[1])) ? -1 : 1), 0);
  const geb: Gebiet = { ...g, f: Math.round(f), basis: 0, box: { x0, y0, x1, y1 }, staedte: [], ew: 0, ewGeschaetzt: false };
  geb.staedte = CITIES.map((c, i) => (imGebiet(geb, c.x, c.y) ? i : -1)).filter((i) => i >= 0);
  geb.ew = EINWOHNER[geb.id] ?? ewRoh ?? Math.round(geb.f * (geb.land === 'DE' && geb.typ === 0 ? 150 : DICHTE[geb.land] ?? 100) / 100) * 100;
  geb.ewGeschaetzt = EINWOHNER[geb.id] === undefined;
  geb.basis = preisVon(geb.f, geb.typ, geb.staedte.length > 0, geb.ew);
  return geb;
});
const nachId = new Map(GEBIETE.map((g) => [g.id, g]));
/** Spielbare Flaeche (alle Gebiete, etwas Rand) in Weltkoordinaten; die 2D-Ansicht bleibt darin. */
export const SPIEL = GEBIETE.reduce((b, g) => ({ x0: Math.min(b.x0, g.box.x0 - 30), y0: Math.min(b.y0, g.box.y0 - 30), x1: Math.max(b.x1, g.box.x1 + 30), y1: Math.max(b.y1, g.box.y1 + 30) }),
  { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
export const gebietMitId = (id: number): Gebiet | undefined => nachId.get(id);

/* ---------- Raster fuer schnelle Suche ---------- */
const ZELLE = 20;
const raster = new Map<string, Gebiet[]>();
GEBIETE.forEach((g) => {
  for (let cx = Math.floor(g.box.x0 / ZELLE); cx <= Math.floor(g.box.x1 / ZELLE); cx++) {
    for (let cy = Math.floor(g.box.y0 / ZELLE); cy <= Math.floor(g.box.y1 / ZELLE); cy++) {
      const k = cx + ':' + cy;
      (raster.get(k) || raster.set(k, []).get(k)!).push(g);
    }
  }
});
const kandidaten = (x: number, y: number): Gebiet[] => raster.get(Math.floor(x / ZELLE) + ':' + Math.floor(y / ZELLE)) || [];

/** Gebiet an einer Stelle (Weltkoordinaten) oder null (Meer, ausserhalb). */
export function gebietAn(x: number, y: number): Gebiet | null {
  for (const g of kandidaten(x, y)) if (imGebiet(g, x, y)) return g;
  return null;
}

const stadtGebiet = CITIES.map((c) => gebietAn(c.x, c.y));
/** Gebiet, in dem eine Spielstadt liegt. */
export const gebietVonStadt = (stadt: number): Gebiet | null => stadtGebiet[stadt] ?? null;

/** Kuerzester Abstand eines Punkts zum Rand eines Gebiets. */
export function randAbstand(g: Gebiet, x: number, y: number): number {
  let best = Infinity;
  for (const r of g.ringe) {
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const ax = r[j], ay = r[j + 1], dx = r[i] - ax, dy = r[i + 1] - ay, l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
    }
  }
  return best;
}

/**
 * Darf an dieser Stelle gebaut werden? Liegt im erlaubten Gebiet oder hoechstens toleranz vom Rand eines
 * erlaubten Gebiets entfernt (gleicht kleine Luecken zwischen den Datenquellen, z. B. am Berliner Rand, aus).
 */
export function stelleErlaubt(x: number, y: number, erlaubt: (g: Gebiet) => boolean, toleranz = 1.2): boolean {
  const g = gebietAn(x, y);
  if (g && erlaubt(g)) return true;
  const nah = new Set<Gebiet>();
  for (const dx of [-toleranz, toleranz]) for (const dy of [-toleranz, toleranz]) kandidaten(x + dx, y + dy).forEach((o) => nah.add(o));
  for (const o of nah) {
    if (o === g || !erlaubt(o)) continue;
    if (x < o.box.x0 - toleranz || x > o.box.x1 + toleranz || y < o.box.y0 - toleranz || y > o.box.y1 + toleranz) continue;
    if (randAbstand(o, x, y) <= toleranz) return true;
  }
  return false;
}

/** Name des Bundeslands (im Ausland: Region und Land, bei Laendern ohne Regionen nur das Land), zu dem ein Gebiet gehoert. */
export const regionVon = (g: Gebiet): string => {
  if (g.land === 'DE') return BUNDESLAENDER[g.bl] ?? g.bl;
  const land = LAND_NAMEN[g.land] ?? g.land, r = REGIONEN[g.bl];
  return r ? r + ' (' + land + ')' : land;
};
/** Name ohne Zusatz ("Landkreis ...", "(Stadt)"), z. B. fuer Bahnhofsnamen. */
export const kurzName = (g: Gebiet): string => g.n.replace(/^Landkreis /, '').replace(/ \(Stadt\)$/, '');

const imBundesland = new Map<string, Gebiet[]>();
/** Alle Gebiete desselben Bundeslands (NUTS-1), alphabetisch. */
export function gebieteIm(bl: string): Gebiet[] {
  let l = imBundesland.get(bl);
  if (!l) { l = GEBIETE.filter((g) => g.bl === bl).sort((a, b) => a.n.localeCompare(b.n, 'de')); imBundesland.set(bl, l); }
  return l;
}

const pfadCache = new Map<number, string>();
/** SVG-Pfad (Weltkoordinaten) eines Gebiets, fuer die Bundesland-Uebersicht. */
export function svgPfad(g: Gebiet): string {
  let d = pfadCache.get(g.id);
  if (!d) {
    d = g.ringe.map((r) => 'M' + r.map((v) => Math.round(v * 10) / 10).join(' ').replace(/(\S+ \S+) /g, '$1L') + 'Z').join('');
    pfadCache.set(g.id, d);
  }
  return d;
}

/* ---------- Nachbarn und Umkreis ---------- */
/** Gebiete je Grenzbogen (ein Bogen trennt hoechstens zwei Gebiete; Kuestenboegen gehoeren nur einem). */
const anBogen = new Map<number, number[]>();
boegenVon.forEach((refs, id) => refs.forEach((b) => (anBogen.get(b) || anBogen.set(b, []).get(b)!).push(id)));
/** Liegt ein Randpunkt von a hoechstens tol von b entfernt (fuer Gebiete ohne gemeinsame Boegen)? */
const beruehrt = (a: Gebiet, b: Gebiet, tol: number): boolean => {
  if (a.box.x0 > b.box.x1 + tol || b.box.x0 > a.box.x1 + tol || a.box.y0 > b.box.y1 + tol || b.box.y0 > a.box.y1 + tol) return false;
  for (const r of a.ringe) {
    for (let i = 0; i < r.length; i += 4) {
      const x = r[i], y = r[i + 1];
      if (x < b.box.x0 - tol || x > b.box.x1 + tol || y < b.box.y0 - tol || y > b.box.y1 + tol) continue;
      if (randAbstand(b, x, y) <= tol) return true;
    }
  }
  return false;
};
const nachbarCache = new Map<number, number[]>();
/** Angrenzende Gebiete (gemeinsame Grenze; Berliner/Hamburger Bezirke und ihre Nachbarn ueber die Lage). */
export function nachbarn(id: number): number[] {
  let n = nachbarCache.get(id);
  if (n) return n;
  const g = nachId.get(id);
  if (!g) return [];
  const s = new Set<number>();
  (boegenVon.get(id) || []).forEach((b) => anBogen.get(b)!.forEach((o) => o !== id && s.add(o)));
  // Bezirke haben keine Boegen; Gebiete am Rand von Berlin/Hamburg grenzen an sie.
  const ohneBoegen = !boegenVon.has(id);
  for (const o of GEBIETE) {
    if (o.id === id || s.has(o.id) || (!ohneBoegen && boegenVon.has(o.id))) continue;
    if (beruehrt(g, o, 0.6) || beruehrt(o, g, 0.6)) s.add(o.id);
  }
  n = [...s];
  nachbarCache.set(id, n);
  return n;
}
/** Mitte des umgebenden Rechtecks (schnell; fuer Abstaende zwischen Gebieten genau genug). */
export const boxMitte = (g: Gebiet): { x: number; y: number } => ({ x: (g.box.x0 + g.box.x1) / 2, y: (g.box.y0 + g.box.y1) / 2 });
/** Gebiete, deren Mitte hoechstens r vom Punkt entfernt liegt. */
export function gebieteUm(x: number, y: number, r: number): Gebiet[] {
  const o = new Set<Gebiet>();
  for (let cx = Math.floor((x - r) / ZELLE); cx <= Math.floor((x + r) / ZELLE); cx++) {
    for (let cy = Math.floor((y - r) / ZELLE); cy <= Math.floor((y + r) / ZELLE); cy++) (raster.get(cx + ':' + cy) || []).forEach((g) => o.add(g));
  }
  return [...o].filter((g) => { const m = boxMitte(g); return Math.hypot(m.x - x, m.y - y) <= r; });
}
/** Klimazone eines Landes: Norden (lange, kalte Winter), Sueden (heisse Sommer), sonst Mitte. */
const NORDEN = new Set(['NO', 'SE', 'FI', 'EE', 'LV', 'LT', 'RU', 'BY', 'IS']);
const SUEDEN = new Set(['IT', 'ES', 'PT', 'GR', 'HR', 'BA', 'RS', 'ME', 'AL', 'MK', 'XK', 'BG', 'RO', 'MD', 'SM', 'AD']);
export type Klima = 'nord' | 'mitte' | 'sued';
export const klimaVon = (land: string): Klima => (NORDEN.has(land) ? 'nord' : SUEDEN.has(land) ? 'sued' : 'mitte');

const innenCache = new Map<number, { x: number; y: number }>();
/** Ein Punkt gut im Inneren des Gebiets (weit weg vom Rand), z. B. fuer einen Bahnhof ohne angeklickte Stelle. */
export function innererPunkt(g: Gebiet): { x: number; y: number } {
  let p = innenCache.get(g.id);
  if (p) return p;
  let best = -1;
  const N = 14;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = g.box.x0 + ((g.box.x1 - g.box.x0) * (i + 0.5)) / (N + 1), y = g.box.y0 + ((g.box.y1 - g.box.y0) * (j + 0.5)) / (N + 1);
      if (!imGebiet(g, x, y)) continue;
      const d = randAbstand(g, x, y);
      if (d > best) { best = d; p = { x, y }; }
    }
  }
  p = p ?? { x: (g.box.x0 + g.box.x1) / 2, y: (g.box.y0 + g.box.y1) / 2 };
  innenCache.set(g.id, p);
  return p;
}

/* ---------- Zeichnen ---------- */
export interface GebietStil {
  /** Fuellfarbe je Gebiet (Besitz) oder null = nicht gefuellt. */
  farbe: (g: Gebiet) => { farbe: string; deckung: number } | null;
  /** Grundstrichstaerke in Weltkoordinaten. */
  linie: number;
  /** Ausgewaehltes Gebiet (dick umrandet). */
  wahl?: number | null;
  /** Bundeslaender beschriften. */
  namen?: boolean;
  /** Linienfarbe (Kreisgrenzen sind heller, Bundesland-/Staatsgrenzen kraeftiger). */
  strich?: string;
}

const pfad = (ctx: CanvasRenderingContext2D, ringe: number[][]) => {
  for (const r of ringe) {
    ctx.moveTo(r[0], r[1]);
    for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]);
    ctx.closePath();
  }
};

/** Umgebendes Rechteck je Grenzbogen (x0, y0, x1, y1), damit nur Sichtbares gezeichnet wird. */
const BOGEN_BOX: number[][] = BOEGEN.map((b) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < b.length; i += 2) { x0 = Math.min(x0, b[i]); x1 = Math.max(x1, b[i]); y0 = Math.min(y0, b[i + 1]); y1 = Math.max(y1, b[i + 1]); }
  return [x0, y0, x1, y1];
});
/** Douglas-Peucker fuer eine flache Punktliste (Endpunkte bleiben, damit die Boegen weiter aneinanderpassen). */
function vereinfacht(b: number[], tol: number): number[] {
  const n = b.length / 2;
  if (n < 3) return b;
  const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1;
  const st: [number, number][] = [[0, n - 1]];
  while (st.length) {
    const [a, e] = st.pop()!;
    const ax = b[a * 2], ay = b[a * 2 + 1], dx = b[e * 2] - ax, dy = b[e * 2 + 1] - ay, l = Math.hypot(dx, dy);
    let max = 0, idx = -1;
    for (let i = a + 1; i < e; i++) {
      const px = b[i * 2] - ax, py = b[i * 2 + 1] - ay, d = l < 1e-9 ? Math.hypot(px, py) : Math.abs(dy * px - dx * py) / l;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { keep[idx] = 1; st.push([a, idx], [idx, e]); }
  }
  const o: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) o.push(b[i * 2], b[i * 2 + 1]);
  return o;
}
/** Grobe Boegen fuer weit herausgezoomte Ansichten (ganz Europa), erst bei Bedarf berechnet. */
let boegenGrob: number[][] | null = null;
const GROB_TOL = 3;

/** Sichtbarer Ausschnitt in Weltkoordinaten (aus der Transformation des Kontexts). */
const sichtbar = (ctx: CanvasRenderingContext2D) => {
  const m = ctx.getTransform();
  return { x0: -m.e / m.a, y0: -m.f / m.d, x1: (ctx.canvas.width - m.e) / m.a, y1: (ctx.canvas.height - m.f) / m.d };
};

/** Besitzflaechen, Kreis-, Bundesland- und Staatsgrenzen und ggf. die Auswahl (ctx steht auf Weltkoordinaten). */
export function zeichneGebiete(ctx: CanvasRenderingContext2D, stil: GebietStil): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const v = sichtbar(ctx);
  const drin = (x0: number, y0: number, x1: number, y1: number) => x1 >= v.x0 && x0 <= v.x1 && y1 >= v.y0 && y0 <= v.y1;
  for (const g of GEBIETE) {
    if (!drin(g.box.x0, g.box.y0, g.box.x1, g.box.y1)) continue;
    const f = stil.farbe(g);
    if (!f) continue;
    ctx.beginPath(); pfad(ctx, g.ringe);
    ctx.globalAlpha = f.deckung; ctx.fillStyle = f.farbe; ctx.fill('evenodd');
  }
  ctx.globalAlpha = 1;
  const strich = stil.strich ?? '50,50,42';
  // Grenzen je Stufe: Kreis duenn und hell, Bundesland kraeftiger, Staat/Kueste am kraeftigsten. Weit herausgezoomt
  // (ganz Europa) waeren die Kreisgrenzen nur noch ein graues Netz, dann nur Regionen und Staaten.
  const STUFEN: [number, number, number][] = [[1, 0.45, 0.35], [2, 1.0, 0.6], [3, 1.3, 0.7]];
  // Weit herausgezoomt (eine Welteinheit deutlich unter 1 Pixel) die groben Boegen: gleich aussehend, viel schneller.
  const grob = stil.linie > 2.5;
  if (grob && !boegenGrob) boegenGrob = BOEGEN.map((b) => vereinfacht(b, GROB_TOL));
  const boegen = grob ? boegenGrob! : BOEGEN;
  // Runde Enden/Ecken kosten bei tausenden Einzelboegen viel Zeichenzeit; herausgezoomt sieht man den Unterschied nicht.
  if (grob) { ctx.lineCap = 'butt'; ctx.lineJoin = 'bevel'; }
  for (const [st, breite, deck] of STUFEN) {
    if (st === 1 && stil.linie > 4.5) continue;
    ctx.beginPath();
    GEBIET_STUFE.forEach((s, i) => {
      if (s !== st) return;
      const bb = BOGEN_BOX[i];
      if (!drin(bb[0], bb[1], bb[2], bb[3])) return;
      const b = boegen[i];
      ctx.moveTo(b[0], b[1]);
      for (let k = 2; k < b.length; k += 2) ctx.lineTo(b[k], b[k + 1]);
    });
    if (st === 1) GEBIETE.forEach((g) => { if (g.typ === 2 && drin(g.box.x0, g.box.y0, g.box.x1, g.box.y1)) pfad(ctx, g.ringe); });
    ctx.strokeStyle = 'rgba(' + strich + ',' + deck + ')';
    ctx.lineWidth = stil.linie * breite;
    ctx.stroke();
  }
  const w = stil.wahl != null ? nachId.get(stil.wahl) : null;
  if (w) {
    ctx.beginPath(); pfad(ctx, w.ringe);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = stil.linie * 3.2; ctx.stroke();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = stil.linie * 1.8; ctx.stroke();
  }
  if (stil.namen) {
    ctx.fillStyle = 'rgba(' + strich + ',.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 600 11px system-ui, sans-serif';
    for (const [n, la, lo] of BL_SCHRIFT) {
      ctx.fillText(n, (lo - KARTE_PROJ.lon0) * KARTE_PROJ.cos * KARTE_PROJ.s + KARTE_PROJ.rand, (KARTE_PROJ.lat0 - la) * KARTE_PROJ.s + KARTE_PROJ.rand);
    }
  }
  ctx.restore();
}

/**
 * Gebietsnamen (Kurzform) in die Gebiete schreiben, sobald ein Gebiet gross genug dafuer ist. Die Schrift wird in
 * Geraetepixeln gesetzt (schrift = Schriftgroesse), damit sie bei jedem Zoom gleich gross und scharf bleibt;
 * ctx steht auf Weltkoordinaten. Lange Doppelnamen ("Charlottenburg-Wilmersdorf") werden notfalls umbrochen.
 */
export function beschrifteGebiete(ctx: CanvasRenderingContext2D, schrift: number): void {
  const m = ctx.getTransform(), px = m.a;
  if (px <= 0) return;
  const sx0 = -m.e / px, sx1 = (ctx.canvas.width - m.e) / px, sy0 = -m.f / m.d, sy1 = (ctx.canvas.height - m.f) / m.d;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '600 ' + Math.round(schrift) + 'px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = schrift * 0.28;
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.fillStyle = 'rgba(35,38,43,.88)';
  for (const g of GEBIETE) {
    const b = g.box;
    if (b.x1 < sx0 || b.x0 > sx1 || b.y1 < sy0 || b.y0 > sy1) continue;
    const bw = (b.x1 - b.x0) * px, bh = (b.y1 - b.y0) * m.d;
    if (bw < schrift * 4 || bh < schrift * 1.6) continue;
    const n = kurzName(g);
    let zeilen = [n];
    if (ctx.measureText(n).width > bw * 0.85) {
      const i = n.indexOf('-', n.length / 3);
      zeilen = i > 0 ? [n.slice(0, i + 1), n.slice(i + 1)] : [];
      if (!zeilen.length || Math.max(...zeilen.map((z) => ctx.measureText(z).width)) > bw * 0.85 || bh < schrift * 3) continue;
    }
    const p = innererPunkt(g), x = m.a * p.x + m.e, y = m.d * p.y + m.f;
    zeilen.forEach((z, j) => {
      const yz = y + (j - (zeilen.length - 1) / 2) * schrift * 1.1;
      ctx.strokeText(z, x, yz);
      ctx.fillText(z, x, yz);
    });
  }
  ctx.restore();
}

/** Ein Gebiet allein umranden (z. B. unter dem Mauszeiger). */
export function umrandeGebiet(ctx: CanvasRenderingContext2D, g: Gebiet, farbe: string, breite: number): void {
  ctx.beginPath(); pfad(ctx, g.ringe);
  ctx.strokeStyle = farbe; ctx.lineWidth = breite; ctx.lineJoin = 'round'; ctx.stroke();
}
