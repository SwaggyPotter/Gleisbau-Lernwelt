import { GEBIET_BOEGEN, GEBIET_STUFE, GEBIETE_ROH } from './tycoon-gebiete-daten';
import { STADT_BEZIRKE } from './tycoon-bezirke-daten';
import { CITIES, KARTE_PROJ } from './tycoon-karte';

/**
 * Kaufbare Gebiete des Tycoon: in Deutschland alle Landkreise und kreisfreien Staedte, in Berlin und Hamburg
 * die Bezirke, im Ausland die NUTS-3-Regionen. Strecken duerfen nur ueber eigene Gebiete (oder die aktiver
 * Clan-Mitglieder) gezeichnet werden. Grenzen: Eurostat GISCO / EuroGeographics, Berlin/Hamburg: OpenStreetMap.
 */

/** Wert der Spalte tycoon_bezirke.stadt fuer Gebiete (alte Stadtbezirke hatten dort den Stadt-Index 0..99). */
export const GEBIET_STADT = 100;
export const GEBIET_QUELLE = 'Grenzen: © EuroGeographics (Eurostat GISCO), Berlin/Hamburg: © OpenStreetMap-Mitwirkende (ODbL)';

export interface Gebiet {
  /** Feste Kennung, so wird Besitz gespeichert: NUTS-ID als Zahl zur Basis 36, Bezirke: OSM-Relation. */
  id: number;
  n: string;
  /** Laenderkuerzel (DE, NL, ...). */
  land: string;
  /** NUTS-1-Kennung (in Deutschland = Bundesland, z. B. DE2 = Bayern). */
  bl: string;
  /** 0 Landkreis, 1 kreisfreie Stadt, 2 Bezirk (Berlin/Hamburg), 3 Region im Ausland. */
  typ: number;
  /** Flaeche in Welteinheiten^2 (ungefaehr km^2). */
  f: number;
  /** Grundpreis; Uebernahme von anderen kostet das Dreifache. */
  basis: number;
  /** Ringe x0,y0,x1,y1,... in Weltkoordinaten (Loecher nach evenodd-Regel). */
  ringe: number[][];
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Spielstaedte (Index in CITIES), die in diesem Gebiet liegen. */
  staedte: number[];
}

export const BUNDESLAENDER: Record<string, string> = {
  DE1: 'Baden-Württemberg', DE2: 'Bayern', DE3: 'Berlin', DE4: 'Brandenburg', DE5: 'Bremen', DE6: 'Hamburg', DE7: 'Hessen',
  DE8: 'Mecklenburg-Vorpommern', DE9: 'Niedersachsen', DEA: 'Nordrhein-Westfalen', DEB: 'Rheinland-Pfalz', DEC: 'Saarland',
  DED: 'Sachsen', DEE: 'Sachsen-Anhalt', DEF: 'Schleswig-Holstein', DEG: 'Thüringen',
};
export const LAND_NAMEN: Record<string, string> = {
  DE: 'Deutschland', NL: 'Niederlande', BE: 'Belgien', LU: 'Luxemburg', FR: 'Frankreich', CH: 'Schweiz', LI: 'Liechtenstein',
  AT: 'Österreich', CZ: 'Tschechien', PL: 'Polen', DK: 'Dänemark', SE: 'Schweden',
};
/** Beschriftung der Bundeslaender (Breite, Laenge), so gesetzt, dass sie nicht auf den Stadtnamen liegt. Stadtstaaten ohne. */
const BL_SCHRIFT: [string, number, number][] = [
  ['Baden-Württemberg', 48.45, 9.25], ['Bayern', 49.15, 11.95], ['Brandenburg', 52.05, 13.95], ['Hessen', 50.55, 9.05],
  ['Mecklenburg-Vorpommern', 53.72, 12.55], ['Niedersachsen', 52.85, 8.85], ['Nordrhein-Westfalen', 51.2, 7.95],
  ['Rheinland-Pfalz', 49.95, 7.35], ['Saarland', 49.47, 6.78], ['Sachsen', 50.78, 13.05], ['Sachsen-Anhalt', 51.7, 11.65],
  ['Schleswig-Holstein', 54.12, 9.45], ['Thüringen', 50.68, 11.3],
];

