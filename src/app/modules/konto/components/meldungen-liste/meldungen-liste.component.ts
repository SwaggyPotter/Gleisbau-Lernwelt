import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/api-config';

interface Meldung {
  id: number; questionId: string; topic: string; question: string; reason: string;
  comment: string | null; am: string; erledigt: boolean; von: string; gast: boolean;
  erledigtAm?: string | null; notiz?: string | null;
}

/** Admin: alle Meldungen zu Fragen (von Konten und Gästen), auf der Fragen-Seite. */
@Component({
  selector: 'app-meldungen-liste',
  templateUrl: './meldungen-liste.component.html',
  styleUrls: ['./meldungen-liste.component.scss'],
  standalone: false,
})
export class MeldungenListeComponent implements OnInit {
  meldungen: Meldung[] = [];
  ladefehler = false;
  zeigeErledigte = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ meldungen: Meldung[] }>(`${API_BASE_URL}/meldungen`).subscribe({
      next: r => { this.meldungen = r.meldungen; },
      error: () => { this.ladefehler = true; },
    });
  }

  erledigt(m: Meldung): void {
    const neu = !m.erledigt;
    this.http.patch(`${API_BASE_URL}/meldungen/${m.id}`, { erledigt: neu }).subscribe(() => { m.erledigt = neu; });
  }

  get sichtbareMeldungen(): Meldung[] {
    return this.zeigeErledigte ? this.meldungen : this.meldungen.filter(m => !m.erledigt);
  }

  get offeneMeldungen(): number {
    return this.meldungen.filter(m => !m.erledigt).length;
  }

  datum(iso: string | null): string {
    if (!iso) return '–';
    return new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
