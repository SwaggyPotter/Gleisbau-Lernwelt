import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { ThemenquizFile, ThemenquizProgress } from '../models/themenquiz.models';
import { ThemenquizDataService } from '../services/themenquiz-data.service';

@Component({
  selector: 'app-themenquiz',
  templateUrl: './themenquiz.page.html',
  styleUrls: ['./themenquiz.page.scss'],
  standalone: false,
})
export class ThemenquizPage implements OnInit, OnDestroy {
  quiz?: ThemenquizFile;
  loading = true;
  error = '';
  progress: ThemenquizProgress = { quizStats: {} };
  private topicId = '';
  private sub = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly data: ThemenquizDataService,
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap
        .pipe(
          switchMap(params => {
            this.topicId = params.get('topicId') ?? '';
            this.loading = true;
            this.error = '';
            this.progress = this.data.loadProgress(this.topicId);
            return this.data.getQuiz(this.topicId);
          }),
        )
        .subscribe({
          next: quiz => {
            this.quiz = quiz;
            this.loading = false;
          },
          error: () => {
            this.error = 'Dieses Thema konnte nicht geladen werden.';
            this.loading = false;
          },
        }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  quizAnswered(payload: { id: string; correct: boolean }): void {
    this.progress = this.data.recordResult(this.topicId, payload.id, payload.correct);
  }

  answeredCount(): number {
    return Object.keys(this.progress.quizStats ?? {}).length;
  }
}
