/**
 * Schienenprofile fuer das Spiel "Schienen erkennen" (schienenraten-modul).
 *
 * QUELLE: Tim hat eine Tabellenuebersicht (Foto) mit sieben Schienenformen
 * und ihren Profilen geschickt (2026-08-17). Die Werte hier sind von diesem
 * Foto abgetippt — bei einer derart dichten Tabelle ist ein Uebertragungs-
 * fehler nicht auszuschliessen. Vor Verwendung als gepruefter Lehrinhalt
 * (statt als Quiz-Datengrundlage) gegen die Originalquelle/Norm abgleichen.
 *
 * Die SVG-Silhouetten sind STILISIERTE Schemazeichnungen je Schienenform-
 * Familie, keine massstabsgetreuen Konstruktionszeichnungen — der Kopf-/
 * Fusshoehen-Anteil an der Gesamthoehe ist mangels Tabellenwert geschaetzt
 * (Kopf ca. 26 %, Fuss ca. 18 % der Gesamthoehe), nur Hoehe, Fussbreite,
 * Kopfbreite und Stegstaerke stammen direkt aus der Tabelle.
 */

export type SchienenKategorie =
  | 'leichte-vignol'
  | 'schwere-vignol'
  | 'kran'
  | 'rillen'
  | 'konstruktion'
  | 'spurrille'
  | 'stromschiene';

export interface KategorieInfo {
  id: SchienenKategorie;
  name: string;
  beschreibung: string;
}

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'leichte-vignol', name: 'Leichte Vignolschiene', beschreibung: 'Schlanker Kopf, duenner Steg, schmaler Fuss — fuer geringe Lasten (Feld-, Kranbahnen alter Bauart, Museumsbahnen).' },
  { id: 'schwere-vignol', name: 'Schwere Vignolschiene', beschreibung: 'Die klassische Eisenbahnschiene: breiter Fuss, schlanker Steg, kraeftiger Kopf. Heute meist als E-Profil (UIC).' },
  { id: 'kran', name: 'Kranschiene', beschreibung: 'Sehr robust, kaum Taillierung — traegt punktuelle Radlasten von Lauf- und Kranbahnen.' },
  { id: 'rillen', name: 'Rillenschiene', beschreibung: 'Straba-/Tramschiene mit Rille neben dem Kopf, damit der Spurkranz im Pflaster laeuft.' },
  { id: 'konstruktion', name: 'Konstruktionsschiene', beschreibung: 'Sammelbegriff fuer Sonderprofile (Z-, Flach- und Winkelformen) fuer Sonderzwecke abseits des freien Streckengleises.' },
  { id: 'spurrille', name: 'Spurrille (Herzstueck)', beschreibung: 'Niedriges, asymmetrisches Fuehrungsstueck an Weichen und Kreuzungen, fuehrt den Spurkranz durchs Herzstueck.' },
  { id: 'stromschiene', name: 'Stromschiene', beschreibung: 'Dritte Schiene zur Stromversorgung, meist ohne schlanken Steg — Pilzkopf auf breiter Basis.' },
];

export interface SchienenProfil {
  id: string;
  kategorie: SchienenKategorie;
  nameAlt: string;
  nameNeu?: string;
  hoeheMm: number;
  fussbreiteMm: number;
  kopfbreiteMm: number;
  stegstaerkeMm: number;
  gewichtKgM?: number;
}

