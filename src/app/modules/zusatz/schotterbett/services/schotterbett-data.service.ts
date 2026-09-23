import { Injectable } from '@angular/core';
import { SchotterbettProgress } from '../models/schotterbett.models';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';

const STORAGE_KEY = 'schotterbett-progress';
const EMPTY: SchotterbettProgress = { streak: 0, bestStreak: 0, correct: 0, total: 0 };

@Injectable({ providedIn: 'root' })
export class SchotterbettDataService {
  constructor(private readonly profilSync: ProfilSyncService) {}

  loadProgress(): SchotterbettProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    try {
      return { ...EMPTY, ...(JSON.parse(raw) as SchotterbettProgress) };
    } catch {
      return { ...EMPTY };
    }
  }

  recordResult(correct: boolean): SchotterbettProgress {
    const state = this.loadProgress();
    state.total += 1;
    if (correct) {
      state.correct += 1;
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
      state.streak = 0;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    this.profilSync.melde('zusatz:schotterbett', correct);
    return state;
  }
}
