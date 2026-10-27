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
  bezirke: number;
  clan: string | null;
}

export interface TycoonClan {
  id: string;
  name: string;
  kuerzel: string;
  farbe: string;
  mitglieder: number;
  xp: number;
  bezirke: number;
  namen: string[];
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

  /** Gemeinsame Welt: Gebietsbesitz, Aktivitaet je Stadt, Anzahl offener Gutschriften. */
  welt(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/tycoon/welt`);
  }

  /** Gebiet kaufen: stadt = GEBIET_STADT, bezirk = Gebiets-ID (Tabelle tycoon_bezirke). */
  bezirkKaufen(stadt: number, bezirk: number, basis: number): Observable<{ preis: number; uebernommen: boolean }> {
    return this.http.post<{ preis: number; uebernommen: boolean }>(`${API_BASE_URL}/tycoon/bezirke`, { stadt, bezirk, basis });
  }

  gutschriftenAbholen(): Observable<{ summe: number; xp: number; eintraege: { betrag: number; xp: number; text: string }[] }> {
    return this.http.post<{ summe: number; xp: number; eintraege: { betrag: number; xp: number; text: string }[] }>(`${API_BASE_URL}/tycoon/gutschriften/abholen`, {});
  }

  /** Neue Strecke melden; Clan-Mitglieder, denen die Gebiete der Endstaedte gehoeren, bekommen Erfahrung. */
  verbindung(a: number, b: number, nameA: string, nameB: string, gebiete: number[]): Observable<{ mitglieder: number; xp: number }> {
    return this.http.post<{ mitglieder: number; xp: number }>(`${API_BASE_URL}/tycoon/verbindung`, { a, b, nameA, nameB, gebiete });
  }

  clanProjektStarten(art: string): Observable<unknown> {
    return this.http.post<unknown>(`${API_BASE_URL}/tycoon/clan-projekt`, { art });
  }

  clanBeitrag(betrag: number, schicht: boolean): Observable<{ stand: number; ziel: number; fertig: boolean }> {
    return this.http.post<{ stand: number; ziel: number; fertig: boolean }>(`${API_BASE_URL}/tycoon/clan-projekt/beitrag`, { betrag, schicht });
  }

  clans(): Observable<{ meinClan: string | null; farben: string[]; clans: TycoonClan[] }> {
    return this.http.get<{ meinClan: string | null; farben: string[]; clans: TycoonClan[] }>(`${API_BASE_URL}/tycoon/clans`);
  }

  clanGruenden(name: string, kuerzel: string, farbe: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE_URL}/tycoon/clans`, { name, kuerzel, farbe });
  }

  clanBeitreten(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/${id}/beitreten`, {});
  }

  clanAustreten(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/austreten`, {});
  }

  ansehen(userId: string): Observable<TycoonAnsicht> {
    return this.http.get<TycoonAnsicht>(`${API_BASE_URL}/tycoon/view/${userId}`);
  }
}
