import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface Nachricht {
  id: number;
  betreff: string;
  text: string;
  link: string | null;
  linkText: string | null;
  erstelltAm: string;
  gelesen: boolean;
  absender: string;
}

export interface Empfaenger { id: string; name: string; rolle: string; gast: boolean; }

export interface NeueNachricht {
  an: string;           // Konto-ID oder 'alle'
  betreff: string;
  text: string;
  link?: string;
  linkText?: string;
}

/**
 * Postfach (Tim, 2026-11-10): persönliche Nachrichten für jedes Konto (auch Gastkonten).
 * Hält die Zahl ungelesener Nachrichten für das Briefsymbol und den Hinweis unten.
 */
@Injectable({ providedIn: 'root' })
export class PostfachService {
  private readonly ungelesen$ = new BehaviorSubject<{ anzahl: number; neueste: { id: number; betreff: string } | null }>({ anzahl: 0, neueste: null });
  readonly stand$ = this.ungelesen$.asObservable();

  constructor(private readonly http: HttpClient) {}

  /** Ungelesen-Zahl vom Server holen (still bei Fehlern, z. B. offline) */
  aktualisieren(): void {
    this.http.get<{ anzahl: number; neueste: { id: number; betreff: string } | null }>(`${API_BASE_URL}/nachrichten/ungelesen`)
      .pipe(catchError(() => of(null)))
      .subscribe(r => { if (r) this.ungelesen$.next(r); });
  }

  zuruecksetzen(): void {
    this.ungelesen$.next({ anzahl: 0, neueste: null });
  }

  liste(): Observable<{ nachrichten: Nachricht[] }> {
    return this.http.get<{ nachrichten: Nachricht[] }>(`${API_BASE_URL}/nachrichten`);
  }

  gelesen(id: number): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/nachrichten/${id}/gelesen`, {}).pipe(tap(() => this.aktualisieren()));
  }

  loeschen(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/nachrichten/${id}`).pipe(tap(() => this.aktualisieren()));
  }

  /* ---------- nur Admin ---------- */
  empfaenger(): Observable<{ empfaenger: Empfaenger[] }> {
    return this.http.get<{ empfaenger: Empfaenger[] }>(`${API_BASE_URL}/nachrichten/empfaenger`);
  }

  senden(n: NeueNachricht): Observable<{ gesendet: number }> {
    return this.http.post<{ gesendet: number }>(`${API_BASE_URL}/nachrichten`, n);
  }
}
