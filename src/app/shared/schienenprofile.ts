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
 * (siehe Abschnitt "Querschnitte" unten), nur Hoehe, Fussbreite,
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
// Querschnitte (2026-11-12 ueberarbeitet). Realistischere Schemazeichnungen:
// gewoelbte Fahrflaeche mit runden Kopfkanten, Laschenanlageflaechen 1:4,
// ausgerundete Uebergaenge Kopf/Steg/Fuss, geneigte Fussoberseite mit
// Fussrand. Hoehe, Fuss-, Kopfbreite und Stegstaerke kommen aus der Tabelle;
// Kopfhoehe (~22 % H), Fussranddicke (~7 % H) und Neigungen sind an typische
// Vignolprofile (z. B. 60E1: H 172, Fussrand ca. 11,5) angelehnt und geschaetzt.
// Ursprung = Schienenoberkante Mitte, y waechst nach unten.
// ---------------------------------------------------------------------

function rund(n: number): number {
  return Math.round(n * 100) / 100;
}

type Pkt = [number, number];
/** Segment der rechten Haelfte: Linie zu p oder quadratische Kurve (Kontrollpunkt c) zu p. */
interface Seg { p: Pkt; c?: Pkt }

/** Rechte Profilhaelfte (von oben Mitte bis unten Mitte) spiegeln und zu einem geschlossenen Pfad machen. */
function spiegelPfad(start: Pkt, rechts: Seg[]): string {
  const f = (p: Pkt) => `${rund(p[0])} ${rund(p[1])}`;
  const teile = [`M ${f(start)}`];
  for (const s of rechts) teile.push(s.c ? `Q ${f(s.c)} ${f(s.p)}` : `L ${f(s.p)}`);
  // links: rueckwaerts, x gespiegelt
  const punkte: Pkt[] = [start, ...rechts.map(s => s.p)];
  for (let i = rechts.length - 1; i >= 0; i--) {
    const s = rechts[i];
    const ziel: Pkt = [-punkte[i][0], punkte[i][1]];
    teile.push(s.c ? `Q ${f([-s.c[0], s.c[1]])} ${f(ziel)}` : `L ${f(ziel)}`);
  }
  teile.push('Z');
  return teile.join(' ');
}

interface Form {
  kopfTiefe: number;     // Kopfhoehe an der Flanke, Anteil von H
  fussRand: number;      // Dicke am Fussrand, Anteil von H
  fussNeigung: number;   // Fussoberseite 1:n
  laschNeigung: number;  // Kopfunterseite 1:n
  woelbung: number;      // Fahrflaechen-Woelbung, Anteil von H
  kopfEcke: number;      // Radius obere Kopfkante, Anteil der halben Kopfbreite
}

const VIGNOL: Form = { kopfTiefe: 0.22, fussRand: 0.07, fussNeigung: 3.2, laschNeigung: 4, woelbung: 0.008, kopfEcke: 0.32 };
const KRAN: Form = { kopfTiefe: 0.36, fussRand: 0.15, fussNeigung: 2.4, laschNeigung: 1.6, woelbung: 0.035, kopfEcke: 0.3 };
const KONSTRUKTION: Form = { kopfTiefe: 0.27, fussRand: 0.09, fussNeigung: 3, laschNeigung: 3, woelbung: 0.006, kopfEcke: 0.28 };

