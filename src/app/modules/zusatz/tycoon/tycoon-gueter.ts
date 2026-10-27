/**
 * Gleisbau Tycoon -- Gueterverkehr. Jede Stadt (bzw. das Gebiet eines eigenen Bahnhofs) liefert eine Ware. Steht an
 * einem Streckenende ein Gueterbahnhof, kommen Lieferauftraege: n Ladungen bis zum anderen Ende, gefahren von eigenen
 * Zuegen, die diese Ware laden koennen (ZugTyp.gueter in tycoon-zuege.ts). Indizes stehen im Spielstand -- nur anhaengen.
 */

export const WAREN = [
  { n: 'Holz', icon: '🪵' },
  { n: 'Kohle', icon: '⚫' },
  { n: 'Container', icon: '📦' },
  { n: 'Chemie', icon: '🧪' },
  { n: 'Getreide', icon: '🌾' },
  { n: 'Stahl', icon: '🔩' },
  { n: 'Autos', icon: '🚗' },
];

/** Ware je Stadt (Index in CITIES, siehe tycoon-karte.ts) -- grob nach typischer Industrie/Hafen der Gegend. */
const STADT_WARE = [2, 2, 4, 6, 3, 6, 1, 3, 3, 5, 6, 6, 2, 2, 4, 4, 6, 4, 3, 3, 0, 5, 6, 4, 5,
  2, 2, 3, 5, 4, 3, 0, 0, 5, 6, 1, 4, 1];
/** Laendliche Gebiete (eigene Bahnhoefe): vor allem Holz und Getreide. */
const LAND_WAREN = [0, 4, 0, 4, 1, 5, 4];

export const wareVonStadt = (c: number): number => STADT_WARE[c] ?? 4;
export const wareVonGebiet = (id: number): number => LAND_WAREN[Math.abs(id * 2654435761 | 0) % LAND_WAREN.length];

export const GUETERBAHNHOF = { n: 'Güterbahnhof', preis: 3000, text: 'Ladestelle für Güterzüge: Hier entstehen Lieferaufträge zum anderen Ende deiner Strecken.' };
/** Hoechstens so viele offene Auftraege; neuer Auftrag alle AUFTRAG_TAKT Spielsekunden (Zufall dazu). */
export const MAX_AUFTRAEGE = 3, AUFTRAG_TAKT = 90;

export interface Auftrag { id: number; line: number; von: number; nach: number; ware: number; menge: number; geliefert: number; bis: number; lohn: number }
