import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../core/api-config';

export interface GlossarFreigabe {
  pruefsumme: string;
  geprueftAm: string;
  geprueftVon: string | null;
}

/**
 * Admin-Freigaben im Glossar (Backend /glossar-freigaben). Klappt das Laden nicht
 * (offline, Server weg), gilt einfach alles als ungeprüft.
 */
@Injectable({ providedIn: 'root' })
export class GlossarFreigabenService {
  private readonly stand = new BehaviorSubject<Record<string, GlossarFreigabe>>({});
  private ladefehler = false;

  readonly freigaben$ = this.stand.asObservable();

  constructor(private readonly http: HttpClient) {}

  get fehler(): boolean {
    return this.ladefehler;
  }

  neuLaden(): void {
    this.http.get<{ freigaben: Record<string, GlossarFreigabe> }>(`${API_BASE_URL}/glossar-freigaben`).pipe(
      timeout(6000),
      map(r => r.freigaben ?? {}),
      tap(() => { this.ladefehler = false; }),
      catchError(() => { this.ladefehler = true; return of(this.stand.value); }),
    ).subscribe(f => this.stand.next(f));
  }

  freigeben(id: string, pruefsumme: string, name: string | null): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/glossar-freigaben/${id}`, { pruefsumme }).pipe(
      tap(() => this.stand.next({ ...this.stand.value, [id]: { pruefsumme, geprueftAm: new Date().toISOString(), geprueftVon: name } })),
    );
  }

  zuruecknehmen(id: string): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/glossar-freigaben/${id}`).pipe(
      tap(() => {
        const s = { ...this.stand.value };
        delete s[id];
        this.stand.next(s);
      }),
    );
  }
}