export const PROFILE: SchienenProfil[] = [
  // --- Leichte Vignolschiene ---
  { id: 's7', kategorie: 'leichte-vignol', nameAlt: 'S 7', hoeheMm: 65, fussbreiteMm: 50, kopfbreiteMm: 25, stegstaerkeMm: 5, gewichtKgM: 6.75 },
  { id: 's10', kategorie: 'leichte-vignol', nameAlt: 'S 10', hoeheMm: 70, fussbreiteMm: 58, kopfbreiteMm: 32, stegstaerkeMm: 6, gewichtKgM: 10 },
  { id: 's14', kategorie: 'leichte-vignol', nameAlt: 'S 14', hoeheMm: 80, fussbreiteMm: 70, kopfbreiteMm: 38, stegstaerkeMm: 9, gewichtKgM: 14 },
  { id: 's18', kategorie: 'leichte-vignol', nameAlt: 'S 18', hoeheMm: 93, fussbreiteMm: 82, kopfbreiteMm: 43, stegstaerkeMm: 10, gewichtKgM: 18.3 },
  { id: 's20', kategorie: 'leichte-vignol', nameAlt: 'S 20', hoeheMm: 100, fussbreiteMm: 82, kopfbreiteMm: 44, stegstaerkeMm: 10, gewichtKgM: 19.8 },

  // --- Schwere Vignolschiene ---
  { id: 's30', kategorie: 'schwere-vignol', nameAlt: 'S 30', nameNeu: '30 E1', hoeheMm: 108, fussbreiteMm: 108, kopfbreiteMm: 60.3, stegstaerkeMm: 12.3, gewichtKgM: 30.03 },
  { id: 's33', kategorie: 'schwere-vignol', nameAlt: 'S 33', nameNeu: '33 E1', hoeheMm: 134, fussbreiteMm: 105, kopfbreiteMm: 58, stegstaerkeMm: 11, gewichtKgM: 33.47 },
  { id: 's41-10', kategorie: 'schwere-vignol', nameAlt: 'S 41/10', nameNeu: '41 E1', hoeheMm: 138, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 12, gewichtKgM: 41.38 },
  { id: 's41-14', kategorie: 'schwere-vignol', nameAlt: 'S 41/14', nameNeu: '40 E1', hoeheMm: 138, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 12, gewichtKgM: 49.43 },
  { id: 's49', kategorie: 'schwere-vignol', nameAlt: 'S 49', nameNeu: '49 E1', hoeheMm: 149, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 14, gewichtKgM: 54.54 },
  { id: 's54', kategorie: 'schwere-vignol', nameAlt: 'S 54', nameNeu: '54 E3', hoeheMm: 154, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 16, gewichtKgM: 54.54 },
  { id: 's64', kategorie: 'schwere-vignol', nameAlt: 'S 64', hoeheMm: 172, fussbreiteMm: 150, kopfbreiteMm: 74, stegstaerkeMm: 16, gewichtKgM: 64.92 },
  { id: 'uic54e', kategorie: 'schwere-vignol', nameAlt: 'UIC54E', hoeheMm: 161, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 16, gewichtKgM: 53.81 },
  { id: 'uic54', kategorie: 'schwere-vignol', nameAlt: 'UIC 54', nameNeu: '54 E1', hoeheMm: 159, fussbreiteMm: 140, kopfbreiteMm: 70, stegstaerkeMm: 16, gewichtKgM: 54.43 },
  { id: 'uic60', kategorie: 'schwere-vignol', nameAlt: 'UIC 60', nameNeu: '60 E1', hoeheMm: 172, fussbreiteMm: 150, kopfbreiteMm: 72, stegstaerkeMm: 16.5, gewichtKgM: 60.34 },
  { id: 'r65', kategorie: 'schwere-vignol', nameAlt: 'R65', hoeheMm: 180, fussbreiteMm: 150, kopfbreiteMm: 75, stegstaerkeMm: 18, gewichtKgM: 64.72 },

  // --- Kranschiene ---
  { id: 'a45', kategorie: 'kran', nameAlt: 'A 45', hoeheMm: 55, fussbreiteMm: 125, kopfbreiteMm: 45, stegstaerkeMm: 24, gewichtKgM: 22.1 },
  { id: 'a55', kategorie: 'kran', nameAlt: 'A 55', hoeheMm: 65, fussbreiteMm: 150, kopfbreiteMm: 55, stegstaerkeMm: 31, gewichtKgM: 31.8 },
  { id: 'a65', kategorie: 'kran', nameAlt: 'A 65', hoeheMm: 75, fussbreiteMm: 175, kopfbreiteMm: 65, stegstaerkeMm: 38, gewichtKgM: 43.1 },
  { id: 'a75', kategorie: 'kran', nameAlt: 'A 75', hoeheMm: 85, fussbreiteMm: 200, kopfbreiteMm: 75, stegstaerkeMm: 45, gewichtKgM: 56.2 },
  { id: 'a100', kategorie: 'kran', nameAlt: 'A 100', hoeheMm: 95, fussbreiteMm: 200, kopfbreiteMm: 100, stegstaerkeMm: 60, gewichtKgM: 74.3 },
  { id: 'a120', kategorie: 'kran', nameAlt: 'A 120', hoeheMm: 105, fussbreiteMm: 220, kopfbreiteMm: 120, stegstaerkeMm: 72, gewichtKgM: 100 },
  { id: 'a150', kategorie: 'kran', nameAlt: 'A 150', hoeheMm: 150, fussbreiteMm: 220, kopfbreiteMm: 150, stegstaerkeMm: 80, gewichtKgM: 150.3 },
  { id: 'f120', kategorie: 'kran', nameAlt: 'F 120', hoeheMm: 80, fussbreiteMm: 120, kopfbreiteMm: 120, stegstaerkeMm: 90, gewichtKgM: 70.1 },
  { id: 'pri85r', kategorie: 'kran', nameAlt: 'PRI85R', hoeheMm: 152.4, fussbreiteMm: 152.4, kopfbreiteMm: 101.6, stegstaerkeMm: 34.9, gewichtKgM: 86.8 },
  { id: 'mrs125', kategorie: 'kran', nameAlt: 'MRS125', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 120, stegstaerkeMm: 40, gewichtKgM: 125 },

  // --- Rillenschiene ---
  { id: 'ri52-13', kategorie: 'rillen', nameAlt: 'Ri 52/13', hoeheMm: 130, fussbreiteMm: 150, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 51.43 },
  { id: 'ri53-13', kategorie: 'rillen', nameAlt: 'Ri 53/13', hoeheMm: 130, fussbreiteMm: 150, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 52.97 },
  { id: 'ri59-10', kategorie: 'rillen', nameAlt: 'Ri 59/10', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 58.2 },
  { id: 'ri59-13', kategorie: 'rillen', nameAlt: 'Ri 59/13', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 58.2 },
  { id: 'ri60-10', kategorie: 'rillen', nameAlt: 'Ri 60/10', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 59.74 },
  { id: 'ri60-13', kategorie: 'rillen', nameAlt: 'Ri 60/13', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 113, stegstaerkeMm: 12, gewichtKgM: 59.74 },
  { id: 'ph38', kategorie: 'rillen', nameAlt: 'Ph 38', hoeheMm: 182, fussbreiteMm: 150, kopfbreiteMm: 127, stegstaerkeMm: 12, gewichtKgM: 56.4 },
  { id: 'ph37a', kategorie: 'rillen', nameAlt: 'Ph 37 a', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 135, stegstaerkeMm: 13, gewichtKgM: 66.8 },

  // --- Konstruktionsschienen ---
  { id: 'zu2-49', kategorie: 'konstruktion', nameAlt: 'Zu 2-49', hoeheMm: 116, fussbreiteMm: 140, kopfbreiteMm: 67, stegstaerkeMm: 40, gewichtKgM: 62.22 },
  { id: 'zu1-54', kategorie: 'konstruktion', nameAlt: 'Zu 1-54', hoeheMm: 121, fussbreiteMm: 140, kopfbreiteMm: 67, stegstaerkeMm: 40, gewichtKgM: 65.57 },
  { id: 'zu1-60', kategorie: 'konstruktion', nameAlt: 'Zu 1-60', hoeheMm: 134, fussbreiteMm: 140, kopfbreiteMm: 72, stegstaerkeMm: 44, gewichtKgM: 73 },
  { id: 'rl1-49', kategorie: 'konstruktion', nameAlt: 'Rl 1-49', nameNeu: '36 C1', hoeheMm: 168, fussbreiteMm: 75, kopfbreiteMm: 40, stegstaerkeMm: 18, gewichtKgM: 36.1 },
  { id: 'rl1-54', kategorie: 'konstruktion', nameAlt: 'Rl 1-54', nameNeu: '48 C1', hoeheMm: 199, fussbreiteMm: 75, kopfbreiteMm: 22, stegstaerkeMm: 20, gewichtKgM: 48.26 },
  { id: 'rl1-60', kategorie: 'konstruktion', nameAlt: 'Rl 1-60 (UIC33)', nameNeu: '33 C1', hoeheMm: 93, fussbreiteMm: 80, kopfbreiteMm: 80, stegstaerkeMm: 20, gewichtKgM: 33 },
  { id: 'vo1-49', kategorie: 'konstruktion', nameAlt: 'Vo 1-49', hoeheMm: 149, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 85, gewichtKgM: 96.2 },
  { id: 'vo1-54', kategorie: 'konstruktion', nameAlt: 'Vo 1-54', hoeheMm: 154, fussbreiteMm: 125, kopfbreiteMm: 67, stegstaerkeMm: 72, gewichtKgM: 90.07 },
  { id: 'vo1-60', kategorie: 'konstruktion', nameAlt: 'Vo 1-60', hoeheMm: 172, fussbreiteMm: 150, kopfbreiteMm: 72, stegstaerkeMm: 76, gewichtKgM: 111.09 },
  { id: 'vkri60', kategorie: 'konstruktion', nameAlt: 'VK Ri 60', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 114, stegstaerkeMm: 12, gewichtKgM: 76.1 },
  { id: 'vkd180-105', kategorie: 'konstruktion', nameAlt: 'VKD 180/105', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 130, stegstaerkeMm: 32, gewichtKgM: 105.12 },
  { id: 'ba75', kategorie: 'konstruktion', nameAlt: 'BA 75', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 113, stegstaerkeMm: 20, gewichtKgM: 75.26 },
  { id: 'd108-105', kategorie: 'konstruktion', nameAlt: 'D 108/105', hoeheMm: 180, fussbreiteMm: 180, kopfbreiteMm: 130, stegstaerkeMm: 32, gewichtKgM: 105.12 },
  { id: 'bl180-265', kategorie: 'konstruktion', nameAlt: 'Bl 180/265', hoeheMm: 184, fussbreiteMm: 180, kopfbreiteMm: 260, stegstaerkeMm: 162, gewichtKgM: 309.4 },

  // --- Spurrillen ---
  { id: 'form-s49', kategorie: 'spurrille', nameAlt: 'Form S 49', hoeheMm: 134.4, fussbreiteMm: 15, kopfbreiteMm: 15, stegstaerkeMm: 14, gewichtKgM: 22.8 },

  // --- Stromschiene ---
  { id: 'str40', kategorie: 'stromschiene', nameAlt: 'STR 40', hoeheMm: 105, fussbreiteMm: 80, kopfbreiteMm: 80, stegstaerkeMm: 18, gewichtKgM: 40 },
];

