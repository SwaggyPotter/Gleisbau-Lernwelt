import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { API_BASE_URL } from '../api-config';

const CLIENT_KEY = 'glw-client-id';
/** Bedienung (Tippen/Klicken/Tasten) wird höchstens alle 3 Minuten gemeldet. */
const AKTION_ABSTAND_MS = 3 * 60_000;

/**
 * Meldet Aktivität für die Admin-Übersicht „Aktivität“ (Tim, 2026-11-11):
 * jede geöffnete Seite/App und gelegentlich „hat etwas gemacht“.
 * Mit Konto wird es dem Konto zugeordnet (Token geht über den Auth-Interceptor mit), sonst der Geräte-ID.
 */
@Injectable({ providedIn: 'root' })
export class AktivitaetService {
  private gestartet = false;
  private letzteAktion = 0;

  constructor(private readonly http: HttpClient, private readonly router: Router, private readonly zone: NgZone) {}

  start(): void {
    if (this.gestartet) return;
    this.gestartet = true;
    this.melde('seite', this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.melde('seite', e.urlAfterRedirects));
    this.zone.runOutsideAngular(() => {
      const bedient = () => {
        const jetzt = Date.now();
        if (jetzt - this.letzteAktion < AKTION_ABSTAND_MS) return;
        this.letzteAktion = jetzt;
        this.zone.run(() => this.melde('aktion'));
      };
      window.addEventListener('pointerdown', bedient, { passive: true });
      window.addEventListener('keydown', bedient, { passive: true });
    });
  }

  private clientId(): string {
    try {
      let id = localStorage.getItem(CLIENT_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(CLIENT_KEY, id);
      }
      return id;
    } catch {
      return 'ohne-speicher-0000';
    }
  }

  private melde(art: 'seite' | 'aktion', url?: string): void {
    const pfad = url ? url.split(/[?#]/)[0].replace(/[^A-Za-z0-9/_-]/g, '').slice(0, 200) || '/' : undefined;
    if (art === 'seite') this.letzteAktion = Date.now();
    this.http.post(`${API_BASE_URL}/aktivitaet`, { clientId: this.clientId(), art, pfad }).subscribe({ error: () => { /* offline: egal */ } });
  }
}
