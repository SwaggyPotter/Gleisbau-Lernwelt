import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { BlockProgress, ContentBlock, PuzzleFile, QuizFile, ScenarioFile } from '../models/lf01.models';

const STORAGE_KEY = 'lf01-progress';

@Injectable({ providedIn: 'root' })
export class Lf01DataService {
  private readonly base = 'assets/lernfelder/lernfeld-01/';

  private content$?: Observable<ContentBlock[]>;
  private quiz$?: Observable<QuizFile>;
  private scenarios$?: Observable<ScenarioFile>;
  private puzzle$?: Observable<PuzzleFile>;

  constructor(private readonly http: HttpClient) {}

  getContent(): Observable<ContentBlock[]> {
    if (!this.content$) {
      this.content$ = this.http.get<{ blocks: ContentBlock[] }>(`${this.base}lf01-content.json`).pipe(
        map(res => res.blocks ?? []),
        shareReplay(1),
      );
    }
    return this.content$;
  }

  getQuiz(): Observable<QuizFile> {
    if (!this.quiz$) {
      this.quiz$ = this.http.get<QuizFile>(`${this.base}lf01-quiz.json`).pipe(shareReplay(1));
    }
    return this.quiz$;
  }

  getScenarios(): Observable<ScenarioFile> {
    if (!this.scenarios$) {
      this.scenarios$ = this.http.get<ScenarioFile>(`${this.base}lf01-scenarios.json`).pipe(shareReplay(1));
    }
    return this.scenarios$;
  }

  getPuzzle(): Observable<PuzzleFile> {
    if (!this.puzzle$) {
      this.puzzle$ = this.http.get<PuzzleFile>(`${this.base}lf01-puzzle.json`).pipe(shareReplay(1));
    }
    return this.puzzle$;
  }

  loadProgress(): BlockProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedBlocks: [], quizStats: {}, scenarioScore: 0, quickTests: [] };
    }
    try {
      return JSON.parse(raw) as BlockProgress;
    } catch (e) {
      console.warn('lf01 progress parse failed', e);
      return { completedBlocks: [], quizStats: {}, scenarioScore: 0, quickTests: [] };
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

  recordScenarioScore(delta: number): BlockProgress {
    const state = this.loadProgress();
    const scenarioScore = Math.max(0, (state.scenarioScore ?? 0) + delta);
    return this.saveProgress({ scenarioScore });
  }

  recordQuickTest(correct: number, total: number): BlockProgress {
    const state = this.loadProgress();
    const quickTests = [...(state.quickTests ?? []), { correct, total, takenAt: Date.now() }].slice(-5);
    return this.saveProgress({ quickTests });
  }

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.content$ = undefined;
    this.quiz$ = undefined;
    this.scenarios$ = undefined;
    this.puzzle$ = undefined;
  }
}

