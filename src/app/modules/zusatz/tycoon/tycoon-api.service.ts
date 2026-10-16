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

  ansehen(userId: string): Observable<TycoonAnsicht> {
    return this.http.get<TycoonAnsicht>(`${API_BASE_URL}/tycoon/view/${userId}`);
  }
}
