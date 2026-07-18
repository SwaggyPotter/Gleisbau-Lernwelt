/**
 * Quiz-Frage Modell
 * 
 * Jedes Thema wurde neu aus öffentlichen Quellen recherchiert.
 * Keine Inhalte aus internen DB-Unterlagen.
 */
export interface QuizQuestion {
  id: string;
  /** Themennummer (1-11) */
  topicNumber: number;
  /** Thementitel */
  topicTitle: string;
  /** Die eigentliche Frage */
  question: string;
  /** Vier plausible Antwortmöglichkeiten */
  options: string[];
  /** Index der richtigen Antwort (0-3) */
  correctAnswerIndex: number;
  /** Erklärung zur richtigen Antwort */
  explanation: string;
  /** Schwierigkeitsgrad: 1=einfach, 2=mittel, 3=schwer */
  difficulty: 1 | 2 | 3;
  /** Kernaussage hinter der Frage */
  keyPoint?: string;
  /** Fachbegriffe die hier vorkommen */
  technicalTerms?: string[];
  /** Quelle für diese Frage */
  source?: SourceInfo;
}

/**
 * Quelleninformation zu einer Quizfrage
 */
export interface SourceInfo {
  /** Titel der Quelle */
  title: string;
  /** Vollständige URL */
  url: string;
  /** Herausgeber/Provider */
  publisher: string;
  /** Stand/Datum der Quelle */
  date?: string;
  /** Abrufdatum */
  retrievedAt: string;
  /** Lizenzstatus */
  license?: string;
}

/**
 * Thema/Lernfeld
 */
export interface Topic {
  /** Themennummer (1-11) */
  number: number;
  /** Titel des Themas */
  title: string;
  /** Kurzbeschreibung */
  description: string;
  /** Suchbegriffe die für die Recherche verwendet wurden */
  searchTerms: string[];
  /** Anzahl der Quizfragen zu diesem Thema */
  questionCount: number;
}

/**
 * Quiz-Session/Ergebnis
 */
export interface QuizResult {
  /** Benutzer-ID oder Session-Code */
  userId: string;
  /** Themennummer */
  topicNumber: number;
  /** Anzahl richtige Antworten */
  correctAnswers: number;
  /** Gesamtanzahl Fragen */
  totalQuestions: number;
  /** Prozentwert */
  percentage: number;
  /** Datum des Durchlaufs */
  date: string;
  /** Dauer in Sekunden */
  durationSeconds?: number;
}

/**
 * Antwort auf eine einzelne Frage (lokal im Browser)
 */
export interface AnswerRecord {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}