// ---------------------------------------------------------------------
// Silhouetten. Stilisierte SVG-Pfade je Schienenform-Familie, aus Hoehe /
// Fussbreite / Kopfbreite / Stegstaerke berechnet. Koordinatenursprung
// liegt an der Schienenoberkante (Fahrflaeche), y waechst nach unten.
// ---------------------------------------------------------------------

function rund(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Klassische Vignol-Silhouette (I-Profil) — auch fuer Konstruktionsschienen als Vereinfachung genutzt. */
function vignolPfad(hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  const halbFuss = fussbreite / 2;
  const halbSteg = Math.min(steg, kopfbreite * 0.7) / 2;
  const halbKopf = kopfbreite / 2;
  const kopfHoehe = hoehe * 0.26;
  const fussHoehe = hoehe * 0.18;
  const stegObenY = kopfHoehe + hoehe * 0.03;
  const stegUntenY = hoehe - fussHoehe;
  const fussKanteY = hoehe - fussHoehe * 0.4;
  const kopfFase = Math.min(4, halbKopf * 0.3);

  return [
    `M ${rund(-halbKopf + kopfFase)} 0`,
    `L ${rund(halbKopf - kopfFase)} 0`,
    `L ${rund(halbKopf)} ${rund(kopfFase)}`,
    `L ${rund(halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(halbSteg)} ${rund(stegObenY)}`,
    `L ${rund(halbSteg)} ${rund(stegUntenY)}`,
    `L ${rund(halbFuss)} ${rund(fussKanteY)}`,
    `L ${rund(halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss)} ${rund(fussKanteY)}`,
    `L ${rund(-halbSteg)} ${rund(stegUntenY)}`,
    `L ${rund(-halbSteg)} ${rund(stegObenY)}`,
    `L ${rund(-halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(-halbKopf)} ${rund(kopfFase)}`,
    'Z',
  ].join(' ');
}

/** Kranschiene: breite, flache Basis, kaum Taillierung, kraeftiger runder Kopf. */
function kranPfad(hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  const halbFuss = fussbreite / 2;
  const halbKopf = kopfbreite / 2;
  const halbSteg = Math.max(steg, kopfbreite * 0.55) / 2;
  const fussHoehe = hoehe * 0.22;
  const kopfHoehe = hoehe * 0.42;
  const stegUntenY = hoehe - fussHoehe;
  const kopfFase = Math.min(6, halbKopf * 0.35);

  return [
    `M ${rund(-halbKopf + kopfFase)} 0`,
    `L ${rund(halbKopf - kopfFase)} 0`,
    `L ${rund(halbKopf)} ${rund(kopfFase)}`,
    `L ${rund(halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(halbSteg)} ${rund(kopfHoehe + hoehe * 0.06)}`,
    `L ${rund(halbSteg)} ${rund(stegUntenY)}`,
    `L ${rund(halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbSteg)} ${rund(stegUntenY)}`,
    `L ${rund(-halbSteg)} ${rund(kopfHoehe + hoehe * 0.06)}`,
    `L ${rund(-halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(-halbKopf)} ${rund(kopfFase)}`,
    'Z',
  ].join(' ');
}

/** Rillenschiene: Vignol-Grundform plus erhoehte Fuehrungslippe rechts neben dem Kopf. */
function rillenPfad(hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  const basis = vignolPfad(hoehe, fussbreite, kopfbreite * 0.72, steg);
  const halbKopf = (kopfbreite * 0.72) / 2;
  const rilleBreite = kopfbreite * 0.28;
  const kopfHoehe = hoehe * 0.26;
  const rilleTiefe = kopfHoehe * 0.55;

  const lippe = [
    `M ${rund(halbKopf)} 0`,
    `L ${rund(halbKopf + rilleBreite)} 0`,
    `L ${rund(halbKopf + rilleBreite)} ${rund(kopfHoehe)}`,
    `L ${rund(halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(halbKopf)} ${rund(rilleTiefe)}`,
    `L ${rund(halbKopf + rilleBreite * 0.55)} ${rund(rilleTiefe)}`,
    `L ${rund(halbKopf + rilleBreite * 0.55)} ${rund(kopfHoehe * 0.15)}`,
    `L ${rund(halbKopf)} ${rund(kopfHoehe * 0.15)}`,
    'Z',
  ].join(' ');

  return `${basis} ${lippe}`;
}

/** Spurrille: niedriges, asymmetrisches Fuehrungsstueck. */
function spurrillePfad(hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  const halbFuss = fussbreite / 2;
  const kopfHoehe = hoehe * 0.3;
  const rille = hoehe * 0.18;

  return [
    `M ${rund(-halbFuss * 0.5)} 0`,
    `L ${rund(halbFuss * 0.9)} 0`,
    `L ${rund(halbFuss * 0.9)} ${rund(rille)}`,
    `L ${rund(halbFuss * 0.35)} ${rund(rille)}`,
    `L ${rund(halbFuss * 0.35)} ${rund(kopfHoehe)}`,
    `L ${rund(halbFuss * 0.7)} ${rund(hoehe * 0.55)}`,
    `L ${rund(halbFuss * 0.7)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss * 0.5)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss * 0.5)} ${rund(hoehe * 0.55)}`,
    `L ${rund(-halbFuss * 0.2)} ${rund(kopfHoehe)}`,
    `L ${rund(-halbFuss * 0.2)} 0`,
    'Z',
  ].join(' ');
}

/** Stromschiene: breite Basis, kein schlanker Steg, Pilzkopf. */
function stromschienePfad(hoehe: number, fussbreite: number, kopfbreite: number): string {
  const halbFuss = fussbreite / 2;
  const halbKopf = kopfbreite / 2;
  const kopfHoehe = hoehe * 0.34;
  const kopfFase = Math.min(8, halbKopf * 0.4);

  return [
    `M ${rund(-halbKopf + kopfFase)} 0`,
    `L ${rund(halbKopf - kopfFase)} 0`,
    `L ${rund(halbKopf)} ${rund(kopfFase)}`,
    `L ${rund(halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(halbFuss)} ${rund(kopfHoehe + hoehe * 0.1)}`,
    `L ${rund(halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss)} ${rund(hoehe)}`,
    `L ${rund(-halbFuss)} ${rund(kopfHoehe + hoehe * 0.1)}`,
    `L ${rund(-halbKopf)} ${rund(kopfHoehe)}`,
    `L ${rund(-halbKopf)} ${rund(kopfFase)}`,
    'Z',
  ].join(' ');
}

/**
 * Liefert die Silhouette fuer ein Profil ODER pauschal fuer eine Kategorie
 * (mit typischen Platzhalter-Massen, falls kein konkretes Profil vorliegt —
 * genutzt im "Form erkennen"-Modus, wo nur die Kategorie gefragt ist).
 */
export function schienenPfad(kategorie: SchienenKategorie, hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  switch (kategorie) {
    case 'leichte-vignol':
    case 'schwere-vignol':
    case 'konstruktion':
      return vignolPfad(hoehe, fussbreite, kopfbreite, steg);
    case 'kran':
      return kranPfad(hoehe, fussbreite, kopfbreite, steg);
    case 'rillen':
      return rillenPfad(hoehe, fussbreite, kopfbreite, steg);
    case 'spurrille':
      return spurrillePfad(hoehe, fussbreite, kopfbreite, steg);
    case 'stromschiene':
      return stromschienePfad(hoehe, fussbreite, kopfbreite);
  }
}

/** viewBox fuer eine Silhouette, aus ihren eigenen Massen berechnet (zentriert, mit Rand). */
export function schienenViewBox(hoehe: number, fussbreite: number, kopfbreite: number): string {
  const breite = Math.max(fussbreite, kopfbreite) + 36;
  return `${rund(-breite / 2)} -8 ${rund(breite)} ${rund(hoehe + 16)}`;
}

/** Typische Platzhaltermasse je Kategorie, fuer den reinen Formen-Erkennen-Modus. */
export const KATEGORIE_MUSTERMASSE: Record<SchienenKategorie, { hoehe: number; fussbreite: number; kopfbreite: number; steg: number }> = {
  'leichte-vignol': { hoehe: 90, fussbreite: 75, kopfbreite: 40, steg: 9 },
  'schwere-vignol': { hoehe: 160, fussbreite: 140, kopfbreite: 70, steg: 15 },
  kran: { hoehe: 100, fussbreite: 190, kopfbreite: 100, steg: 60 },
  rillen: { hoehe: 160, fussbreite: 165, kopfbreite: 115, steg: 12 },
  konstruktion: { hoehe: 150, fussbreite: 130, kopfbreite: 68, steg: 45 },
  spurrille: { hoehe: 110, fussbreite: 60, kopfbreite: 60, steg: 14 },
  stromschiene: { hoehe: 100, fussbreite: 80, kopfbreite: 80, steg: 18 },
};

/**
 * Eine EINZIGE, feste viewBox fuer den Formen-Erkennen-Modus (Modus 1), aus
 * der groessten Kategorie berechnet. Wichtig: leichte und schwere
 * Vignolschiene nutzen dieselbe Silhouetten-Formel (vignolPfad) und
 * unterscheiden sich nur in der absoluten Groesse — mit einer je Kategorie
 * selbst zugeschnittenen viewBox (wie in Modus 2/3, wo Zahlen zur
 * Unterscheidung helfen) wuerde dieser Groessenunterschied verschwinden,
 * weil jede Silhouette gleich gross ins Bild skaliert wuerde. Mit einer
 * gemeinsamen festen viewBox bleibt die tatsaechliche Groessenrelation
 * sichtbar (schwere Vignolschiene wirkt spuerbar groesser als leichte).
 */
export const FORMEN_VIEWBOX: string = (() => {
  let maxBreite = 0;
  let maxHoehe = 0;
  for (const m of Object.values(KATEGORIE_MUSTERMASSE)) {
    maxBreite = Math.max(maxBreite, m.fussbreite, m.kopfbreite);
    maxHoehe = Math.max(maxHoehe, m.hoehe);
  }
  return schienenViewBox(maxHoehe, maxBreite, maxBreite);
})();