/* ---------- Daten aufbereiten ---------- */
const BOEGEN: number[][] = GEBIET_BOEGEN.map((s) => {
  const v = s.split(',').map(Number), o: number[] = [v[0] / 10, v[1] / 10];
  for (let i = 2; i < v.length; i += 2) o.push(+(o[i - 2] + v[i] / 10).toFixed(1), +(o[i - 1] + v[i + 1] / 10).toFixed(1));
  return o;
});
const bogen = (ref: number): number[] => {
  if (ref >= 0) return BOEGEN[ref];
  const b = BOEGEN[~ref], r: number[] = [];
  for (let i = b.length - 2; i >= 0; i -= 2) r.push(b[i], b[i + 1]);
  return r;
};
const ringAus = (refs: number[]): number[] => refs.flatMap((ref, i) => (i ? bogen(ref).slice(2) : bogen(ref)));

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
const preisVon = (f: number, typ: number, mitStadt: boolean): number => {
  let p = 100 + 0.2 * f;
  if (typ === 1 || typ === 2) p = Math.max(p, 250);
  p = Math.min(p, 900) * (mitStadt ? 1.5 : 1);
  return Math.round(p / 50) * 50;
};
const anzeigeName = (n: string, typ: number): string => {
  n = n.replace(/ \(DE\)$/, '');
  if (typ === 0 && !/kreis|Kreis|Region|Landkreis|Städteregion|Regionalverband/.test(n)) return 'Landkreis ' + n;
  if (typ === 1) return n + ' (Stadt)';
  return n;
};

const liste: Omit<Gebiet, 'basis' | 'box' | 'staedte' | 'f'>[] = [];
for (const g of GEBIETE_ROH) {
  // Berlin und Hamburg: statt des ganzen Stadtstaats seine Bezirke (OpenStreetMap).
  const stadtstaat = g.id === 'DE300' ? 0 : g.id === 'DE600' ? 1 : -1;
  if (stadtstaat >= 0) {
    for (const b of STADT_BEZIRKE[stadtstaat]) liste.push({ id: b.osm, n: b.n, land: 'DE', bl: g.id.slice(0, 3), typ: 2, ringe: b.r });
    continue;
  }
  liste.push({ id: parseInt(g.id, 36), n: anzeigeName(g.n, g.t), land: g.l, bl: g.id.slice(0, 3), typ: g.t, ringe: g.r.map(ringAus) });
}
export const GEBIETE: Gebiet[] = liste.map((g) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  g.ringe.forEach((r) => { for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } });
  // Flaeche: Ringe, die in einem anderen Ring desselben Gebiets liegen, sind Loecher.
  const f = g.ringe.reduce((a, r, i) => a + ringFlaeche(r) * (g.ringe.some((o, j) => j !== i && imRingFlach(o, r[0], r[1])) ? -1 : 1), 0);
  const geb: Gebiet = { ...g, f: Math.round(f), basis: 0, box: { x0, y0, x1, y1 }, staedte: [] };
  geb.staedte = CITIES.map((c, i) => (imGebiet(geb, c.x, c.y) ? i : -1)).filter((i) => i >= 0);
  geb.basis = preisVon(geb.f, geb.typ, geb.staedte.length > 0);
  return geb;
});
const nachId = new Map(GEBIETE.map((g) => [g.id, g]));
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

/** Besitzflaechen, Kreis-, Bundesland- und Staatsgrenzen und ggf. die Auswahl (ctx steht auf Weltkoordinaten). */
export function zeichneGebiete(ctx: CanvasRenderingContext2D, stil: GebietStil): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const g of GEBIETE) {
    const f = stil.farbe(g);
    if (!f) continue;
    ctx.beginPath(); pfad(ctx, g.ringe);
    ctx.globalAlpha = f.deckung; ctx.fillStyle = f.farbe; ctx.fill('evenodd');
  }
  ctx.globalAlpha = 1;
  const strich = stil.strich ?? '50,50,42';
  // Grenzen je Stufe: Kreis duenn und hell, Bundesland kraeftiger, Staat/Kueste am kraeftigsten.
  const STUFEN: [number, number, number][] = [[1, 0.45, 0.35], [2, 1.0, 0.6], [3, 1.3, 0.7]];
  for (const [st, breite, deck] of STUFEN) {
    ctx.beginPath();
    GEBIET_STUFE.forEach((s, i) => {
      if (s !== st) return;
      const b = BOEGEN[i];
      ctx.moveTo(b[0], b[1]);
      for (let k = 2; k < b.length; k += 2) ctx.lineTo(b[k], b[k + 1]);
    });
    if (st === 1) GEBIETE.forEach((g) => { if (g.typ === 2) pfad(ctx, g.ringe); });
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

/** Ein Gebiet allein umranden (z. B. unter dem Mauszeiger). */
export function umrandeGebiet(ctx: CanvasRenderingContext2D, g: Gebiet, farbe: string, breite: number): void {
  ctx.beginPath(); pfad(ctx, g.ringe);
  ctx.strokeStyle = farbe; ctx.lineWidth = breite; ctx.lineJoin = 'round'; ctx.stroke();
}
