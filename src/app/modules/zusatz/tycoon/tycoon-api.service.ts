import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';

export interface TycoonMe {
  state: unknown | null;
  shared: boolean;
  visitors: number;
}

export interface TycoonEintrag {
  rank: number;
  userId: string;
  name: string;
  money: number;
  lines: number;
  trains: number;
  visitors: number;
  mode: number;
  shared: boolean;
  isMe: boolean;
  xp: number;
  maxCls: number;
  siege: number;
}

export interface TycoonDuell {
  id: string;
  rolle: 'herausforderer' | 'gegner';
  gegnerName: string;
  stunden: number;
  status: 'offen' | 'laeuft' | 'fertig';
  ende: string | null;
  meinZuwachs: number;
  gegnerZuwachs: number;
  ergebnis: 'sieg' | 'remis' | 'niederlage' | null;
  abgeholt: boolean;
}

export interface TycoonAnsicht {
  name: string;
  money: number;
  visitors: number;
  state: unknown;
}

@Injectable({ providedIn: 'root' })
export class TycoonApiService {
  constructor(private readonly http: HttpClient) {}

  meinStand(): Observable<TycoonMe> {
    return this.http.get<TycoonMe>(`${API_BASE_URL}/tycoon/me`);
  }

  speichern(state: unknown): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${API_BASE_URL}/tycoon/me`, { state });
  }

  zuruecksetzen(): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/tycoon/me`);
  }

  teilen(shared: boolean): Observable<{ shared: boolean }> {
    return this.http.put<{ shared: boolean }>(`${API_BASE_URL}/tycoon/share`, { shared });
  }

  rangliste(): Observable<{ entries: TycoonEintrag[] }> {
    return this.http.get<{ entries: TycoonEintrag[] }>(`${API_BASE_URL}/tycoon/leaderboard`);
  }

  duelle(): Observable<{ duelle: TycoonDuell[] }> {
    return this.http.get<{ duelle: TycoonDuell[] }>(`${API_BASE_URL}/tycoon/duelle`);
  }

  herausfordern(gegnerId: string, stunden: 1 | 24): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE_URL}/tycoon/duelle`, { gegnerId, stunden });
  }

  duellAnnehmen(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/duelle/${id}/annehmen`, {});
  }

  /** Ablehnen (als Gegner) oder Zurueckziehen (als Herausforderer). */
  duellAblehnen(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/duelle/${id}/ablehnen`, {});
  }

  duellAbholen(id: string): Observable<{ ergebnis: 'sieg' | 'remis' | 'niederlage'; pokale: number; xp: number }> {
    return this.http.post<{ ergebnis: 'sieg' | 'remis' | 'niederlage'; pokale: number; xp: number }>(`${API_BASE_URL}/tycoon/duelle/${id}/abholen`, {});
  }

  ansehen(userId: string): Observable<TycoonAnsicht> {
    return this.http.get<TycoonAnsicht>(`${API_BASE_URL}/tycoon/view/${userId}`);
  }
}
