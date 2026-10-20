/**
 * Spieldaten des Gleisbau Tycoon: Zuege, Streckenklassen und Level. Wird von der Spiel-Engine
 * (tycoon-engine.ts) und der 3D-Ansicht (tycoon-3d.ts) gemeinsam genutzt.
 *
 * WICHTIG: Spielstaende speichern den Zug-Typ als Index in ZUEGE -- neue Zuege nur HINTEN anhaengen.
 * Modelle: Kenney Train Kit (CC0) unter src/assets/modelle/kenney/.
 */

export interface ZugTyp {
  n: string;
  /** Hoechstgeschwindigkeit des Zuges; tatsaechlich gilt min(kmh, Streckenklasse). */
  kmh: number;
  cost: number;
  /** Faktoren auf Miete pro Fahrt und Wartung pro Fahrt. */
  rent: number;
  upkeep: number;
  /** Anzahl Fahrzeuge (Lok + Wagen) -- 2D und 3D. */
  len: number;
  /** Ab diesem Level kaufbar. */
  lvl: number;
  /** Braucht Oberleitung (Streckenklasse elektrifiziert). */
  el: boolean;
  /** Gleisverschleiss je Fahrt (Faktor). */
  wear: number;
  /** 2D-Farben: Lok, Wagen. */
  col: string;
  col2: string;
  /** 3D: Lok, Wagen der Reihe nach (wiederholt), optional umgedrehter Triebkopf am Ende. */
  modell: { lok: string; wagen: string[]; ende?: string };
}

export const ZUEGE: ZugTyp[] = [
  { n: 'Dampflok (Gebrauchtkauf)', kmh: 80, cost: 1200, rent: 0.55, upkeep: 1.6, len: 3, lvl: 1, el: false, wear: 1.1, col: '#7a5230', col2: '#b08a64',
    modell: { lok: 'train-locomotive-a', wagen: ['train-carriage-coal', 'train-carriage-wood'] } },
  { n: 'Diesellok (Güterzug)', kmh: 120, cost: 2500, rent: 1, upkeep: 1, len: 3, lvl: 1, el: false, wear: 1, col: '#ff7a00', col2: '#ffb066',
    modell: { lok: 'train-diesel-a', wagen: ['train-carriage-container-red', 'train-carriage-container-blue'] } },
  { n: 'S-Bahn-Triebzug', kmh: 160, cost: 4500, rent: 1.7, upkeep: 1.1, len: 3, lvl: 3, el: true, wear: 0.9, col: '#2e86ab', col2: '#8cc1d6',
    modell: { lok: 'train-electric-city-a', wagen: ['train-electric-city-b', 'train-electric-city-c'] } },
  { n: 'ICE-Triebzug (300 km/h)', kmh: 300, cost: 18000, rent: 3.2, upkeep: 1.3, len: 5, lvl: 8, el: true, wear: 1.2, col: '#d9d9d9', col2: '#9aa5b1',
    modell: { lok: 'train-electric-bullet-a', wagen: ['train-electric-bullet-b', 'train-electric-bullet-c'], ende: 'train-electric-bullet-a' } },
  // Ausbau 2026-10-20
  { n: 'Rangierlok mit Holzwagen', kmh: 70, cost: 900, rent: 0.45, upkeep: 0.6, len: 3, lvl: 1, el: false, wear: 1, col: '#e0b000', col2: '#a0703a',
    modell: { lok: 'train-diesel-c', wagen: ['train-carriage-lumber', 'train-carriage-flatbed-wood'] } },
  { n: 'Dampf-Personenzug', kmh: 100, cost: 2800, rent: 1.1, upkeep: 1.3, len: 3, lvl: 2, el: false, wear: 1, col: '#3b6e3b', col2: '#c0703a',
    modell: { lok: 'train-locomotive-passenger-a', wagen: ['train-locomotive-passenger-b'] } },
  { n: 'Regionalbahn (Diesel)', kmh: 140, cost: 3600, rent: 1.35, upkeep: 1.05, len: 3, lvl: 2, el: false, wear: 1, col: '#3f8f4f', col2: '#7fbf8a',
    modell: { lok: 'train-diesel-box-a', wagen: ['train-diesel-box-b'] } },
  { n: 'Regional-Express (Doppelstock)', kmh: 160, cost: 6000, rent: 2, upkeep: 1.15, len: 4, lvl: 3, el: true, wear: 1, col: '#c0392b', col2: '#e8a09a',
    modell: { lok: 'train-electric-square-a', wagen: ['train-electric-double-b'] } },
  { n: 'Schwerer Güterzug (E-Lok)', kmh: 120, cost: 7000, rent: 2.8, upkeep: 1.5, len: 5, lvl: 4, el: true, wear: 1.6, col: '#6d4c41', col2: '#a1887f',
    modell: { lok: 'train-electric-square-a', wagen: ['train-carriage-tank-large', 'train-carriage-container-green', 'train-carriage-dirt', 'train-carriage-lumber'] } },
  { n: 'Intercity', kmh: 200, cost: 10000, rent: 2.6, upkeep: 1.25, len: 5, lvl: 5, el: true, wear: 1, col: '#f5f5f5', col2: '#d0d6dc',
    modell: { lok: 'train-electric-square-a', wagen: ['train-electric-square-b', 'train-electric-square-c'], ende: 'train-electric-square-a' } },
  { n: 'ICE (250 km/h)', kmh: 250, cost: 13000, rent: 2.9, upkeep: 1.3, len: 4, lvl: 6, el: true, wear: 1.1, col: '#e6e6e6', col2: '#b0bac4',
    modell: { lok: 'train-electric-bullet-a', wagen: ['train-electric-bullet-c'], ende: 'train-electric-bullet-a' } },
  { n: 'Hochgeschwindigkeitszug (lang)', kmh: 300, cost: 21000, rent: 4, upkeep: 1.45, len: 6, lvl: 9, el: true, wear: 1.3, col: '#ffffff', col2: '#c5ccd3',
    modell: { lok: 'train-electric-bullet-a', wagen: ['train-electric-bullet-b', 'train-electric-bullet-c'], ende: 'train-electric-bullet-a' } },
];

