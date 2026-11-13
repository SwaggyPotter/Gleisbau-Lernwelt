import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { API_BASE_URL } from '../../api-config';
import { AuthService } from './auth.service';

export interface NeueErrungenschaft {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export interface LokaleModulStat {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

@Injectable({ providedIn: 'root' })
export class ProfilSyncService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  /**
   * Meldet einen einzelnen Aufgaben-Versuch ans Server-Profil, falls eingeloggt.
   * No-op ohne Login -- die App funktioniert weiterhin komplett anonym per localStorage,
   * dieser Aufruf ist rein additiv und blockiert die UI nie.
   */
  melde(moduleKey: string, correct: boolean): void {
    ProfilSyncService.lokalZaehlen(moduleKey, correct);
    if (!this.auth.isLoggedIn) return;

    this.http.post<{ neueErrungenschaften: NeueErrungenschaft[] }>(`${API_BASE_URL}/stats/sync`, { moduleKey, correct })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res?.neueErrungenschaften?.length) {
          this.zeigeErrungenschaften(res.neueErrungenschaften);
        }
      });
  }

  /** Lokale Modul-Statistik (auch ohne Konto/als Gast) – Grundlage für die Lernfortschritt-Seite. */
  static readonly LOKAL_KEY = 'glw-modul-statistik';

  static lokaleStatistik(): Record<string, LokaleModulStat> {
    try {
      const raw = localStorage.getItem(ProfilSyncService.LOKAL_KEY);
      const p = raw ? JSON.parse(raw) : {};
      return p && typeof p === 'object' ? p : {};
    } catch {
      return {};
    }
  }

  /** Nur lokal zählen (für Code ohne Angular-DI, z. B. die Tycoon-Engine). Grundlage der Sterne auf der Startseite. */
  static lokalZaehlen(moduleKey: string, correct: boolean): void {
    try {
      const alle = ProfilSyncService.lokaleStatistik();
      const s = alle[moduleKey] ?? { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };
      if (correct) { s.correct++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); }
      else { s.wrong++; s.streak = 0; }
      alle[moduleKey] = s;
      localStorage.setItem(ProfilSyncService.LOKAL_KEY, JSON.stringify(alle));
    } catch {
      // localStorage nicht verfügbar – Statistik bleibt dann nur serverseitig
    }
  }

  private zeigeErrungenschaften(neu: NeueErrungenschaft[]): void {
    // Einfache, unaufdringliche Benachrichtigung ohne zusaetzliche UI-Abhaengigkeit.
    for (const a of neu) {
      // eslint-disable-next-line no-console
      console.info(`Errungenschaft freigeschaltet: ${a.title}`);
    }
    window.dispatchEvent(new CustomEvent('glw-errungenschaft-freigeschaltet', { detail: neu }));
  }
}
