import { Injectable } from '@angular/core';
import { SchienendehnungProgress } from '../models/schienendehnung.models';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';

const STORAGE_KEY = 'schienendehnung-progress';
const EMPTY: SchienendehnungProgress = { streak: 0, bestStreak: 0, correct: 0, total: 0 };

@Injectable({ providedIn: 'root' })
export class SchienendehnungDataService {
  constructor(private readonly profilSync: ProfilSyncService) {}

  loadProgress(): SchienendehnungProgress {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    try {
      return { ...EMPTY, ...(JSON.parse(raw) as SchienendehnungProgress) };
    } catch {
      return { ...EMPTY };
    }
  }

  recordResult(correct: boolean): SchienendehnungProgress {
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
    this.profilSync.melde('zusatz:schienendehnung', correct);
    return state;
  }
}
