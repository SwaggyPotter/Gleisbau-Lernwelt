export type Phase = 'setup' | 'running' | 'finished';

export interface LaufendeAntwort {
  questionId: string;
  gewaehlt: string | null;
}

export interface PruefungsErgebnis {
  datum: string;
  anzahlFragen: number;
  richtig: number;
  prozent: number;
  bestanden: boolean;
  abgebrochenDurchZeit: boolean;
}

export interface PruefungssimulationHistorie {
  versuche: PruefungsErgebnis[];
  bestesProzent: number;
}
