export type Formelblock = 'neigungswechsel' | 'ueberhoehung';

export type KategorieId =
  | 'ausrundungsradius-regelwert'
  | 'tangente-ausrundungsradius'
  | 'tangente-gleichgerichtet'
  | 'tangente-entgegengesetzt'
  | 'absetzmass-a'
  | 'absetzmass-ordinate'
  | 'hoehe-neigung-laenge'
  | 'pfeilhoehe-radius'
  | 'magisches-dreieck'
  | 'sform-schramm-laenge'
  | 'sform-schramm-ux'
  | 'sform-bloss-laenge'
  | 'sform-bloss-ux'
  | 'uebergangsbogen-linear'
  | 'ueberhoehungsrampe-linear'
  | 'verwindung';

export type DiagrammTyp =
  | 'ausrundung'
  | 'hoehe-neigung'
  | 'pfeilhoehe'
  | 'boeschung'
  | 'sform'
  | 'linearrampe'
  | 'verwindung';

export interface KategorieInfo {
  id: KategorieId;
  block: Formelblock;
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

export interface TrassierungProgress {
  streak: number;
  bestStreak: number;
  correct: number;
  total: number;
  byKategorie: Partial<Record<KategorieId, { correct: number; total: number }>>;
}
