/**
 * Gleisbau Tycoon -- Spielzeit: Kalender und Uhr laufen mit der Spielzeit (S.time), nicht mit der echten Uhr.
 * Ein Spieltag dauert TAG_SEK Sekunden (bei Tempo 1), das Datum springt je Spieltag um 10 Tage (1., 11., 21.),
 * so vergeht ein Jahr in 36 Spieltagen und jede Jahreszeit kommt in einer Spielrunde vor. Der Sonnenstand haengt
 * von Datum, Uhrzeit und Breitengrad ab: im Norden sind die Winternaechte lang, die Sommernaechte kurz.
 */

/** Sekunden Spielzeit je Spieltag (eine Spielstunde = 6,25 s). */
export const TAG_SEK = 150;
/** Spieltage je Monat (Datum 1., 11., 21.). */
export const TAGE_JE_MONAT = 3;
/** Das Spiel beginnt am 1. Maerz um 6 Uhr. */
const START_MONAT = 2, START_STUNDE = 6, START_JAHR = 2026;
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
/** Jahreszeit-Index (JAHRESZEITEN in tycoon-wetter.ts) je Monat: Maerz-Mai Fruehling, Juni-Aug. Sommer, Sep.-Nov. Herbst. */
const JZ_JE_MONAT = [3, 3, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3];

export interface Spielzeit {
  /** Spieltag ab 0. */
  tag: number;
  jahr: number; monat: number; tagImMonat: number;
  /** 0 = Montag ... 6 = Sonntag. */
  wochentag: number;
  /** Uhrzeit in Stunden (0..24, mit Nachkommastellen). */
  stunde: number;
  /** Tag im Jahr (1..365) fuer den Sonnenstand. */
  doy: number;
  jahreszeit: number;
}

export function spielzeit(t: number): Spielzeit {
  const tage = Math.max(0, t) / TAG_SEK + START_STUNDE / 24, tag = Math.floor(tage), stunde = (tage - tag) * 24;
  const mi = START_MONAT + Math.floor(tag / TAGE_JE_MONAT), monat = mi % 12, tagImMonat = 1 + (tag % TAGE_JE_MONAT) * 10;
  return { tag, jahr: START_JAHR + Math.floor(mi / 12), monat, tagImMonat, wochentag: tag % 7, stunde, doy: Math.round(monat * 30.44 + tagImMonat), jahreszeit: JZ_JE_MONAT[monat] };
}

/** "Mi, 11. März 2026" */
export const datumText = (z: Spielzeit): string => WOCHENTAGE[z.wochentag] + ', ' + z.tagImMonat + '. ' + MONATE[z.monat] + ' ' + z.jahr;
/** "14:30" (auf 10 Minuten, damit die Anzeige nicht flackert). */
export const uhrText = (z: Spielzeit): string => {
  const min = Math.floor(z.stunde * 6) * 10, h = Math.floor(min / 60) % 24, m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};
export const istWochenende = (z: Spielzeit): boolean => z.wochentag >= 5;

/** Sonnenhoehe in Grad fuer Tag im Jahr, Ortszeit (Stunden) und Breite (Grad). */
export function sonnenHoeheBei(doy: number, stunde: number, breite: number): number {
  const r = Math.PI / 180, dekl = -23.44 * Math.cos((2 * Math.PI / 365) * (doy + 10)) * r, phi = breite * r, ha = (stunde - 12) * 15 * r;
  return Math.asin(Math.sin(phi) * Math.sin(dekl) + Math.cos(phi) * Math.cos(dekl) * Math.cos(ha)) / r;
}
/** Dunkelheit 0 (Tag) .. 1 (Nacht) aus der Sonnenhoehe, Daemmerung zwischen +4 und -8 Grad. */
export const dunkelAus = (h: number): number => (h >= 4 ? 0 : h <= -8 ? 1 : (4 - h) / 12);
