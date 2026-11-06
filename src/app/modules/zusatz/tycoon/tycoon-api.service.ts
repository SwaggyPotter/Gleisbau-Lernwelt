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
  /** Beitritt nur mit Passwort oder Einladung. */
  passwort: boolean;
}

export interface TycoonClanListe {
  meinClan: string | null;
  farben: string[];
  passwortRecht: boolean;
  einladungen: { clanId: string; von: string }[];
  /** userIds, die mein Clan schon eingeladen hat. */
  eingeladen: string[];
  clans: TycoonClan[];
}

export interface TycoonAnsicht {
  name: string;
  money: number;
  visitors: number;
  state: unknown;
}

export interface TycoonWertungZeile { platz: number; name: string; clan: string | null; punkte: number; ich: boolean }
export interface TycoonWertung {
  woche: { key: string; ende: string; spieler: TycoonWertungZeile[]; ich: { platz: number; punkte: number } | null; clans: { name: string; kuerzel: string; farbe: string; punkte: number; mitglieder: number }[] };
  saison: { key: string; ende: string; spieler: TycoonWertungZeile[]; ich: { platz: number; punkte: number } | null };
  preise: { woche: { pokale: number; geld: number }[]; clan: { pokale: number; xp: number }[]; saison: { pokale: number; geld: number }[]; saisonRest: { pokale: number; geld: number; bis: number } };
}
export interface TycoonFirma { userId: string; name: string; clan: string | null; kurs: number; aktiv: boolean; woche: number; stueck: number; einstand: number | null; ich: boolean }
export interface TycoonAusschreibungen {
  offen: { id: string; bl: string; richt: number; bis: string; gegner: number; bieter: number; meinGebot: number | null; meinVersprechen: number | null }[];
  ergebnisse: { id: string; bl: string; gewonnen: boolean; gebot: number | null; versprechen: number | null; sieger: string | null }[];
}
export interface TycoonFremdStrecke { owner: string; ownerName: string; a: number; b: number; p: number[] | null; cls: number; ol: boolean; gleise: number }
/** Offenes Gebot fuer ein Gebiet: meins = ich biete, sonst bietet jemand fuer mein Gebiet. */
export interface TycoonGebot { id: string; gebiet: number; betrag: number; meins: boolean; bieter: string; besitzer: string; erstellt: string }
export interface TycoonAngebot { id: string; art: 'gebiet' | 'zug'; gebiet: number | null; zug: any; preis: number; meins: boolean; verkaeufer: string }

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

  /** Gemeinsame Welt: Gebietsbesitz, Aktivitaet je Stadt, Anzahl offener Gutschriften. */
  welt(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/tycoon/welt`);
  }

  /** Gebiet kaufen: stadt = GEBIET_STADT, bezirk = Gebiets-ID (Tabelle tycoon_bezirke). */
  bezirkKaufen(stadt: number, bezirk: number, basis: number): Observable<{ preis: number; uebernommen: boolean }> {
    return this.http.post<{ preis: number; uebernommen: boolean }>(`${API_BASE_URL}/tycoon/bezirke`, { stadt, bezirk, basis });
  }

  gutschriftenAbholen(): Observable<{ summe: number; xp: number; pokale: number; eintraege: { betrag: number; xp: number; pokale: number; text: string }[] }> {
    return this.http.post<{ summe: number; xp: number; pokale: number; eintraege: { betrag: number; xp: number; pokale: number; text: string }[] }>(`${API_BASE_URL}/tycoon/gutschriften/abholen`, {});
  }

  /* ---- Gemeinschaft (backend/src/routes/tycoon-gemeinschaft.ts) ---- */
  wertung(): Observable<TycoonWertung> {
    return this.http.get<TycoonWertung>(`${API_BASE_URL}/tycoon/wertung`);
  }

  boerse(): Observable<{ gebuehr: number; maxStueck: number; firmen: TycoonFirma[] }> {
    return this.http.get<{ gebuehr: number; maxStueck: number; firmen: TycoonFirma[] }>(`${API_BASE_URL}/tycoon/boerse`);
  }

  /** stueck > 0 kaufen, < 0 verkaufen; betrag = Buchung fuers Spielkonto (negativ = abbuchen). */
  aktienHandel(firma: string, stueck: number): Observable<{ betrag: number; kurs: number; stueck: number }> {
    return this.http.post<{ betrag: number; kurs: number; stueck: number }>(`${API_BASE_URL}/tycoon/boerse/handel`, { firma, stueck });
  }

  ausschreibungen(bls: string[]): Observable<TycoonAusschreibungen> {
    return this.http.get<TycoonAusschreibungen>(`${API_BASE_URL}/tycoon/ausschreibungen`, { params: { bl: bls.join(',') } });
  }

  ausschreibungNeu(bl: string, richt: number, gegner: { n: string; gebot: number }[]): Observable<{ neu: boolean }> {
    return this.http.post<{ neu: boolean }>(`${API_BASE_URL}/tycoon/ausschreibungen`, { bl, richt, gegner });
  }

  ausschreibungGebot(id: string, gebot: number, versprechen: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/ausschreibungen/${id}/gebot`, { gebot, versprechen });
  }

  ausschreibungAbholen(id: string): Observable<{ bl: string; gebot: number; versprechen: number }> {
    return this.http.post<{ bl: string; gebot: number; versprechen: number }>(`${API_BASE_URL}/tycoon/ausschreibungen/${id}/abholen`, {});
  }

  trassen(stadt: number): Observable<{ strecken: TycoonFremdStrecke[] }> {
    return this.http.get<{ strecken: TycoonFremdStrecke[] }>(`${API_BASE_URL}/tycoon/trassen`, { params: { stadt } });
  }

  trasseMieten(owner: string, a: number, b: number, preisMin: number): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE_URL}/tycoon/trassen`, { owner, a, b, preisMin });
  }

  trasseKuendigen(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/trassen/${id}/kuendigen`, {});
  }

  markt(): Observable<{ angebote: TycoonAngebot[] }> {
    return this.http.get<{ angebote: TycoonAngebot[] }>(`${API_BASE_URL}/tycoon/markt`);
  }

  anbieten(art: 'gebiet' | 'zug', preis: number, gebiet?: number, zug?: unknown): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE_URL}/tycoon/markt`, { art, preis, gebiet, zug });
  }

  marktKaufen(id: string): Observable<{ art: 'gebiet' | 'zug'; preis: number; gebiet: number | null; zug: any }> {
    return this.http.post<{ art: 'gebiet' | 'zug'; preis: number; gebiet: number | null; zug: any }>(`${API_BASE_URL}/tycoon/markt/${id}/kaufen`, {});
  }

  marktZurueck(id: string): Observable<{ art: 'gebiet' | 'zug'; zug: any }> {
    return this.http.post<{ art: 'gebiet' | 'zug'; zug: any }>(`${API_BASE_URL}/tycoon/markt/${id}/zurueck`, {});
  }

  gebote(): Observable<{ gebote: TycoonGebot[] }> {
    return this.http.get<{ gebote: TycoonGebot[] }>(`${API_BASE_URL}/tycoon/gebote`);
  }

  gebotAbgeben(gebiet: number, betrag: number): Observable<{ id: string; betrag: number }> {
    return this.http.post<{ id: string; betrag: number }>(`${API_BASE_URL}/tycoon/gebote`, { gebiet, betrag });
  }

  gebotAktion(id: string, aktion: 'annehmen' | 'ablehnen' | 'zurueck'): Observable<{ ok: boolean; gebiet: number; betrag: number }> {
    return this.http.post<{ ok: boolean; gebiet: number; betrag: number }>(`${API_BASE_URL}/tycoon/gebote/${id}/${aktion}`, {});
  }

  /** Durchfahrtsgebuehr fuer fremde Gebiete an deren Besitzer (Server begrenzt je Gebiet). */
  durchfahrt(posten: { gebiet: number; betrag: number }[], strecke: string): Observable<{ summe: number }> {
    return this.http.post<{ summe: number }>(`${API_BASE_URL}/tycoon/durchfahrt`, { posten, strecke });
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

  clans(): Observable<TycoonClanListe> {
    return this.http.get<TycoonClanListe>(`${API_BASE_URL}/tycoon/clans`);
  }

  /** passwort leer = jeder darf beitreten. */
  clanGruenden(name: string, kuerzel: string, farbe: string, passwort: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE_URL}/tycoon/clans`, { name, kuerzel, farbe, passwort });
  }

  clanBeitreten(id: string, passwort = ''): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/${id}/beitreten`, { passwort });
  }

  clanPasswort(passwort: string): Observable<{ passwort: boolean }> {
    return this.http.post<{ passwort: boolean }>(`${API_BASE_URL}/tycoon/clans/passwort`, { passwort });
  }

  clanEinladen(userId: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/einladen`, { userId });
  }

  clanEinladungAblehnen(clanId: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/${clanId}/einladung-ablehnen`, {});
  }

  clanAustreten(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/tycoon/clans/austreten`, {});
  }

  ansehen(userId: string): Observable<TycoonAnsicht> {
    return this.http.get<TycoonAnsicht>(`${API_BASE_URL}/tycoon/view/${userId}`);
  }
}