export interface StreckenKlasse {
  n: string;
  kmh: number;
  /** Oberleitung vorhanden. */
  el: boolean;
  /** Baukosten-Faktor (Ausbau kostet die Differenz zur aktuellen Klasse). */
  bau: number;
  /** Faktoren auf laufenden Unterhalt, Trassenentgelt der Fremdzuege und Verschleiss. */
  unterhalt: number;
  entgelt: number;
  wear: number;
  lvl: number;
}

export const KLASSEN: StreckenKlasse[] = [
  { n: 'Nebenbahn', kmh: 100, el: false, bau: 1, unterhalt: 0.8, entgelt: 0.8, wear: 1, lvl: 1 },
  { n: 'Hauptbahn (elektrifiziert)', kmh: 160, el: true, bau: 1.8, unterhalt: 1, entgelt: 1, wear: 1, lvl: 2 },
  { n: 'Ausbaustrecke', kmh: 200, el: true, bau: 2.8, unterhalt: 1.25, entgelt: 1.3, wear: 1.1, lvl: 4 },
  { n: 'Schnellfahrstrecke', kmh: 250, el: true, bau: 4.2, unterhalt: 1.6, entgelt: 1.6, wear: 1.2, lvl: 6 },
  { n: 'Hochgeschwindigkeitsstrecke', kmh: 300, el: true, bau: 6, unterhalt: 2, entgelt: 2, wear: 1.3, lvl: 8 },
];

/** Lackierungen fuer die eigenen Zuege. Bezahlt mit Geld (preis) oder Pokalen aus Duellen (pokale). */
export interface Skin { id: string; n: string; farbe: string | null; lvl: number; preis: number; pokale: number }
export const SKINS: Skin[] = [
  { id: 'standard', n: 'Werkslackierung', farbe: null, lvl: 1, preis: 0, pokale: 0 },
  { id: 'verkehrsrot', n: 'Verkehrsrot', farbe: '#e3312d', lvl: 2, preis: 3000, pokale: 0 },
  { id: 'nachtblau', n: 'Nachtblau', farbe: '#2f4f9e', lvl: 3, preis: 5000, pokale: 0 },
  { id: 'waldgruen', n: 'Waldgrün', farbe: '#2e7d4f', lvl: 4, preis: 6000, pokale: 0 },
  { id: 'sonnengelb', n: 'Sonnengelb', farbe: '#f2c230', lvl: 5, preis: 8000, pokale: 0 },
  { id: 'gold', n: 'Gold', farbe: '#d4af37', lvl: 7, preis: 25000, pokale: 0 },
  { id: 'chrom', n: 'Chrom (Duell-Preis)', farbe: '#c9d1d9', lvl: 1, preis: 0, pokale: 8 },
  { id: 'champion', n: 'Champion-Violett (Duell-Preis)', farbe: '#7b4bc4', lvl: 1, preis: 0, pokale: 20 },
];

/** Ausruestung: einmal kaufen, wirkt dauerhaft auf das ganze Unternehmen. */
export interface Ausruestung { id: string; n: string; text: string; lvl: number; preis: number; pokale: number }
export const AUSRUESTUNG: Ausruestung[] = [
  { id: 'stopfmaschine', n: 'Stopfmaschine', text: 'Stopft den Schotter unter den Schwellen nach: Gleisverschleiß −25 %.', lvl: 2, preis: 6000, pokale: 0 },
  { id: 'schleifzug', n: 'Schienenschleifzug', text: 'Schleift Riffeln und Head Checks weg: Störungen kommen 30 % seltener.', lvl: 3, preis: 9000, pokale: 0 },
  { id: 'werkstatt', n: 'Moderne Werkstatt', text: 'Wartungsstau kostet nur noch halb so viele Einnahmen.', lvl: 4, preis: 12000, pokale: 0 },
  { id: 'messzug', n: 'Gleismesszug', text: 'Findet Fehler früh: +50 % Bonus für selbst behobene Störungen.', lvl: 5, preis: 15000, pokale: 0 },
  { id: 'fahrgastinfo', n: 'Fahrgastinformation', text: 'Anzeigen und App für Fahrgäste: Miete +10 %.', lvl: 6, preis: 20000, pokale: 0 },
  { id: 'umbauzug', n: 'Umbauzug', text: 'Erneuert Gleise in einem Durchgang: Streckenausbau −20 %.', lvl: 7, preis: 30000, pokale: 0 },
  { id: 'schaufel', n: 'Goldene Schaufel (Duell-Preis)', text: 'Ehrenpreis für Duell-Profis: Miete +5 %.', lvl: 1, preis: 0, pokale: 12 },
];

/** Benoetigte Erfahrungspunkte fuer Level 1, 2, 3, ... */
export const LEVEL_XP = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
export const levelAus = (xp: number): number => LEVEL_XP.filter((g) => xp >= g).length;
