import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';
import { Einstellungen, Errungenschaft, ErrungenschaftFreigeschaltet, RegistrierungsKey, StatsUebersicht } from '../models/profil.models';

@Injectable({ providedIn: 'root' })
export class ProfilApiService {
  constructor(private readonly http: HttpClient) {}

  meineStatistiken(): Observable<StatsUebersicht> {
    return this.http.get<StatsUebersicht>(`${API_BASE_URL}/stats/me`);
  }

  alleErrungenschaften(): Observable<{ achievements: Errungenschaft[] }> {
    return this.http.get<{ achievements: Errungenschaft[] }>(`${API_BASE_URL}/achievements`);
  }

  meineErrungenschaften(): Observable<{ freigeschaltet: ErrungenschaftFreigeschaltet[] }> {
    return this.http.get<{ freigeschaltet: ErrungenschaftFreigeschaltet[] }>(`${API_BASE_URL}/achievements/me`);
  }

  meineEinstellungen(): Observable<{ settings: Einstellungen }> {
    return this.http.get<{ settings: Einstellungen }>(`${API_BASE_URL}/settings/me`);
  }

  einstellungenSpeichern(settings: Partial<Einstellungen>): Observable<{ settings: Einstellungen }> {
    return this.http.put<{ settings: Einstellungen }>(`${API_BASE_URL}/settings/me`, settings);
  }

  schluesselListe(): Observable<{ keys: RegistrierungsKey[] }> {
    return this.http.get<{ keys: RegistrierungsKey[] }>(`${API_BASE_URL}/keys`);
  }

  schluesselErstellen(year: number, fullName: string): Observable<{ key: RegistrierungsKey }> {
    return this.http.post<{ key: RegistrierungsKey }>(`${API_BASE_URL}/keys`, { year, fullName });
  }

  schluesselLoeschen(key: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/keys/${encodeURIComponent(key)}`);
  }
}
