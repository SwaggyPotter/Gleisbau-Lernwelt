export type ContentEntry =
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; variant: 'danger' | 'info' | 'tip'; title: string; value: string }
  | { type: 'image'; src: string; caption?: string };

export interface ContentBlock {
  id: string;
  title: string;
  goals: string[];
  summary: string;
  content: ContentEntry[];
  quizRef?: string[];
}

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
  completedBlocks: string[];
  quizStats: Record<string, { correct: number; wrong: number }>;
}

