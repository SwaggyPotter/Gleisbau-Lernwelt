import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { QuizFile, QuizProgress } from '../models/gesamtquiz.models';
import { GesamtquizDataService } from '../services/gesamtquiz-data.service';

@Component({
  selector: 'app-zusatz-gesamtquiz',
  templateUrl: './gesamtquiz.page.html',
  styleUrls: ['./gesamtquiz.page.scss'],
  standalone: false,
})
export class ZusatzGesamtquizPage implements OnInit, OnDestroy {
  quiz?: QuizFile;
  loading = true;
  error = '';
  progress: QuizProgress = { quizStats: {} };
  private sub = new Subscription();

  constructor(private readonly data: GesamtquizDataService) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
    this.sub.add(
      this.data.getQuiz().subscribe({
        next: quiz => {
          this.quiz = quiz;
          this.loading = false;
        },
        error: () => {
          this.error = 'Gesamtquiz konnte nicht geladen werden.';
          this.loading = false;
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  quizAnswered(payload: { id: string; correct: boolean }): void {
    this.progress = this.data.recordQuizResult(payload.id, payload.correct);
  }

  answeredQuizCount(): number {
    return Object.keys(this.progress.quizStats ?? {}).length;
  }

  totalAttempts(): number {
    return Object.values(this.progress.quizStats ?? {}).reduce((sum, entry) => sum + entry.correct + entry.wrong, 0);
  }
}
