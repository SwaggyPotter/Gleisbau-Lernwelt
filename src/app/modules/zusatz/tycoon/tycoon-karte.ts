import { DEUTSCHLAND, KARTE_H, KARTE_PROJ, KARTE_W, NACHBARN } from './tycoon-karte-daten';

/**
 * Spielkarte des Tycoon: Deutschland (Natural Earth, Public Domain) in Weltkoordinaten
 * (KARTE_W x KARTE_H, y nach Sueden). Staedte stehen an ihren echten Koordinaten.
 */
export { DEUTSCHLAND, KARTE_H, KARTE_W, NACHBARN };

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
];

const imRing = (r: number[], x: number, y: number): boolean => {
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

/** Zeichnet Meer, Nachbarlaender, Deutschland und Laendernamen in einen 2D-Kontext (bereits auf Weltkoordinaten transformiert). */
export function zeichneKarte(
  ctx: CanvasRenderingContext2D,
  farben = { meer: '#bcd6e6', ausland: '#e9e5da', land: '#f4f1ea', grenze: '#8a8577', schrift: 'rgba(60,60,50,.35)' },
  linie = 1.5,
): void {
  ctx.fillStyle = farben.meer;
  ctx.fillRect(-80, -80, KARTE_W + 160, KARTE_H + 160);
  const ring = (r: number[]) => {
    ctx.beginPath();
    ctx.moveTo(r[0], r[1]);
    for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]);
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  ctx.fillStyle = farben.ausland;
  for (const r of NACHBARN) { ring(r); ctx.fill(); }
  ctx.strokeStyle = farben.grenze;
  ctx.lineWidth = linie * 0.6;
  for (const r of NACHBARN) { ring(r); ctx.stroke(); }
  ctx.fillStyle = farben.land;
  for (const r of DEUTSCHLAND) { ring(r); ctx.fill(); }
  ctx.lineWidth = linie;
  for (const r of DEUTSCHLAND) { ring(r); ctx.stroke(); }
  ctx.fillStyle = farben.schrift;
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const l of LAENDER_NAMEN) ctx.fillText(l.n.split('').join(' '), l.x, l.y);
}
