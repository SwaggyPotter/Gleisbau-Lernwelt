export interface ThemenquizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
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
