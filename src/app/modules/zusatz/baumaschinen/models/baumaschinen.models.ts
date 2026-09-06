export interface Maschine {
  id: string;
  name: string;
  beschreibung: string;
  bildUrl: string;
  bildCredit: string;
}

export interface Runde {
  maschine: Maschine;
  optionen: Maschine[];
  antwort: Maschine | null;
}

export interface BaumaschinenProgress {
  streak: number;
  bestStreak: number;
  correct: number;
  total: number;
}
