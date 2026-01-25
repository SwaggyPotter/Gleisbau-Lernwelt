import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, QuizQuestion, QuizSession } from '../services/api.service';

@Component({
  selector: 'app-field-quiz',
  templateUrl: './field-quiz.page.html',
  styleUrls: ['./field-quiz.page.scss'],
  standalone: false,
})
export class FieldQuizPage implements OnInit, OnDestroy {
  fieldId = '';
  session?: QuizSession;
  currentIndex = 0;
  loading = true;
  error = '';
  results: { total: number; correct: number; questions: Array<QuizQuestion & { selectedIndex: number | null; correctIndex: number; isCorrect: boolean }> } | null = null;
  private sub = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    public readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.error = 'Lernfeld-ID fehlt';
          return;
        }
        this.fieldId = id;
        this.startQuiz();
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get questions(): QuizQuestion[] {
    return this.session?.questions ?? [];
  }

  get progressValue(): number {
    const total = this.questions.length || 1;
    const answered = Object.keys(this.session?.answers ?? {}).length;
    return Math.min(1, answered / total);
  }

  selectQuestion(index: number): void {
    if (!this.session) return;
    this.currentIndex = index;
  }

  selectChoice(choiceIndex: number): void {
    if (!this.session) return;
    const question = this.questions[this.currentIndex];
    this.api.submitQuizAnswer(this.session.id, question.id, choiceIndex).subscribe({
      next: res => {
        this.session = {
          ...this.session!,
          answers: { ...this.session!.answers, [question.id]: choiceIndex },
        };
        const total = this.questions.length;
        const answered = res.progress.answered;
        if (this.currentIndex < total - 1) {
          this.currentIndex += 1;
        } else if (answered === total) {
          this.finish();
        }
      },
      error: () => {
        this.error = 'Antwort konnte nicht gespeichert werden';
      },
    });
  }

  goPrev(): void {
    if (this.currentIndex > 0) this.currentIndex -= 1;
  }

  goNext(): void {
    if (!this.session) return;
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex += 1;
    }
  }

  finish(): void {
    if (!this.session) return;
    this.api.completeQuiz(this.session.id).subscribe({
      next: () => {
        this.api.getQuizResults(this.session!.id).subscribe({
          next: res => {
            this.results = res.results;
          },
        });
      },
    });
  }

  restart(): void {
    this.startQuiz(true);
  }

  startQuiz(forceNew = false): void {
    this.loading = true;
    this.error = '';
    this.results = null;
    this.api.startQuiz(this.fieldId, undefined, forceNew).subscribe({
      next: res => {
        this.session = res.session;
        this.currentIndex = res.session.currentIndex ?? 0;
        this.loading = false;
      },
      error: () => {
        this.error = 'Quiz konnte nicht geladen werden';
        this.loading = false;
      },
    });
  }
}
