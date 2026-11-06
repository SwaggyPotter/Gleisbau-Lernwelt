import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { GAST_STANDARD_IDS, QuizTile, alleAppTiles } from '../../shared/katalog';

export type AppPruefStatus = 'geprueft' | 'ungeprueft';
/** gaeste = alle inkl. Gäste · azubis = alle mit Seiten-Login, keine Gäste · versteckt = nur Admin */
export type AppSichtbarkeit = 'gaeste' | 'azubis' | 'versteckt';
export interface AppEinstellung { status: AppPruefStatus; sichtbarkeit: AppSichtbarkeit; }
type Einstellungen = Record<string, AppEinstellung>;

const CACHE_KEY = 'glw-app-status';

function leseCache(): Einstellungen {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Einstellungen;
  } catch {
    return {};
  }
}

/** Standard, solange der Admin nichts eingestellt hat. */
function standard(t: QuizTile): AppEinstellung {
  return GAST_STANDARD_IDS.includes(t.id)
    ? { status: t.geprueft ? 'geprueft' : 'ungeprueft', sichtbarkeit: 'gaeste' }
    : { status: t.geprueft ? 'geprueft' : 'ungeprueft', sichtbarkeit: 'azubis' };
}

/** Synchron (für den Router-Guard): Einstellung einer Kachel aus Cache + Standard. */
export function appEinstellung(t: QuizTile, daten: Einstellungen = leseCache()): AppEinstellung {
  return daten[t.id] ?? standard(t);
}

/** Synchron (für den Router-Guard): Links der Apps, die Gäste öffnen dürfen. */
export function gastFreigegebeneLinks(): string[] {
  const daten = leseCache();
  return alleAppTiles().filter(t => appEinstellung(t, daten).sichtbarkeit === 'gaeste').map(t => t.link);
}

/**
 * Status (geprüft/ungeprüft) und Sichtbarkeit der App-Kacheln, vom Admin über das
 * Drei-Punkte-Menü auf der Startseite gesetzt. Vom Backend geladen und im localStorage
 * gespiegelt, damit der Guard ohne Netz entscheiden kann.
 */
@Injectable({ providedIn: 'root' })
export class AppStatusService {
  private readonly daten$ = new BehaviorSubject<Einstellungen>(leseCache());
  readonly einstellungen$ = this.daten$.asObservable();

  constructor(private readonly http: HttpClient) {}

  laden(): void {
    this.http.get<{ apps: Einstellungen }>(`${API_BASE_URL}/apps`).subscribe({
      next: r => this.setze(r.apps ?? {}),
      error: () => { /* offline: Cache bleibt */ },
    });
  }

  einstellung(t: QuizTile): AppEinstellung {
    return appEinstellung(t, this.daten$.value);
  }

  speichern(t: QuizTile, e: AppEinstellung): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/apps/${encodeURIComponent(t.id)}`, e).pipe(
      tap(() => this.setze({ ...this.daten$.value, [t.id]: e })),
    );
  }

  private setze(d: Einstellungen): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(d));
    } catch {
      // ohne localStorage nur im Speicher
    }
    this.daten$.next(d);
  }
}
