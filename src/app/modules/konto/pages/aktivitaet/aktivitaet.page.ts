import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/api-config';
import { alleAppTiles } from '../../../../shared/katalog';

interface AppNutzung { app: string; anzahl: number; zuletzt: string }
interface Eintrag {
  schluessel: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  gast: boolean | null;
  erste: string;
  zuletzt: string;
  letzte_seite: string | null;
  tage7: number;
  tage30: number;
  aktionen30: number;
  tage_gesamt: number;
  aktionen_heute: number;
  apps: AppNutzung[] | null;
}

type Filter = 'alle' | 'konten' | 'geraete';

/** Admin: wer war wann und wie oft aktiv, welche Apps (Tim, 2026-11-11). */
@Component({
  selector: 'app-aktivitaet',
  templateUrl: './aktivitaet.page.html',
  styleUrls: ['./aktivitaet.page.scss'],
  standalone: false,
})
export class AktivitaetPage implements OnInit, OnDestroy {
  eintraege: Eintrag[] = [];
  ladefehler = false;
  laedt = false;
  filter: Filter = 'konten';
  suche = '';
  private timer?: ReturnType<typeof setInterval>;
  private readonly appNamen = new Map(alleAppTiles().map(t => [t.link, t.title]));

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.laden();
    // Status „gerade aktiv“ aktuell halten
    this.timer = setInterval(() => this.laden(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  laden(): void {
    this.laedt = true;
    this.http.get<{ eintraege: Eintrag[] }>(`${API_BASE_URL}/aktivitaet`).subscribe({
      next: r => { this.eintraege = r.eintraege; this.ladefehler = false; this.laedt = false; },
      error: () => { this.ladefehler = true; this.laedt = false; },
    });
  }

  get gefiltert(): Eintrag[] {
    const s = this.suche.trim().toLowerCase();
    return this.eintraege.filter(e =>
      (this.filter === 'alle' || (this.filter === 'konten') === !!e.user_id)
      && (!s || this.name(e).toLowerCase().includes(s)));
  }

  get zahlen() {
    const konten = this.eintraege.filter(e => e.user_id);
    return {
      jetzt: this.eintraege.filter(e => this.status(e) === 'jetzt').length,
      heute: konten.filter(e => e.aktionen_heute > 0).length,
      woche: konten.filter(e => e.tage7 > 0).length,
      konten: konten.length,
    };
  }

  name(e: Eintrag): string {
    if (e.full_name) return e.full_name;
    return 'Gerät ohne Konto · ' + e.schluessel.slice(-6);
  }

  /** jetzt = in den letzten 5 Min, heute = seit Mitternacht, woche = 7 Tage, alt = länger her */
  status(e: Eintrag): 'jetzt' | 'heute' | 'woche' | 'alt' {
    const t = new Date(e.zuletzt).getTime();
    const jetzt = Date.now();
    if (jetzt - t < 5 * 60_000) return 'jetzt';
    const mitternacht = new Date(); mitternacht.setHours(0, 0, 0, 0);
    if (t >= mitternacht.getTime()) return 'heute';
    if (jetzt - t < 7 * 86_400_000) return 'woche';
    return 'alt';
  }

  vor(iso: string): string {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (min < 1) return 'gerade eben';
    if (min < 60) return `vor ${min} Min.`;
    const h = Math.round(min / 60);
    if (h < 24) return `vor ${h} Std.`;
    const d = Math.round(h / 24);
    return d === 1 ? 'gestern' : `vor ${d} Tagen`;
  }

  datum(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  appName(pfad: string | null): string {
    if (!pfad) return '–';
    if (pfad === '/dashboard') return 'Startseite';
    return this.appNamen.get(pfad) ?? pfad;
  }

  trackSchluessel(_i: number, e: Eintrag): string {
    return e.schluessel;
  }
}
