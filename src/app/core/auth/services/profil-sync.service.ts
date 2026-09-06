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
    if (!this.auth.isLoggedIn) return;

    this.http.post<{ neueErrungenschaften: NeueErrungenschaft[] }>(`${API_BASE_URL}/stats/sync`, { moduleKey, correct })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res?.neueErrungenschaften?.length) {
          this.zeigeErrungenschaften(res.neueErrungenschaften);
        }
      });
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
