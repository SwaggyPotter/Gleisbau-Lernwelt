import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../api-config';

const CLIENT_KEY = 'glw-client-id';
const INTERVAL_MS = 60_000;

/**
 * Meldet diesen Browser anonym als "online" (zufaellige ID aus dem localStorage, keine
 * Namen/IPs) und liefert die aktuelle Zahl aktiver Besucher fuer die Anzeige im Dashboard.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly onlineSubject = new BehaviorSubject<number | null>(null);
  readonly online$ = this.onlineSubject.asObservable();

  private started = false;

  constructor(private readonly http: HttpClient) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.ping();
    setInterval(() => {
      if (document.visibilityState === 'visible') this.ping();
    }, INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.ping();
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
      return crypto.randomUUID();
    }
  }

  private ping(): void {
    this.http.post<{ online: number }>(`${API_BASE_URL}/presence`, { clientId: this.clientId() }).subscribe({
      next: res => this.onlineSubject.next(res.online),
      error: () => { /* Anzeige bleibt auf dem letzten Wert */ },
    });
  }
}
