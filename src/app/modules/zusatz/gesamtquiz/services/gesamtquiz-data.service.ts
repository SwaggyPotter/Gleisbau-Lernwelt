import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { QuizFile, QuizProgress } from '../models/gesamtquiz.models';

const STORAGE_KEY = 'zusatz-gesamtquiz-progress';

@Injectable({ providedIn: 'root' })
export class GesamtquizDataService {
  private quiz$?: Observable<QuizFile>;

  constructor(private readonly http: HttpClient) {}

  getQuiz(): Observable<QuizFile> {
    if (!this.quiz$) {
      this.quiz$ = this.http
        .get<QuizFile>('assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json')
        .pipe(shareReplay(1));
    }
    return this.quiz$;
  }

  loadProgress(): QuizProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { quizStats: {} };
    }
    try {
      return JSON.parse(raw) as QuizProgress;
    } catch {
      return { quizStats: {} };
    }
  }

  saveProgress(next: Partial<QuizProgress>): QuizProgress {
    const merged: QuizProgress = { ...this.loadProgress(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  }

  recordQuizResult(questionId: string, correct: boolean): QuizProgress {
    const state = this.loadProgress();
    const prev = state.quizStats[questionId] ?? { correct: 0, wrong: 0 };
    const quizStats = {
      ...state.quizStats,
      [questionId]: {
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
      },
    };
    return this.saveProgress({ quizStats });
  }
}
