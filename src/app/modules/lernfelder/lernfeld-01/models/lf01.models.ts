import { SafeUrl } from '@angular/platform-browser';

export type ContentEntry =
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; variant: 'danger' | 'info' | 'tip'; title: string; value: string }
  | { type: 'checklist'; items: Array<{ label: string; hint?: string }> }
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

export interface ScenarioChoice {
  id: string;
  text: string;
  impact: { score: number };
  feedback: string;
}

export interface Scenario {
  id: string;
  title: string;
  situation: string;
  choices: ScenarioChoice[];
  learningPoints: string[];
}

export interface ScenarioFile {
  meta: { lernfeld: string; version: string };
  scenarios: Scenario[];
}

export interface PuzzleSlot {
  slotId: string;
  label: string;
  accept: string[];
}

export interface PuzzleItem {
  id: string;
  type: 'sign' | 'barrier' | 'light' | 'marker';
  name: string;
  img?: string;
  note?: string;
}

export interface PuzzleLevel {
  id: string;
  title: string;
  canvas: { background: string | SafeUrl; slots: PuzzleSlot[] };
  items: PuzzleItem[];
  successText: string;
  failHints: string[];
}

export interface PuzzleFile {
  meta: { lernfeld: string; version: string };
  levels: PuzzleLevel[];
}

export interface BlockProgress {
  completedBlocks: string[];
  quizStats: Record<string, { correct: number; wrong: number }>;
  scenarioScore: number;
  quickTests: Array<{ correct: number; total: number; takenAt: number }>;
}

