import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ThemenquizFile, ThemenquizProgress, ThemenquizTopic } from '../models/themenquiz.models';

const STORAGE_PREFIX = 'themenquiz-progress-';

@Injectable({ providedIn: 'root' })
export class ThemenquizDataService {
  private topics$?: Observable<ThemenquizTopic[]>;
  private readonly quizCache = new Map<string, Observable<ThemenquizFile>>();

  constructor(private readonly http: HttpClient) {}

  getTopics(): Observable<ThemenquizTopic[]> {
    if (!this.topics$) {
      this.topics$ = this.http
        .get<ThemenquizTopic[]>('assets/themenquiz/topics.json')
        .pipe(shareReplay(1));
    }
    return this.topics$;
  }

  getQuiz(topicId: string): Observable<ThemenquizFile> {
    if (!this.quizCache.has(topicId)) {
      this.quizCache.set(
        topicId,
        this.http.get<ThemenquizFile>(`assets/themenquiz/${topicId}.json`).pipe(shareReplay(1)),
      );
    }
    return this.quizCache.get(topicId)!;
  }

  loadProgress(topicId: string): ThemenquizProgress {
    const raw = localStorage.getItem(STORAGE_PREFIX + topicId);
    if (!raw) {
      return { quizStats: {} };
    }
    try {
      return JSON.parse(raw) as ThemenquizProgress;
    } catch {
      return { quizStats: {} };
    }
  }

  recordResult(topicId: string, questionId: string, correct: boolean): ThemenquizProgress {
    const state = this.loadProgress(topicId);
    const prev = state.quizStats[questionId] ?? { correct: 0, wrong: 0 };
    const next: ThemenquizProgress = {
      quizStats: {
        ...state.quizStats,
        [questionId]: {
          correct: prev.correct + (correct ? 1 : 0),
          wrong: prev.wrong + (correct ? 0 : 1),
        },
      },
    };
    localStorage.setItem(STORAGE_PREFIX + topicId, JSON.stringify(next));
    return next;
  }
}