/** Untere Haelfte rechts: Kopfunterseite → Steg → Fuss, ab dem Punkt (kx, ky) an der Kopfflanke unten. */
function unterteil(h: number, F: number, s: number, kx: number, ky: number, form: Form): Seg[] {
  const fe = Math.max(2, h * form.fussRand);
  let yU = ky + Math.max(0, kx - s) / form.laschNeigung;   // Kopfunterseite trifft Steg
  let yF = h - fe - Math.max(0, F - s) / form.fussNeigung;  // Fussoberseite trifft Steg
  if (yF < yU + 4) { const m = (yU + yF) / 2; yU = Math.min(yU, m - 2); yF = Math.max(yF, m + 2); }
  const rk = Math.min(4, (kx - s) * 0.25, h * 0.03);
  const r = Math.max(0.5, Math.min(h * 0.06, (yF - yU) / 3, Math.max(1, kx - s) * 0.5));
  const re = Math.min(3, fe * 0.35, (F - s) * 0.2);
  const segs: Seg[] = [];
  if (kx - s > 1) {
    segs.push({ p: [kx - rk, ky + rk / form.laschNeigung], c: [kx, ky] });
    segs.push({ p: [s + r, yU - r / form.laschNeigung] });
    segs.push({ p: [s, yU + r], c: [s, yU] });
  } else {
    segs.push({ p: [s, ky] });
  }
  if (F - s > 1) {
    segs.push({ p: [s, yF - r] });
    segs.push({ p: [s + r, yF + r / form.fussNeigung], c: [s, yF] });
    segs.push({ p: [F - re, h - fe - re / form.fussNeigung] });
    segs.push({ p: [F, h - fe + re], c: [F, h - fe] });
    segs.push({ p: [F, h - 1] });
    segs.push({ p: [F - 1, h], c: [F, h] });
  } else {
    segs.push({ p: [s, h] });
  }
  segs.push({ p: [0, h] });
  return segs;
}

/** Symmetrisches Profil mit Kopf, Steg und Fuss (Vignol, Kran, Konstruktion). */
function symPfad(h: number, fussbreite: number, kopfbreite: number, steg: number, form: Form): string {
  const F = fussbreite / 2;
  const K = kopfbreite / 2;
  const s = Math.max(1, Math.min(steg / 2, K * 0.85, F * 0.95));
  const w = h * form.woelbung;
  const rc = Math.min(K * form.kopfEcke, 14);
  const hk = h * form.kopfTiefe;
  const kx = K * 0.985; // Kopfflanke leicht geneigt
  const kopf: Seg[] = [
    { p: [K - rc, w + rc * 0.08], c: [K * 0.5, 0] },
    { p: [K, w + rc], c: [K, w] },
    { p: [kx, hk] },
  ];
  return spiegelPfad([0, 0], [...kopf, ...unterteil(h, F, s, kx, hk, form)]);
}

/**
 * Rillenschiene: asymmetrischer Kopf — links der Fahrkopf, in der Mitte die Rille
 * fuer den Spurkranz, rechts die etwas niedrigere Leitlippe. Steg unter der Kopfmitte.
 */
