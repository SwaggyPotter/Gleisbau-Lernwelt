import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';

export interface ShowFrage {
  id: string;
  text: string;
  bild?: string | null;
  antworten: string[];
  richtig: number;
  final: boolean;
  notiz?: string;
}

export interface ShowQuiz { id: number; titel: string; fragen: ShowFrage[]; geaendert?: string }
export interface ShowQuizKurz { id: number; titel: string; anzahl: number; geaendert: string }

export type ShowPhase = 'warten' | 'runde' | 'frage' | 'ende';

export interface BuehnenStand {
  code: string;
  rev: number;
  phase: ShowPhase;
  runde: 'haupt' | 'final';
  index: number;
  schritt: number;
  ton: boolean;
  titel: string;
  anzahl: number;
  finalAnzahl: number;
  frage: { text: string; bild: string | null; antworten: (string | null)[]; richtig: number | null } | null;
  gruppen: ShowGruppe[];
  punkteSichtbar: boolean;
  hintergrund: boolean;
  timer: { id: number; restMs: number } | null;
  siegerNr: number;
}

export interface ShowGruppe { name: string; punkte: number }

export interface SteuerStand extends BuehnenStand { quizId: number | null; liste: ShowFrage[] }

export type ShowAktion = 'weiter' | 'zurueck' | 'springen' | 'runde' | 'quiz' | 'ton' | 'neustart' | 'gruppen' | 'punkt' | 'punkteAnzeige' | 'punkteNull' | 'hintergrund' | 'timer' | 'sieger';
export interface ShowAktionExtra { index?: number; runde?: 'haupt' | 'final'; quizId?: number; namen?: string[]; gruppe?: number; delta?: number; sekunden?: number }

const BASIS = `${API_BASE_URL}/quizshow`;

@Injectable({ providedIn: 'root' })
export class QuizshowApiService {
  constructor(private readonly http: HttpClient) {}

  bildUrl(id: string): string {
    return `${BASIS}/bilder/${id}`;
  }

  // Bühne
  neueSitzung(): Observable<BuehnenStand> { return this.http.post<BuehnenStand>(`${BASIS}/sitzung`, {}); }
  stand(code: string, rev?: number): Observable<BuehnenStand | { rev: number; gleich: true }> {
    return this.http.get<BuehnenStand | { rev: number; gleich: true }>(`${BASIS}/sitzung/${code}`, { params: rev ? { rev } : {} });
  }

  // Fernbedienung
  steuerung(code: string): Observable<SteuerStand> { return this.http.get<SteuerStand>(`${BASIS}/sitzung/${code}/steuerung`); }
  aktion(code: string, aktion: ShowAktion, extra: ShowAktionExtra = {}): Observable<SteuerStand> {
    return this.http.post<SteuerStand>(`${BASIS}/sitzung/${code}/aktion`, { aktion, ...extra });
  }

  // Editor
  quizze(): Observable<{ quizze: ShowQuizKurz[] }> { return this.http.get<{ quizze: ShowQuizKurz[] }>(`${BASIS}/quizze`); }
  quiz(id: number): Observable<{ quiz: ShowQuiz }> { return this.http.get<{ quiz: ShowQuiz }>(`${BASIS}/quizze/${id}`); }
  quizNeu(titel: string): Observable<{ id: number }> { return this.http.post<{ id: number }>(`${BASIS}/quizze`, { titel }); }
  quizSpeichern(q: ShowQuiz): Observable<unknown> { return this.http.put(`${BASIS}/quizze/${q.id}`, { titel: q.titel, fragen: q.fragen }); }
  quizLoeschen(id: number): Observable<unknown> { return this.http.delete(`${BASIS}/quizze/${id}`); }
  bildHochladen(dataUrl: string): Observable<{ id: string }> { return this.http.post<{ id: string }>(`${BASIS}/bilder`, { data: dataUrl }); }
}

/** Foto vom Tablet verkleinern (max. 1600 px) und als JPEG-Data-URL liefern. */
export function bildVerkleinern(datei: File, max = 1600): Promise<string> {
  return new Promise((ok, fehler) => {
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * f);
      c.height = Math.round(img.naturalHeight * f);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fehler(new Error('Bild konnte nicht gelesen werden')); };
    img.src = url;
  });
}
