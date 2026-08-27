import { Injectable } from '@angular/core';
import { KategorieId, TrassierungProgress } from '../models/trassierung.models';

const STORAGE_KEY = 'trassierung-progress';

const EMPTY: TrassierungProgress = { streak: 0, bestStreak: 0, correct: 0, total: 0, byKategorie: {} };

@Injectable({ providedIn: 'root' })
export class TrassierungDataService {
  loadProgress(): TrassierungProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY);
    try {
      const parsed = JSON.parse(raw) as TrassierungProgress;
      return { ...structuredClone(EMPTY), ...parsed, byKategorie: parsed.byKategorie ?? {} };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  recordResult(kategorie: KategorieId, correct: boolean): TrassierungProgress {
    const state = this.loadProgress();
    state.total += 1;
    if (correct) {
      state.correct += 1;
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
      state.streak = 0;
    }
    const eintrag = state.byKategorie[kategorie] ?? { correct: 0, total: 0 };
    eintrag.total += 1;
    if (correct) eintrag.correct += 1;
    state.byKategorie[kategorie] = eintrag;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
}