function rillenPfad(h: number, fussbreite: number, kopfbreite: number, steg: number): string {
  const F = fussbreite / 2;
  const K = kopfbreite / 2;
  const s = Math.max(1, Math.min(steg / 2, K * 0.4));
  const xL = -K, xR = K;
  const fahr = kopfbreite * 0.5;      // Breite Fahrkopf
  const lippe = kopfbreite * 0.15;    // Breite Leitlippe
  const g = h * 0.24;                 // Rillentiefe
  const hk = h * 0.33;                // Kopfhoehe
  const gr = Math.min(6, (kopfbreite - fahr - lippe) * 0.35);
  const rc = Math.min(8, fahr * 0.18);
  const lo = h * 0.03;                // Leitlippe etwas tiefer
  const f = (x: number, y: number) => `${rund(x)} ${rund(y)}`;
  const rechts = unterteil(h, F, s, xR, hk, VIGNOL);
  const links = unterteil(h, F, s, -xL, hk, VIGNOL); // gespiegelt verwenden
  const segStr = (sg: Seg, spiegel: boolean) => {
    const m = (p: Pkt): Pkt => (spiegel ? [-p[0], p[1]] : p);
    return sg.c ? `Q ${f(...m(sg.c))} ${f(...m(sg.p))}` : `L ${f(...m(sg.p))}`;
  };
  // linke Seite rueckwaerts (von unten Mitte hoch zur Kopfflanke)
  const linksPunkte: Pkt[] = [[-xL, hk], ...links.map(sg => sg.p)];
  const linksRueck: string[] = [];
  for (let i = links.length - 1; i >= 0; i--) {
    const sg = links[i];
    const ziel = linksPunkte[i];
    linksRueck.push(sg.c ? `Q ${f(-sg.c[0], sg.c[1])} ${f(-ziel[0], ziel[1])}` : `L ${f(-ziel[0], ziel[1])}`);
  }
  const xR1 = xL + fahr;          // Rillenrand Fahrkopfseite
  const xR2 = xR - lippe;         // Rillenrand Lippenseite
  return [
    `M ${f(xL + rc, 0)}`,
    `L ${f(xR1 - 2, 0)}`, `Q ${f(xR1, 0)} ${f(xR1, 2)}`,
    `L ${f(xR1 + 1, g - gr)}`, `Q ${f(xR1 + 1, g)} ${f(xR1 + 1 + gr, g)}`,
    `L ${f(xR2 - gr, g)}`, `Q ${f(xR2, g)} ${f(xR2, g - gr)}`,
    `L ${f(xR2, lo + 2)}`, `Q ${f(xR2, lo)} ${f(xR2 + 2, lo)}`,
    `L ${f(xR - 2, lo)}`, `Q ${f(xR, lo)} ${f(xR, lo + 2)}`,
    `L ${f(xR, hk)}`,
    ...rechts.map(sg => segStr(sg, false)),
    ...linksRueck,
    `L ${f(xL, rc)}`, `Q ${f(xL, 0)} ${f(xL + rc, 0)}`,
    'Z',
  ].join(' ');
}

/** Spurrille (Herzstueck-Fuehrung): schmales, hohes, asymmetrisches Stueck mit Rille oben. */
function spurrillePfad(h: number, fussbreite: number): string {
  const b = Math.max(fussbreite, h * 0.18);
  const f = (x: number, y: number) => `${rund(x)} ${rund(y)}`;
  const g = h * 0.2;
  return [
    `M ${f(-b / 2 + 2, 0)}`, `L ${f(-b * 0.05, 0)}`,
    `L ${f(-b * 0.05, g - 2)}`, `Q ${f(-b * 0.05, g)} ${f(b * 0.05, g)}`,
    `L ${f(b * 0.25, g)}`, `Q ${f(b * 0.35, g)} ${f(b * 0.35, g - 2)}`,
    `L ${f(b * 0.35, 1)}`, `L ${f(b / 2 - 1, 1)}`, `Q ${f(b / 2, 1)} ${f(b / 2, 3)}`,
    `L ${f(b / 2, h - 1)}`, `Q ${f(b / 2, h)} ${f(b / 2 - 1, h)}`,
    `L ${f(-b / 2 + 1, h)}`, `Q ${f(-b / 2, h)} ${f(-b / 2, h - 1)}`,
    `L ${f(-b / 2, 2)}`, `Q ${f(-b / 2, 0)} ${f(-b / 2 + 2, 0)}`,
    'Z',
  ].join(' ');
}

/** Stromschiene: Pilzkopf auf breiter, massiger Basis. */
function stromschienePfad(h: number, fussbreite: number, kopfbreite: number): string {
  const F = fussbreite / 2;
  const K = kopfbreite / 2;
  const hk = h * 0.32;
  const hals = Math.min(K, F) * 0.55;
  const rc = Math.min(10, K * 0.35);
  return spiegelPfad([0, 0], [
    { p: [K - rc, 0.5], c: [K * 0.5, 0] },
    { p: [K, rc], c: [K, 0.5] },
    { p: [K, hk - 3] },
    { p: [K - 3, hk], c: [K, hk] },
    { p: [hals + 4, hk + 2] },
    { p: [hals, hk + 8], c: [hals, hk + 2] },
    { p: [hals, h * 0.55] },
    { p: [F, h * 0.62], c: [hals, h * 0.62] },
    { p: [F, h - 2] },
    { p: [F - 2, h], c: [F, h] },
    { p: [0, h] },
  ]);
}

