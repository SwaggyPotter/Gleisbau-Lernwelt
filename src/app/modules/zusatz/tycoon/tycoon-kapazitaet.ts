/**
 * Gleisbau Tycoon -- Streckenkapazitaet. Wie viele Zuege eine Strecke gleichzeitig vertraegt, haengt von der Zahl der
 * Gleise und der Signaltechnik ab. Mehr Zuege als Kapazitaet = Verspaetungen: alle fahren langsamer, die Puenktlichkeit
 * sinkt und mit ihr die Einnahmen. Mehr Kapazitaet lockt auch mehr Fremdzuege (Trassenentgelt) an.
 */

export const SIGNALE = [
  { n: 'Formsignale', plus: 0, jeEinheit: 0, text: 'Mechanische Signale, Blockabstände lang.' },
  { n: 'Ks-Signale', plus: 2, jeEinheit: 2, text: 'Lichtsignale mit kürzeren Blockabschnitten: 2 Züge mehr.' },
  { n: 'ETCS Level 2', plus: 4, jeEinheit: 5, text: 'Zugbeeinflussung per Funk, Fahrt im dichten Abstand: 4 Züge mehr als Formsignale.' },
];
/** Zweites Gleis: verdoppelt die Grundkapazitaet. */
export const ZWEIGLEISIG = { jeEinheit: 6, text: 'Zweites Gleis: Züge in Gegenrichtung warten nicht mehr auf Kreuzungen.' };
export const GRUND_KAPAZITAET = 3;
/** Hoechstens so viele Fremdzuege gleichzeitig auf einer Strecke. */
export const MAX_FREMD = 6;

export const kapazitaet = (gleise: number, signal: number): number => GRUND_KAPAZITAET * (gleise === 2 ? 2 : 1) + (SIGNALE[signal]?.plus ?? 0);
/** Einnahmen-Faktor aus der Puenktlichkeit (0..100). */
export const puenktFaktor = (p: number): number => 0.7 + 0.3 * p / 100;
