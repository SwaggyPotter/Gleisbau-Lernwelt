export type KategorieId = 'laengenaenderung' | 'luekenschluss';

export type DiagrammTyp = 'dehnung' | 'luecke';

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

export interface SchienendehnungProgress {
  streak: number;
  bestStreak: number;
  correct: number;
  total: number;
}
