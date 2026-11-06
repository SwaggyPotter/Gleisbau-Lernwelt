import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, filter, map, shareReplay, tap, timeout } from 'rxjs/operators';
import { API_BASE_URL } from '../api-config';

/** Vom Admin geänderte Fassung einer Quizfrage (vollständig, ersetzt das Original). */
export interface FragenAenderung {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  source?: string;
  sourceUrl?: string;
  /** null = Schwierigkeit entfernt */
  difficulty?: 'einfach' | 'mittel' | 'schwer' | 'profi' | null;
  /** null = Bild entfernt */
  imageKey?: string | null;
  geaendertAm?: string;
}

/** topicId → questionId → Änderung */
export type AenderungenMap = Record<string, Record<string, FragenAenderung>>;

/**
 * Lädt die vom Admin bearbeiteten Quizfragen (Backend /quiz-aenderungen) und legt sie über die
 * Original-JSONs. Klappt das Laden nicht (offline, Server weg), gelten einfach die Originale.
 */
@Injectable({ providedIn: 'root' })
export class QuizAenderungenService {
  private readonly stand = new BehaviorSubject<AenderungenMap | null>(null);
  private geladen = false;
  /** In der Bilder-Verwaltung auf „Entfernen“ gesetzte Bilder (normalisierte imageKeys). */
  private entfernt = new Set<string>();

  constructor(private readonly http: HttpClient) {}

  /** Aktueller Stand; meldet sich neu, sobald der Admin etwas speichert. */
  get aenderungen$(): Observable<AenderungenMap> {
    if (!this.geladen) this.neuLaden();
    return this.stand.pipe(filter((s): s is AenderungenMap => s !== null));
  }

  neuLaden(): void {
    this.geladen = true;
    this.http.get<{ aenderungen: AenderungenMap; entfernteBilder?: string[] }>(`${API_BASE_URL}/quiz-aenderungen`).pipe(
      timeout(6000),
      tap(r => { this.entfernt = new Set((r.entfernteBilder ?? []).map(bildSchluessel)); }),
      map(r => r.aenderungen ?? {}),
      catchError(() => of(this.stand.value ?? {})),
    ).subscribe(a => this.stand.next(a));
  }

  /** Ist dieses Bild in der Bilder-Verwaltung auf „Entfernen“ gesetzt? */
  istEntfernt(key: string | null | undefined): boolean {
    return !!key && this.entfernt.has(bildSchluessel(key));
  }

  /** Nach „Entfernen“/„Behalten“ in der Bilder-Verwaltung sofort übernehmen (ohne Neuladen). */
  bildEntferntSetzen(key: string, entfernt: boolean): void {
    const k = bildSchluessel(key);
    if (entfernt) this.entfernt.add(k); else this.entfernt.delete(k);
    if (this.stand.value) this.stand.next({ ...this.stand.value });
  }

  /** Frage fertig machen: Admin-Änderung drüberlegen, entfernte Bilder weglassen
   *  (außer der Admin hat das Bild in genau dieser Frage ausdrücklich gewählt). */
  aufbereiten<T extends { id: string; imageKey?: string }>(orig: T, ae: FragenAenderung | undefined): T {
    const q = aenderungAnwenden(orig, ae);
    if (q.imageKey && !ae?.imageKey && this.istEntfernt(q.imageKey)) {
      const kopie = { ...q };
      delete kopie.imageKey;
      return kopie;
    }
    return q;
  }

  speichern(topicId: string, questionId: string, daten: FragenAenderung): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/quiz-aenderungen/${topicId}/${encodeURIComponent(questionId)}`, daten).pipe(
      tap(() => {
        const s = { ...(this.stand.value ?? {}) };
        s[topicId] = { ...(s[topicId] ?? {}), [questionId]: { ...daten, geaendertAm: new Date().toISOString() } };
        this.stand.next(s);
      }),
    );
  }

  zuruecksetzen(topicId: string, questionId: string): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/quiz-aenderungen/${topicId}/${encodeURIComponent(questionId)}`).pipe(
      tap(() => {
        const s = { ...(this.stand.value ?? {}) };
        if (s[topicId]) {
          const t = { ...s[topicId] };
          delete t[questionId];
          s[topicId] = t;
        }
        this.stand.next(s);
      }),
    );
  }
}

