/**
 * Gleisbau Tycoon -- Ausschreibungen. Ein Bundesland, in dem du Strecken hast, schreibt seinen Regionalverkehr aus.
 * Du bietest einen Zuschuss je Minute (weniger = besser) und versprichst eine Puenktlichkeit (hoeher = besser, aber
 * strenger). Mitbewerber sind ausgedachte Firmen. Wer gewinnt, bekommt den Zuschuss, solange die eigenen Strecken
 * im Land puenktlich genug sind -- sonst nur ein Teil.
 */

/** Ausgedachte Mitbewerber (keine echten Unternehmen). */
export const MITBEWERBER = ['Nordlicht Express', 'Mittelland Regio', 'Alpenblick Bahn', 'Talwind Verkehr', 'Kreuzweg Schienen', 'Morgenrot Linien', 'Heideland Bahn'];

export const GEBOTE = [
  { n: 'Knapp kalkuliert', f: 0.8 },
  { n: 'Marktüblich', f: 0.95 },
  { n: 'Großzügig', f: 1.1 },
];
export const VERSPRECHEN = [
  { p: 80, f: 1 },
  { p: 90, f: 0.92 },
  { p: 95, f: 0.85 },
];
/** Bewerbungsfrist und Vertragsdauer (Spielsekunden), neue Ausschreibung etwa alle AUSSCHREIBUNG_TAKT. */
export const FRIST = 120, VERTRAG = 600, AUSSCHREIBUNG_TAKT = 360;
/** Bei verfehlter Puenktlichkeit gibt es nur diesen Anteil. */
export const MALUS = 0.3;

export interface Ausschreibung { bl: string; richt: number; bis: number; gegner: { n: string; gebot: number }[]; gebot?: number; versprechen?: number }
export interface Vertrag { bl: string; proMin: number; versprechen: number; bis: number; dauer: number; erfuellt: number; warn?: boolean }
