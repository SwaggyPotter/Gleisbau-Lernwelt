import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BlockProgress, ContentBlock, QuizFile } from '../models/lf13.models';

const STORAGE_KEY = 'lf13-progress';

@Injectable({ providedIn: 'root' })
export class Lf13DataService {
  private readonly base = 'assets/lernfelder/lernfeld-13/';

  private content$?: Observable<ContentBlock[]>;
  private quiz$?: Observable<QuizFile>;

  constructor(private readonly http: HttpClient) {}

  getContent(): Observable<ContentBlock[]> {
    if (!this.content$) {
      this.content$ = this.http.get<{ blocks: ContentBlock[] }>(`${this.base}lf13-content.json`).pipe(
        map(res => res.blocks ?? []),
        shareReplay(1),
      );
    }
    return this.content$;
  }

  getQuiz(): Observable<QuizFile> {
    if (!this.quiz$) {
      this.quiz$ = this.http.get<QuizFile>(`${this.base}lf13-quiz.json`).pipe(shareReplay(1));
    }
    return this.quiz$;
  }

  loadProgress(): BlockProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedBlocks: [], quizStats: {} };
    }
    try {
      return JSON.parse(raw) as BlockProgress;
    } catch (e) {
      console.warn('lf13 progress parse failed', e);
      return { completedBlocks: [], quizStats: {} };
    }
  }

  saveProgress(next: Partial<BlockProgress>): BlockProgress {
    const merged: BlockProgress = { ...this.loadProgress(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  }

  toggleBlockCompleted(blockId: string): BlockProgress {
    const state = this.loadProgress();
    const exists = state.completedBlocks.includes(blockId);
    const completedBlocks = exists
      ? state.completedBlocks.filter(id => id !== blockId)
      : [...state.completedBlocks, blockId];
    return this.saveProgress({ completedBlocks });
  }

  recordQuizResult(questionId: string, correct: boolean): BlockProgress {
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







