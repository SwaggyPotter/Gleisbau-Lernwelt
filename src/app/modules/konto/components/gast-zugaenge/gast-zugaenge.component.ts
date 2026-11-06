import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/api-config';

interface Gast {
  id: string; name: string; seit: string; bis: string | null;
  richtig: number; falsch: number; zuletzt: string | null; meldungen: number; chat: number;
  rausgeworfen?: boolean;
}
interface GastCode {
  code: string; bezeichnung: string; erstellt: string; bis: string;
  maxNutzer: number; genutzt: number; aktiv: boolean; dauerhaft?: boolean; gaeste: Gast[];
}

/**
 * Admin-Bereich auf der Schlüssel-Seite: Gast-Login für ein paar Tage anlegen (Standard 7 Tage,
 * mehrere Personen), Gäste mit Statistik sehen, Zugänge verlängern/beenden.
 * Nur Admins kommen auf die Seite (adminGuard), und das Backend prüft /gast/codes zusätzlich.
 */
@Component({
  selector: 'app-gast-zugaenge',
  templateUrl: './gast-zugaenge.component.html',
  styleUrls: ['./gast-zugaenge.component.scss'],
  standalone: false,
})
export class GastZugaengeComponent implements OnInit {
  /** 0 = dauerhaft (bis der Admin den Zugang beendet) */
  readonly tageAuswahl = [1, 3, 7, 14, 0];

  codes: GastCode[] = [];
  ladefehler: string | null = null;

  bezeichnung = '';
  tage = 7;
  maxNutzer = 30;
  busy = false;
  neuerCode: { code: string; bis: string; dauerhaft?: boolean } | null = null;
  kopiert = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.laden();
  }

  laden(): void {
    this.ladefehler = null;
    this.http.get<{ codes: GastCode[] }>(`${API_BASE_URL}/gast/codes`).subscribe({
      next: r => { this.codes = r.codes; },
      error: () => { this.ladefehler = 'Gastzugänge konnten nicht geladen werden.'; },
    });
  }

  erstellen(): void {
    if (!this.bezeichnung.trim()) return;
    this.busy = true;
    this.neuerCode = null;
    this.kopiert = false;
    this.http.post<{ code: string; bis: string }>(`${API_BASE_URL}/gast/codes`, {
      bezeichnung: this.bezeichnung.trim(), tage: +this.tage || 7, dauerhaft: +this.tage === 0, maxNutzer: +this.maxNutzer,
    }).subscribe({
      next: r => { this.busy = false; this.neuerCode = r; this.bezeichnung = ''; this.laden(); },
      error: () => { this.busy = false; this.ladefehler = 'Gast-Login konnte nicht erstellt werden.'; },
    });
  }

  async kopieren(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.kopiert = true;
    } catch {
      this.kopiert = false;
    }
  }

  verlaengern(c: GastCode, tage = 7): void {
    this.http.patch(`${API_BASE_URL}/gast/codes/${encodeURIComponent(c.code)}`, { tage }).subscribe(() => this.laden());
  }

  /** Eingabe „Max. Personen“ je Gast-Login (Code → neuer Wert) */
  neueMax: Record<string, number> = {};
  maxFehler: Record<string, string> = {};

  maxSpeichern(c: GastCode): void {
    const wert = Math.round(+this.neueMax[c.code]);
    delete this.maxFehler[c.code];
    if (!wert || wert < 1) { this.maxFehler[c.code] = 'Bitte eine Zahl ab 1 eingeben.'; return; }
    if (wert < c.genutzt) { this.maxFehler[c.code] = `Es sind schon ${c.genutzt} angemeldet – kleiner geht nicht.`; return; }
    this.http.patch(`${API_BASE_URL}/gast/codes/${encodeURIComponent(c.code)}`, { maxNutzer: wert }).subscribe({
      next: () => { delete this.neueMax[c.code]; this.laden(); },
      error: (e: { error?: { error?: string } }) => { this.maxFehler[c.code] = e.error?.error ?? 'Speichern fehlgeschlagen.'; },
    });
  }

  dauerhaftMachen(c: GastCode): void {
    this.http.patch(`${API_BASE_URL}/gast/codes/${encodeURIComponent(c.code)}`, { dauerhaft: true }).subscribe(() => this.laden());
  }

  tageText(t: number): string {
    return t === 0 ? 'Dauerhaft' : `${t} ${t === 1 ? 'Tag' : 'Tage'}`;
  }

  beenden(c: GastCode): void {
    if (!confirm(`Gast-Login „${c.bezeichnung}“ sofort beenden? Alle Gäste mit diesem Passwort werden abgemeldet.`)) return;
    this.http.delete(`${API_BASE_URL}/gast/codes/${encodeURIComponent(c.code)}`).subscribe(() => this.laden());
  }

  /** Einzelnen Gast sofort abmelden und sperren; sein Platz wird wieder frei. */
  rauswerfen(c: GastCode, g: Gast): void {
    if (!confirm(`„${g.name}“ rauswerfen? Er wird sofort abgemeldet. Statistik und Chat bleiben erhalten.`)) return;
    this.http.delete(`${API_BASE_URL}/gast/codes/${encodeURIComponent(c.code)}/gaeste/${g.id}`).subscribe({
      next: () => this.laden(),
      error: () => { this.ladefehler = 'Rauswerfen hat nicht geklappt.'; },
    });
  }

  quote(g: Gast): string {
    const n = g.richtig + g.falsch;
    return n ? `${Math.round((g.richtig / n) * 100)} %` : '–';
  }

  datum(iso: string | null): string {
    if (!iso) return '–';
    if (new Date(iso).getUTCFullYear() >= 2099) return 'dauerhaft';
    return new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
