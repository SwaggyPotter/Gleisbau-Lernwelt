export interface ThemaFortschritt {
  topicId: string;
  title: string;
  beantwortet: number;
  gesamt: number;
  richtig: number;
  falsch: number;
}

export interface RechentrainerFortschritt {
  id: string;
  label: string;
  link: string;
  richtig: number;
  versuche: number;
  streak?: number;
  bestStreak?: number;
}

export interface PruefungsKurz {
  datum: string;
  prozent: number;
  bestanden: boolean;
}

export interface GesamtFortschritt {
  themen: ThemaFortschritt[];
  rechentrainer: RechentrainerFortschritt[];
  pruefung: { bestesProzent: number; anzahlVersuche: number; letzte: PruefungsKurz[] };
  summeBeantwortet: number;
  summeRichtig: number;
  summeQuote: number;
}
