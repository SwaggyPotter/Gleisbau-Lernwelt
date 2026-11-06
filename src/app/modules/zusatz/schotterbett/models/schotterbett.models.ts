export type KategorieId = 'schwellendichte' | 'regelwerte' | 'tabelle' | 'wagen';

export type DiagrammTyp = 'querschnitt' | 'regelwerte' | 'tabelle' | 'wagen';

export interface KategorieInfo {
  id: KategorieId;
  label: string;
  formel: string;
  diagramm: DiagrammTyp;
}

export interface GegebeneGroesse {
  label: string;
  wert: string;
}

export interface Aufgabe {
  id: string;
  kategorie: KategorieId;
  gegeben: GegebeneGroesse[];
  gesuchtLabel: string;
  gesuchtEinheit: string;
  korrekterWert: number;
  toleranzAbs: number;
  nachkommastellen: number;
  rechenweg: string;
}

export type Niveau = 'leicht' | 'mittel' | 'schwer';

export interface TeilAufgabe {
  key: string;
  nr: string;
  frage: string;
  einheit: string;
  korrekt: number;
  toleranzAbs: number;
  nachkommastellen: number;
  rechenweg: string;
  /** Folgefehler: richtig, wenn der Wert aus der (toleranten) Eingabe von `folgeVon` korrekt weitergerechnet wurde. */
  folgeVon?: string;
  folge?: (vorwert: number) => number;
}

export interface Pruefungsaufgabe {
  id: string;
  niveau: Niveau;
  titel: string;
  absaetze: string[];
  gegeben: GegebeneGroesse[];
  teilaufgaben: TeilAufgabe[];
  /** Werte für die Skizze, erst nach dem Prüfen angezeigt. */
  skizze: { vorKopfCm: number; bettungsdickeCm: number; schwellenhoeheM: number; schwellenlaengeM: number };
  /** Passende Seite der Schottertabelle (zum Hinblättern nach dem Prüfen). */
  tabelle: { gleise: 1 | 2; abstandCm: number };
}

export interface SchotterbettProgress {
  streak: number;
  bestStreak: number;
  correct: number;
  total: number;
}
