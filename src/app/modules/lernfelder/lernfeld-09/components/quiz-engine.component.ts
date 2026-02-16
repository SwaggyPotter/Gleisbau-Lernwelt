import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { QuizQuestion } from '../models/lf09.models';

type AnswerState = { choice?: string; correct?: boolean };

@Component({
  selector: 'app-lf09-quiz-engine',
  templateUrl: './quiz-engine.component.html',
  styleUrls: ['./quiz-engine.component.scss'],
  standalone: false,
})
export class QuizEngineComponent implements OnChanges {
  @Input() questions: QuizQuestion[] = [];
  @Input() questionIds?: string[];
  @Input() limit?: number;
  @Input() shuffle = true;
  @Input() title = 'Quiz';
  @Output() answered = new EventEmitter<{ id: string; correct: boolean }>();
  @Output() completed = new EventEmitter<{ correct: number; total: number; wrongIds: string[]; questionIds: string[] }>();

  active: QuizQuestion[] = [];
  answers: Record<string, AnswerState> = {};
  showSolutions = false;
  currentIndex = 0;
  finishedSummary?: { correct: number; total: number };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questions'] || changes['questionIds'] || changes['limit']) {
      this.prepare();
    }
  }

  prepare(): void {
    const filtered = this.questionIds?.length
      ? this.questions.filter(q => this.questionIds?.includes(q.id))
      : this.questions.slice();
    const pool = this.shuffle ? this.shuffleArray(filtered) : filtered;
    this.active = this.limit ? pool.slice(0, this.limit) : pool;
    this.answers = {};
    this.showSolutions = false;
    this.currentIndex = 0;
    this.finishedSummary = undefined;
  }

  select(question: QuizQuestion, choiceId: string): void {
    if (this.answers[question.id]?.choice) {
      return;
    }
    const correct = question.answer === choiceId;
    this.answers[question.id] = { choice: choiceId, correct };
    this.answered.emit({ id: question.id, correct });
    const totalAnswered = Object.keys(this.answers).length;
    if (totalAnswered === this.active.length) {
      const correctCount = Object.values(this.answers).filter(a => a.correct).length;
      const wrongIds = Object.entries(this.answers)
        .filter(([, v]) => !v.correct)
        .map(([id]) => id);
      this.finishedSummary = { correct: correctCount, total: this.active.length };
      this.completed.emit({ correct: correctCount, total: this.active.length, wrongIds, questionIds: this.active.map(q => q.id) });
    }
  }

  reset(): void {
    this.prepare();
  }

  toggleSolutions(): void {
    this.showSolutions = !this.showSolutions;
  }

  choiceState(question: QuizQuestion, choiceId: string): 'correct' | 'wrong' | 'neutral' | 'selected' {
    const current = this.answers[question.id];
    if (!current?.choice) return 'neutral';
    if (choiceId === current.choice) {
      return current.correct ? 'correct' : 'wrong';
    }
    if (choiceId === question.answer && (!current.correct || this.showSolutions)) return 'correct';
    return 'neutral';
  }

  currentQuestion(): QuizQuestion | undefined {
    return this.active[this.currentIndex];
  }

  progressLabel(): string {
    return `Frage ${Math.min(this.currentIndex + 1, this.active.length)} von ${this.active.length}`;
  }

  answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  next(): void {
    if (this.currentIndex < this.active.length - 1) this.currentIndex += 1;
  }

  prev(): void {
    if (this.currentIndex > 0) this.currentIndex -= 1;
  }

  private shuffleArray<T>(arr: T[]): T[] {
    return arr
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(entry => entry.item);
  }
}



