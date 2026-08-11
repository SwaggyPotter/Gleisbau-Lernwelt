export interface ThemenquizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** Beleg fuer die Antwort, z. B. "DIN EN 13481-2" oder "EBO Paragraph 22". Optional, da nicht jede Frage bereits belegt ist. */
  source?: string;
  /** Optionaler Link zur Quelle (Norm-Datenbank, Gesetzestext, Fachartikel). */
  sourceUrl?: string;
}

export interface ThemenquizFile {
  topicId: string;
  title: string;
  questions: ThemenquizQuestion[];
}

export interface ThemenquizTopic {
  topicId: string;
  title: string;
  description: string;
  questionCount: number;
}

export interface ThemenquizProgress {
  quizStats: Record<string, { correct: number; wrong: number }>;
}
