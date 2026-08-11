import { Injectable } from '@angular/core';

export interface QuestionReport {
  questionId: string;
  topic: string;
  question: string;
  reason: string;
  comment?: string;
  reportedAt: string;
}

const STORAGE_KEY = 'question-reports';

/**
 * Sammelt Meldungen zu fehlerhaften Fragen. Speichert aktuell nur lokal
 * (localStorage), da die App noch keinen angebundenen Server hat (siehe
 * deploy/README.md). submitReport() ist bewusst die einzige Schreibstelle,
 * damit spaeter ein echter HTTP-Aufruf ans Backend eingesetzt werden kann,
 * ohne die aufrufenden Komponenten anzufassen.
 */
@Injectable({ providedIn: 'root' })
export class QuestionReportService {
  submitReport(report: Omit<QuestionReport, 'reportedAt'>): void {
    const entry: QuestionReport = { ...report, reportedAt: new Date().toISOString() };
    const all = this.getReports();
    all.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  getReports(): QuestionReport[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QuestionReport[];
    } catch {
      return [];
    }
  }

  /** Fuer Tim: Meldungen als JSON zum Kopieren/Weitergeben ausgeben. */
  exportReportsAsJson(): string {
    return JSON.stringify(this.getReports(), null, 2);
  }

  clearReports(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
