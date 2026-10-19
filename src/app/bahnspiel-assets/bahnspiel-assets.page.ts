import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface BahnspielAsset {
  id: string;
  kategorie: string;
  name: string;
  beschreibung: string;
  format: string;
  lizenz: string;
  repo: 'ok' | 'auflage' | 'offen' | '-';
  polygone: string;
  url: string;
  bild?: string;
  bildCredit?: string;
}

type Entscheidung = 'behalten' | 'vielleicht' | 'raus' | '';

interface Urteil {
  entscheidung: Entscheidung;
  eigenerName: string;
  notiz: string;
}

const STORAGE_KEY = 'bahnspiel-assets-urteile-v1';

@Component({
  selector: 'app-bahnspiel-assets',
  templateUrl: './bahnspiel-assets.page.html',
  styleUrls: ['./bahnspiel-assets.page.scss'],
  standalone: false,
})
export class BahnspielAssetsPage implements OnInit {
  assets: BahnspielAsset[] = [];
  urteile: Record<string, Urteil> = {};
  kategorien: string[] = [];
  filter = 'Alle';
  nurOffen = false;
  exportText = '';
  hinweis = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    try {
      this.urteile = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      this.urteile = {};
    }
    this.http.get<BahnspielAsset[]>('assets/bahnspiel-assets/assets.json').subscribe({
      next: (data) => {
        this.assets = data;
        this.kategorien = ['Alle', ...Array.from(new Set(data.map((a) => a.kategorie)))];
      },
      error: () => (this.assets = []),
    });
  }

  get sichtbar(): BahnspielAsset[] {
    return this.assets.filter(
      (a) =>
        (this.filter === 'Alle' || a.kategorie === this.filter) &&
        (!this.nurOffen || !this.urteil(a.id).entscheidung),
    );
  }

  get zaehler(): { behalten: number; vielleicht: number; raus: number; offen: number } {
    const z = { behalten: 0, vielleicht: 0, raus: 0, offen: 0 };
    for (const a of this.assets) {
      const e = this.urteil(a.id).entscheidung;
      if (e) z[e]++;
      else z.offen++;
    }
    return z;
  }

  urteil(id: string): Urteil {
    return this.urteile[id] || { entscheidung: '', eigenerName: '', notiz: '' };
  }

  setze(id: string, entscheidung: Entscheidung): void {
    const u = this.urteil(id);
    this.urteile[id] = { ...u, entscheidung: u.entscheidung === entscheidung ? '' : entscheidung };
    this.speichern();
  }

  setzeFeld(id: string, feld: 'eigenerName' | 'notiz', wert: string): void {
    this.urteile[id] = { ...this.urteil(id), [feld]: wert };
    this.speichern();
  }

  repoText(r: string): string {
    return r === 'ok'
      ? 'Repo-tauglich'
      : r === 'auflage'
        ? 'Nur mit Namensnennung/Share-Alike'
        : r === 'offen'
          ? 'Lizenz offen'
          : '';
  }

  erzeugeExport(): void {
    const out = this.assets
      .filter((a) => this.urteil(a.id).entscheidung || this.urteil(a.id).eigenerName || this.urteil(a.id).notiz)
      .map((a) => ({ id: a.id, original: a.name, ...this.urteil(a.id) }));
    this.exportText = JSON.stringify(out, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.exportText).then(
        () => (this.hinweis = 'In die Zwischenablage kopiert.'),
        () => (this.hinweis = 'Bitte den Text unten manuell kopieren.'),
      );
    } else {
      this.hinweis = 'Bitte den Text unten manuell kopieren.';
    }
  }

  zuruecksetzen(): void {
    if (!confirm('Alle Entscheidungen auf dieser Seite loeschen?')) return;
    this.urteile = {};
    this.speichern();
    this.exportText = '';
  }

  private speichern(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.urteile));
    } catch {
      /* Speicher blockiert - Seite funktioniert weiter, nur ohne Merken */
    }
  }
}
