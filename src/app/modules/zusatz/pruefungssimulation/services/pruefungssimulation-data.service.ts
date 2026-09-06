import { Injectable } from '@angular/core';
import { PruefungsErgebnis, PruefungssimulationHistorie } from '../models/pruefungssimulation.models';

const STORAGE_KEY = 'pruefungssimulation-historie';
const MAX_VERSUCHE = 20;

@Injectable({ providedIn: 'root' })
export class PruefungssimulationDataService {
  laden(): PruefungssimulationHistorie {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { versuche: [], bestesProzent: 0 };
    try {
      return JSON.parse(raw) as PruefungssimulationHistorie;
    } catch {
      return { versuche: [], bestesProzent: 0 };
    }
  }

  speichern(ergebnis: PruefungsErgebnis): PruefungssimulationHistorie {
    const state = this.laden();
    state.versuche = [ergebnis, ...state.versuche].slice(0, MAX_VERSUCHE);
    state.bestesProzent = Math.max(state.bestesProzent, ergebnis.prozent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
}
