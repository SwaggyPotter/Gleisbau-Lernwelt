import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { QuizQuestion } from '../models/gesamtquiz.models';
import { QuestionReportService } from '../../../../services/question-report.service';

type AnswerState = { choice?: string; correct?: boolean };

@Component({
  selector: 'app-gesamtquiz-quiz-engine',
  templateUrl: './quiz-engine.component.html',
  styleUrls: ['./quiz-engine.component.scss'],
  standalone: false,
})
export class GesamtquizEngineComponent implements OnChanges {
  @Input() questions: QuizQuestion[] = [];
  @Input() questionIds?: string[];
  @Input() limit?: number;
  @Input() shuffle = true;
  @Input() title = 'Gesamtquiz';
  @Output() answered = new EventEmitter<{ id: string; correct: boolean }>();

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private reportSvc: QuestionReportService
  ) {}

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
      this.finishedSummary = { correct: correctCount, total: this.active.length };
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

  async reportQuestion(): Promise<void> {
    const q = this.currentQuestion();
    if (!q) return;

    const alert = await this.alertCtrl.create({
      header: 'Frage melden',
      subHeader: 'Was ist an dieser Frage falsch oder unklar?',
      inputs: [
        { name: 'comment', type: 'textarea', placeholder: 'z. B. falsche Loesung, veraltete Norm, unklare Formulierung...' },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Melden',
          handler: async (data: { comment?: string }) => {
            this.reportSvc.submitReport({
              questionId: q.id,
              topic: this.title,
              question: q.question,
              reason: 'Nutzer-Meldung',
              comment: data.comment,
            });
            const toast = await this.toastCtrl.create({ message: 'Danke, die Meldung wurde gespeichert.', duration: 2000, color: 'success' });
            await toast.present();
          },
        },
      ],
    });
    await alert.present();
  }

  private shuffleArray<T>(arr: T[]): T[] {
    return arr
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(entry => entry.item);
  }
}