/** Gleicher Schlüssel für Bilder-Verwaltung und Fragen: „app:X“ = „X“. */
export function bildSchluessel(key: string): string {
  return key.startsWith('app:') ? key.slice(4) : key;
}

/** Legt eine Änderung über die Originalfrage. null/'' bei Bild, Quelle, Schwierigkeit = entfernen. */
export function aenderungAnwenden<T extends { id: string }>(orig: T, ae: FragenAenderung | undefined): T {
  if (!ae) return orig;
  const { geaendertAm: _g, ...rest } = ae;
  const neu: Record<string, unknown> = { ...orig, ...rest, id: orig.id };
  for (const k of ['imageKey', 'difficulty', 'source', 'sourceUrl']) {
    if (neu[k] === null || neu[k] === '') delete neu[k];
  }
  return neu as unknown as T;
}

// ---------------------------------------------------------------------------
// Bilder: ein imageKey kann auf verschiedene Quellen zeigen
// ---------------------------------------------------------------------------

export interface QuizBild {
  key: string;
  file: string;
  credit: string;
  license?: string;
  sourceUrl?: string;
}

interface Bildnachweis { key: string; file: string; credit: string; license: string; sourceUrl: string }
interface KatalogEintrag { id: string; quelle: string; url: string; beschreibung: string; credit: string; lizenz?: string; sourceUrl?: string }

/**
 * Löst imageKeys auf:
 *  - „<key>“ oder „app:<key>“ → assets/bilder/bildnachweise.json (Wikimedia usw.)
 *  - „foto:F001“ → Tims Fotos aus assets/bilder-katalog.json
 *  - „up:12“ → in der Bilder-Verwaltung hochgeladenes Foto (öffentlich nur, wenn in einer Frage benutzt)
 */
@Injectable({ providedIn: 'root' })
export class QuizBilderService {
  readonly quellen$: Observable<{ nachweise: Bildnachweis[]; katalog: KatalogEintrag[] }>;
  private nachweise = new Map<string, Bildnachweis>();
  private katalog = new Map<string, KatalogEintrag>();

  constructor(private readonly http: HttpClient) {
    const nachweise$ = this.http.get<Bildnachweis[]>('assets/bilder/bildnachweise.json').pipe(catchError(() => of([] as Bildnachweis[])));
    const katalog$ = this.http.get<KatalogEintrag[]>('assets/bilder-katalog.json').pipe(catchError(() => of([] as KatalogEintrag[])));
    this.quellen$ = forkJoin({ nachweise: nachweise$, katalog: katalog$ }).pipe(
      tap(({ nachweise, katalog }) => {
        this.nachweise = new Map(nachweise.map(b => [b.key, b]));
        this.katalog = new Map(katalog.map(b => [b.id, b]));
      }),
      shareReplay(1),
    );
    this.quellen$.subscribe();
  }

  aufloesen(key: string | null | undefined): QuizBild | null {
    if (!key) return null;
    if (key.startsWith('up:')) {
      const id = key.slice(3);
      return { key, file: `${API_BASE_URL}/quiz-aenderungen/bild/${id}`, credit: 'Eigenes Foto (Tim)' };
    }
    if (key.startsWith('foto:')) {
      const k = this.katalog.get(key.slice(5));
      return k ? { key, file: k.url, credit: k.credit || 'Eigenes Foto (Tim)', license: k.lizenz, sourceUrl: k.sourceUrl } : null;
    }
    const b = this.nachweise.get(key.startsWith('app:') ? key.slice(4) : key);
    return b ? { key, file: b.file, credit: b.credit, license: b.license, sourceUrl: b.sourceUrl } : null;
  }
}
