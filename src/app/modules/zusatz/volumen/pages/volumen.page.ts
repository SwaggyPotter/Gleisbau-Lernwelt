import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockProgress, QuizFile } from '../models/volumen.models';
import { VolumenDataService } from '../services/volumen-data.service';

@Component({
  selector: 'app-volumen',
  templateUrl: './volumen.page.html',
  styleUrls: ['./volumen.page.scss'],
  standalone: false,
})
export class VolumenPage implements OnInit, OnDestroy {
  quiz?: QuizFile;
  loading = true;
  error = '';
  progress: BlockProgress = { quizStats: {} };
  private sub = new Subscription();

  constructor(private readonly data: VolumenDataService) {}

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