/** Querschnitt als SVG-Pfad fuer ein Profil der jeweiligen Familie. */
export function schienenPfad(kategorie: SchienenKategorie, hoehe: number, fussbreite: number, kopfbreite: number, steg: number): string {
  switch (kategorie) {
    case 'leichte-vignol':
    case 'schwere-vignol':
      return symPfad(hoehe, fussbreite, kopfbreite, steg, VIGNOL);
    case 'konstruktion':
      return symPfad(hoehe, fussbreite, kopfbreite, steg, KONSTRUKTION);
    case 'kran':
      return symPfad(hoehe, fussbreite, kopfbreite, steg, KRAN);
    case 'rillen':
      return rillenPfad(hoehe, fussbreite, kopfbreite, steg);
    case 'spurrille':
      return spurrillePfad(hoehe, fussbreite);
    case 'stromschiene':
      return stromschienePfad(hoehe, fussbreite, kopfbreite);
  }
}

// ---------------------------------------------------------------------
// Bemassung: Hoehe links, Kopfbreite oben, Fussbreite unten — wie in einer
// Profilzeichnung. Texte koennen "?" sein (Modus "Werte eintragen").
// ---------------------------------------------------------------------

export interface MassText { x: number; y: number; text: string; drehen: boolean; groesse: number; hoehe: boolean }

export interface Bemassung {
  viewBox: string;
  /** duenne Hilfslinien von der Kontur zur Masslinie */
  hilfslinien: string;
  /** Masslinien (Hoehe extra, damit sie hervorgehoben werden kann) */
  masslinien: string;
  hoehenlinie: string;
  /** gefuellte Pfeilspitzen */
  pfeile: string;
  texte: MassText[];
}

export interface BemassungOptionen {
  hoehe?: string | null;
  kopf?: string | null;
  fuss?: string | null;
  /** feste Zeichenflaeche (fuer Vergleichskarten gleicher Massstab) */
  fest?: { hoehe: number; breite: number };
  /** Schriftfaktor (kleine Karten brauchen groessere Schrift) */
  schrift?: number;
}

