import { EUROPA, KARTE_H, KARTE_PROJ, KARTE_W, NACHBARN } from './tycoon-karte-daten';
import { DEUTSCHLAND_NUTS } from './tycoon-gebiete-daten';

/**
 * Spielkarte des Tycoon in Weltkoordinaten (KARTE_W x KARTE_H, y nach Sueden). Europa: Natural Earth (Public Domain);
 * Deutschland: Umriss aus denselben Grenzen wie die Landkreise (tycoon-gebiete-daten.ts), damit alles zusammenpasst.
 * Staedte stehen an ihren echten Koordinaten.
 */
const DEUTSCHLAND = DEUTSCHLAND_NUTS;
export { DEUTSCHLAND, EUROPA, KARTE_H, KARTE_PROJ, KARTE_W, NACHBARN };

/** Massstab 2D-Welt -> 3D und Umrechnung (Kartenmitte = 3D-Ursprung, Norden = +z). */
export const SC = 0.1;
export const wx = (x: number): number => (x - KARTE_W / 2) * SC;
export const wz = (y: number): number => -(y - KARTE_H / 2) * SC;

const proj = (lat: number, lon: number) => ({
  x: Math.round((lon - KARTE_PROJ.lon0) * KARTE_PROJ.cos * KARTE_PROJ.s + KARTE_PROJ.rand),
  y: Math.round((KARTE_PROJ.lat0 - lat) * KARTE_PROJ.s + KARTE_PROJ.rand),
});

/**
 * Staedte. Reihenfolge NICHT aendern, nur hinten anhaengen: Spielstaende speichern Strecken als
 * Stadt-Indizes und die aufgedeckten Staedte als Liste in dieser Reihenfolge.
 * land = ISO-Kuerzel, nur fuer Staedte ausserhalb Deutschlands gesetzt.
 */
export const CITIES: { n: string; x: number; y: number; land?: string }[] = [
  { n: 'Berlin', ...proj(52.520, 13.405) },
  { n: 'Hamburg', ...proj(53.551, 9.994) },
  { n: 'Rostock', ...proj(54.092, 12.099) },
  { n: 'Hannover', ...proj(52.376, 9.732) },
  { n: 'Leipzig', ...proj(51.340, 12.375) },
  { n: 'Dresden', ...proj(51.050, 13.738) },
  { n: 'Dortmund', ...proj(51.514, 7.468) },
  { n: 'Köln', ...proj(50.938, 6.960) },
  { n: 'Frankfurt', ...proj(50.110, 8.682) },
  { n: 'Nürnberg', ...proj(49.454, 11.077) },
  { n: 'Stuttgart', ...proj(48.776, 9.183) },
  { n: 'München', ...proj(48.137, 11.576) },
  // Ausbau 2026-10-20: weitere deutsche Staedte
  { n: 'Bremen', ...proj(53.079, 8.802) },
  { n: 'Kiel', ...proj(54.323, 10.123) },
  { n: 'Magdeburg', ...proj(52.120, 11.628) },
  { n: 'Erfurt', ...proj(50.978, 11.029) },
  { n: 'Kassel', ...proj(51.312, 9.479) },
  { n: 'Münster', ...proj(51.961, 7.626) },
  { n: 'Mannheim', ...proj(49.487, 8.466) },
  { n: 'Karlsruhe', ...proj(49.007, 8.404) },
  { n: 'Freiburg', ...proj(47.999, 7.842) },
  { n: 'Augsburg', ...proj(48.371, 10.898) },
  { n: 'Regensburg', ...proj(49.013, 12.102) },
  { n: 'Würzburg', ...proj(49.792, 9.953) },
  { n: 'Saarbrücken', ...proj(49.240, 6.997) },
  // Ausbau 2026-10-20: Anschluss ans Ausland
  { n: 'Kopenhagen', land: 'DK', ...proj(55.676, 12.568) },
  { n: 'Amsterdam', land: 'NL', ...proj(52.370, 4.895) },
  { n: 'Brüssel', land: 'BE', ...proj(50.850, 4.352) },
  { n: 'Luxemburg', land: 'LU', ...proj(49.611, 6.130) },
  { n: 'Straßburg', land: 'FR', ...proj(48.573, 7.752) },
  { n: 'Zürich', land: 'CH', ...proj(47.377, 8.541) },
  { n: 'Innsbruck', land: 'AT', ...proj(47.269, 11.404) },
  { n: 'Salzburg', land: 'AT', ...proj(47.809, 13.055) },
  { n: 'Wien', land: 'AT', ...proj(48.208, 16.373) },
  { n: 'Prag', land: 'CZ', ...proj(50.075, 14.437) },
  { n: 'Breslau', land: 'PL', ...proj(51.108, 17.038) },
  { n: 'Posen', land: 'PL', ...proj(52.406, 16.925) },
  { n: 'Stettin', land: 'PL', ...proj(53.428, 14.553) },
];

/** Grossstaedte: Hochhaeuser in der 3D-Deko. */
export const GROSSSTADT = new Set(['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Amsterdam', 'Brüssel', 'Kopenhagen', 'Wien', 'Prag', 'Zürich']);

