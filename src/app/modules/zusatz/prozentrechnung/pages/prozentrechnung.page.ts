import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockProgress, QuizFile } from '../models/prozentrechnung.models';
import { ProzentrechnungDataService } from '../services/prozentrechnung-data.service';

@Component({
  selector: 'app-prozentrechnung',
  templateUrl: './prozentrechnung.page.html',
  styleUrls: ['./prozentrechnung.page.scss'],
  standalone: false,
})
export class ProzentrechnungPage implements OnInit, OnDestroy {
  quiz?: QuizFile;
  loading = true;
  error = '';
  progress: BlockProgress = { quizStats: {} };
  private sub = new Subscription();

  constructor(private readonly data: ProzentrechnungDataService) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
    this.sub.add(
      this.data.getQuiz().subscribe({
        next: quiz => {
          this.quiz = quiz;
          this.loading = false;
        },
        error: () => {
          this.error = 'Daten konnten nicht geladen werden.';
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

  totalAnswered(): number {
    return Object.values(this.progress.quizStats).reduce((sum, entry) => sum + entry.correct + entry.wrong, 0);
  }
}