export function schienenBemassung(kategorie: SchienenKategorie, h: number, fussbreite: number, kopfbreite: number, opt: BemassungOptionen): Bemassung {
  const bFuss = kategorie === 'spurrille' ? Math.max(fussbreite, h * 0.18) : fussbreite;
  const W = Math.max(bFuss, kopfbreite);
  const refH = opt.fest?.hoehe ?? h;
  const refW = opt.fest?.breite ?? W;
  const u = Math.max(refH, refW) / 100;
  const fs = 6.2 * u * (opt.schrift ?? 1);
  const a = 2.4 * u; // Pfeillaenge
  const f = (x: number, y: number) => `${rund(x)} ${rund(y)}`;
  const pfeil = (x: number, y: number, dx: number, dy: number) => {
    // Spitze bei (x,y), zeigt in Richtung (dx,dy)
    const bx = x - dx * a, by = y - dy * a;
    const nx = -dy * a * 0.38, ny = dx * a * 0.38;
    return `M ${f(x, y)} L ${f(bx + nx, by + ny)} L ${f(bx - nx, by - ny)} Z`;
  };
  let hilfs = '', mass = '', hoeheL = '', pfeile = '';
  const texte: MassText[] = [];

  const links = -W / 2; // Masslinie dicht am eigenen Profil, auch auf fester Zeichenflaeche
  if (opt.hoehe != null) {
    const xKante = kategorie === 'spurrille' ? -bFuss / 2 : -Math.max(bFuss, kopfbreite) / 2;
    const xm = links - 9 * u;
    hilfs += `M ${f(-kopfbreite / 2 - 1.5 * u, 0)} L ${f(xm - 2 * u, 0)} M ${f(xKante - 1.5 * u, h)} L ${f(xm - 2 * u, h)} `;
    hoeheL += `M ${f(xm, 0)} L ${f(xm, h)}`;
    pfeile += pfeil(xm, 0, 0, -1) + ' ' + pfeil(xm, h, 0, 1) + ' ';
    texte.push({ x: xm - 2.2 * u, y: h / 2, text: opt.hoehe, drehen: true, groesse: fs * 1.15, hoehe: true });
  }
  if (opt.kopf != null) {
    const ym = -7 * u;
    hilfs += `M ${f(-kopfbreite / 2, -1.5 * u)} L ${f(-kopfbreite / 2, ym - 2 * u)} M ${f(kopfbreite / 2, -1.5 * u)} L ${f(kopfbreite / 2, ym - 2 * u)} `;
    mass += `M ${f(-kopfbreite / 2, ym)} L ${f(kopfbreite / 2, ym)} `;
    pfeile += pfeil(-kopfbreite / 2, ym, -1, 0) + ' ' + pfeil(kopfbreite / 2, ym, 1, 0) + ' ';
    texte.push({ x: 0, y: ym - 2 * u, text: opt.kopf, drehen: false, groesse: fs, hoehe: false });
  }
  if (opt.fuss != null) {
    const ym = h + 8 * u;
    hilfs += `M ${f(-bFuss / 2, h + 1.5 * u)} L ${f(-bFuss / 2, ym + 2 * u)} M ${f(bFuss / 2, h + 1.5 * u)} L ${f(bFuss / 2, ym + 2 * u)} `;
    mass += `M ${f(-bFuss / 2, ym)} L ${f(bFuss / 2, ym)} `;
    pfeile += pfeil(-bFuss / 2, ym, -1, 0) + ' ' + pfeil(bFuss / 2, ym, 1, 0) + ' ';
    texte.push({ x: 0, y: ym + 2 * u + fs, text: opt.fuss, drehen: false, groesse: fs, hoehe: false });
  }

  const BW = opt.fest ? refW : W;
  const BH = opt.fest ? refH : h;
  const x0 = -BW / 2 - (opt.hoehe != null ? 13 * u + fs * 1.3 : 5 * u);
  const x1 = BW / 2 + 5 * u;
  const y0 = opt.kopf != null ? -9 * u - fs * 1.2 : -4 * u;
  const y1 = BH + (opt.fuss != null ? 11 * u + fs * 1.4 : 4 * u);
  return {
    viewBox: `${rund(x0)} ${rund(y0)} ${rund(x1 - x0)} ${rund(y1 - y0)}`,
    hilfslinien: hilfs.trim(),
    masslinien: mass.trim(),
    hoehenlinie: hoeheL,
    pfeile: pfeile.trim(),
    texte,
  };
}

/** Masszahl schoen: 172 → "172 mm", 60.3 → "60,3 mm" */
export function mm(wert: number): string {
  return `${String(wert).replace('.', ',')} mm`;
}

/**
 * Je Schienenform ein ECHTES Beispielprofil fuer den Modus "Form erkennen"
 * (damit die Hoehenangabe stimmt). Alle Karten nutzen dieselbe Zeichenflaeche,
 * so bleibt der Groessenunterschied (leicht ↔ schwer) sichtbar.
 */
export const KATEGORIE_BEISPIEL: Record<SchienenKategorie, string> = {
  'leichte-vignol': 's14',
  'schwere-vignol': 'uic60',
  kran: 'a75',
  rillen: 'ri60-10',
  konstruktion: 'zu1-60',
  spurrille: 'form-s49',
  stromschiene: 'str40',
};

export const FORMEN_FLAECHE: { hoehe: number; breite: number } = (() => {
  let hoehe = 0, breite = 0;
  for (const id of Object.values(KATEGORIE_BEISPIEL)) {
    const p = PROFILE.find(x => x.id === id)!;
    hoehe = Math.max(hoehe, p.hoeheMm);
    breite = Math.max(breite, p.fussbreiteMm, p.kopfbreiteMm);
  }
  return { hoehe, breite };
})();
