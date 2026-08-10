import { Injectable } from '@angular/core';
import { Difficulty, MaterialrechnerProgress } from '../models/materialrechner.models';

const STORAGE_KEY = 'materialrechner-progress';

const EMPTY: MaterialrechnerProgress = {
  stats: {
    leicht: { correct: 0, wrong: 0 },
    mittel: { correct: 0, wrong: 0 },
    schwer: { correct: 0, wrong: 0 },
  },
};

@Injectable({ providedIn: 'root' })
export class MaterialrechnerDataService {
  loadProgress(): MaterialrechnerProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY);
    try {
      const parsed = JSON.parse(raw) as MaterialrechnerProgress;
      return { stats: { ...structuredClone(EMPTY).stats, ...parsed.stats } };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  recordResult(difficulty: Difficulty, correct: boolean): MaterialrechnerProgress {
    const state = this.loadProgress();
    const entry = state.stats[difficulty];
    if (correct) entry.correct += 1;
    else entry.wrong += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
}
