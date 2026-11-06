import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../core/api-config';

export interface QuestionReport {
  questionId: string;
  topic: string;
  question: string;
  reason: string;
  comment?: string;
  reportedAt: string;
}

/** Noch nicht beim Server angekommene Meldung (Postausgang). */
interface AusstehendeMeldung extends QuestionReport {
  clientId: string;
}

const ALT_KEY = 'question-reports';               // bis 2026-11-06: Meldungen nur im Browser
const AUSGANG_KEY = 'glw-meldungen-ausstehend';    // Postausgang
const MIGRIERT_KEY = 'glw-meldungen-migriert';

function neueId(): string {
  try { return crypto.randomUUID(); } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2, 12); }
}

function lesen(): AusstehendeMeldung[] {
  try { return JSON.parse(localStorage.getItem(AUSGANG_KEY) || '[]') as AusstehendeMeldung[]; } catch { return []; }
}

function schreiben(liste: AusstehendeMeldung[]): void {
  try { localStorage.setItem(AUSGANG_KEY, JSON.stringify(liste.slice(-200))); } catch { /* voll/gesperrt */ }
}

/**
 * Meldung in den Postausgang legen (auch für Seiten außerhalb von Angular-DI, z. B. die
 * Schotterberechnung). Der Postausgang wird beim nächsten App-Start bzw. sobald wieder
 * Netz da ist an den Server geschickt.
 */
export function meldungZwischenspeichern(m: Omit<QuestionReport, 'reportedAt'> & { reportedAt?: string; clientId?: string }): string {
  const clientId = m.clientId ?? neueId();
  const liste = lesen().filter(x => x.clientId !== clientId);
  liste.push({ ...m, reportedAt: m.reportedAt ?? new Date().toISOString(), clientId });
  schreiben(liste);
  return clientId;
}

/**
 * Alle Meldungen (Themenquiz, Gesamtquiz/Rechentrainer, Schotterberechnung) landen an EINEM Ort:
 * Tabelle question_reports auf dem Server (POST /api/meldungen). Tim sieht sie auf der Admin-Seite
 * „Fragen“, Claude liest sie per SSH aus. Klappt das Senden nicht (offline, Server weg), bleibt die
 * Meldung im Postausgang und wird später nachgeschickt; die clientId verhindert Doppelte.
 */
@Injectable({ providedIn: 'root' })
export class QuestionReportService {
  private sendetGerade = false;

  constructor(private readonly http: HttpClient) {
    this.altesUebernehmen();
    try { window.addEventListener('online', () => this.ausstehendeSenden()); } catch { /* SSR */ }
  }

  submitReport(report: Omit<QuestionReport, 'reportedAt'>): void {
    meldungZwischenspeichern(report);
    this.ausstehendeSenden();
  }

  /** Postausgang abarbeiten; erfolgreich gesendete Meldungen werden entfernt. */
  ausstehendeSenden(): void {
    if (this.sendetGerade) return;
    const liste = lesen();
    if (!liste.length) return;
    this.sendetGerade = true;
    let offen = liste.length;
    const fertig = () => { if (--offen === 0) this.sendetGerade = false; };
    for (const m of liste) {
      this.http.post(`${API_BASE_URL}/meldungen`, {
        questionId: m.questionId, topic: m.topic, question: m.question, reason: m.reason,
        comment: m.comment || undefined, clientId: m.clientId, gemeldetAm: m.reportedAt,
      }).subscribe({
        next: () => { schreiben(lesen().filter(x => x.clientId !== m.clientId)); fertig(); },
        // 400 = Server lehnt die Meldung dauerhaft ab -> nicht ewig wiederholen
        error: (e: { status?: number }) => { if (e?.status === 400) schreiben(lesen().filter(x => x.clientId !== m.clientId)); fertig(); },
      });
    }
  }

  /** Einmalig: Meldungen aus der Zeit vor dem Server (nur im Browser gespeichert) nachschicken. */
  private altesUebernehmen(): void {
    try {
      if (localStorage.getItem(MIGRIERT_KEY)) return;
      const alt = JSON.parse(localStorage.getItem(ALT_KEY) || '[]') as QuestionReport[];
      for (const m of alt) meldungZwischenspeichern(m);
      localStorage.setItem(MIGRIERT_KEY, '1');
      localStorage.removeItem(ALT_KEY);
    } catch { /* egal */ }
  }

  /** Noch nicht gesendete Meldungen dieses Browsers. */
  getReports(): QuestionReport[] {
    return lesen();
  }
}
