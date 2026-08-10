export type Difficulty = 'leicht' | 'mittel' | 'schwer';

export type AufgabenTyp = 'schicht-volumen' | 'trapez-volumen' | 'material-gewicht' | 'gleisabschnitt';

export interface MaterialDichte {
  key: string;
  name: string;
  schuettdichteTPerM3: number;
  quelle: string;
}

export interface RechenChoice {
  id: string;
  text: string;
  value: number;
}

export interface GeneratedQuestion {
  id: string;
  typ: AufgabenTyp;
  difficulty: Difficulty;
  prompt: string;
  unit: string;
  choices: RechenChoice[];
  correctChoiceId: string;
  explanation: string;
}

export interface MaterialrechnerProgress {
  stats: Record<Difficulty, { correct: number; wrong: number }>;
}
