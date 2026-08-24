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
  meta: { lernfeld: string; title: string; version: string };
  questions: QuizQuestion[];
}

export interface BlockProgress {
  quizStats: Record<string, { correct: number; wrong: number }>;
}