/** Feste Farbe je Spieler (aus der Konto-ID), falls er in keinem Clan ist. */
export function spielerFarbe(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360, s = 0.65, l = 0.5;
  const f = (n: number) => {
    const k = (n + hue / 30) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

/** Laendernamen auf der Karte (Position in Breitengrad/Laengengrad). */
const LAENDER_NAMEN = [
  { n: 'DEUTSCHLAND', ...proj(50.55, 10.2) },
  { n: 'DÄNEMARK', ...proj(55.95, 9.3) },
  { n: 'SCHWEDEN', ...proj(56.0, 13.9) },
  { n: 'NIEDERLANDE', ...proj(52.75, 5.75) },
  { n: 'BELGIEN', ...proj(50.25, 5.0) },
  { n: 'FRANKREICH', ...proj(48.0, 5.4) },
  { n: 'SCHWEIZ', ...proj(46.9, 7.6) },
  { n: 'ÖSTERREICH', ...proj(47.2, 14.4) },
  { n: 'TSCHECHIEN', ...proj(49.6, 15.6) },
  { n: 'POLEN', ...proj(52.9, 16.4) },
].map((l) => ({ ...l, gross: false }));
/** Laendernamen ausserhalb des Spielgebiets (groessere Schrift fuer die Europa-Ansicht). */
const EUROPA_NAMEN = [
  ['GROSSBRITANNIEN', 53.0, -1.6], ['IRLAND', 53.2, -8.0], ['SPANIEN', 40.0, -3.7], ['PORTUGAL', 39.6, -8.1], ['ITALIEN', 42.8, 12.6],
  ['NORWEGEN', 61.5, 9.0], ['SCHWEDEN', 62.5, 15.5], ['FINNLAND', 63.0, 26.5], ['ESTLAND', 58.7, 25.6], ['LETTLAND', 56.9, 25.2],
  ['LITAUEN', 55.4, 23.9], ['BELARUS', 53.6, 28.0], ['UKRAINE', 49.2, 31.0], ['SLOWAKEI', 48.7, 19.6], ['UNGARN', 47.1, 19.4],
  ['RUMÄNIEN', 45.9, 24.9], ['SERBIEN', 44.0, 20.9], ['KROATIEN', 45.3, 16.2], ['BULGARIEN', 42.7, 25.2], ['GRIECHENLAND', 39.6, 22.0],
  ['TÜRKEI', 39.2, 33.0], ['ALGERIEN', 34.8, 3.0], ['TUNESIEN', 34.6, 9.4],
].map(([n, la, lo]) => ({ n: n as string, ...proj(la as number, lo as number), gross: true }));

export const imRing = (r: number[], x: number, y: number): boolean => {
  let drin = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
};

/** Liegt der Punkt (Weltkoordinaten) in Deutschland? */
export function inDeutschland(x: number, y: number): boolean {
  return DEUTSCHLAND.some((r) => imRing(r, x, y));
}

/** Liegt der Punkt auf Land (Deutschland oder Nachbarland, nicht im Meer)? */
export function aufLand(x: number, y: number): boolean {
  return inDeutschland(x, y) || NACHBARN.some((r) => imRing(r, x, y));
}

/**
 * Zeichnet Meer, Laender Europas, Deutschland und Laendernamen in einen 2D-Kontext (bereits auf Weltkoordinaten
 * transformiert). Mit relief werden die Landflaechen mit dem Hoehenrelief gefuellt (statt Flaechenfarbe).
 */
export function zeichneKarte(
  ctx: CanvasRenderingContext2D,
  farben = { meer: '#bcd6e6', ausland: '#e9e5da', land: '#f4f1ea', grenze: '#8a8577', schrift: 'rgba(60,60,50,.35)' },
  linie = 1.5,
  relief?: { bild: CanvasImageSource; x0: number; y0: number; w: number; h: number } | null,
  bereich = { x0: EUROPA.x0, y0: EUROPA.y0, x1: EUROPA.x1, y1: EUROPA.y1 },
): void {
  ctx.fillStyle = farben.meer;
  ctx.fillRect(bereich.x0, bereich.y0, bereich.x1 - bereich.x0, bereich.y1 - bereich.y0);
  const pfad = (ringe: number[][]) => {
    ctx.beginPath();
    for (const r of ringe) {
      ctx.moveTo(r[0], r[1]);
      for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]);
      ctx.closePath();
    }
  };
  ctx.lineJoin = 'round';
  if (relief) {
    ctx.save();
    pfad([...NACHBARN, ...DEUTSCHLAND]);
    ctx.clip();
    ctx.drawImage(relief.bild, relief.x0, relief.y0, relief.w, relief.h);
    ctx.restore();
    // Spielgebiet Deutschland leicht aufhellen
    pfad(DEUTSCHLAND); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
  } else {
    pfad(NACHBARN); ctx.fillStyle = farben.ausland; ctx.fill();
    pfad(DEUTSCHLAND); ctx.fillStyle = farben.land; ctx.fill();
  }
  ctx.strokeStyle = farben.grenze;
  ctx.lineWidth = linie * 0.6;
  pfad(NACHBARN); ctx.stroke();
  ctx.lineWidth = linie;
  pfad(DEUTSCHLAND); ctx.stroke();
  ctx.fillStyle = farben.schrift;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const l of [...LAENDER_NAMEN, ...EUROPA_NAMEN]) {
    if (l.x < bereich.x0 || l.x > bereich.x1 || l.y < bereich.y0 || l.y > bereich.y1) continue;
    ctx.font = '700 ' + (l.gross ? 46 : 22) + 'px system-ui, sans-serif';
    ctx.fillText(l.n.split('').join(' '), l.x, l.y);
  }
}
