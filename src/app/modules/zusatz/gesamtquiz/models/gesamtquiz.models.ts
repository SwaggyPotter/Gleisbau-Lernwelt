export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  block: string;
  type: 'mcq_single';
  question: string;
  choices: QuizChoice[];
  answer: string;
  explain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface QuizFile {
  meta: {
    title: string;
    version: string;
    generatedAt?: string;
    totalQuestions?: number;
    sources?: Array<{ code: string; count: number; title: string }>;
  };
  questions: QuizQuestion[];
}

export interface QuizProgress {
  quizStats: Record<string, { correct: number; wrong: number }>;
}
