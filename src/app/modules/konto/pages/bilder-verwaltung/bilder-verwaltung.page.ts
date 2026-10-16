import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { BildEntscheidung, BildReview, BilderApiService, HochgeladenesFoto } from '../../services/bilder-api.service';

interface KatalogBild {
  id: string;
  quelle: 'foto' | 'app' | 'upload';
  url: string;
  beschreibung: string;
  kategorieVorschlag: string;
  hinweis?: string;
  credit: string;
  lizenz?: string;
  sourceUrl?: string;
  uploadId?: number;
}

interface BildZeile extends KatalogBild {
  decision: BildEntscheidung | null;
  category: string;
  note: string;
  gespeichert: boolean;
  fehler: boolean;
}

type Filter = 'alle' | 'offen' | 'keep' | 'remove' | 'unsure';

@Component({
  selector: 'app-bilder-verwaltung',
  templateUrl: './bilder-verwaltung.page.html',
  styleUrls: ['./bilder-verwaltung.page.scss'],
  standalone: false,
})
export class BilderVerwaltungPage implements OnInit {
  readonly kategorien = [
    'Schienenbefestigung', 'Zwischenlage', 'Schwellen', 'Schienen', 'Schienenverbindung/Stoß',
    'Weiche', 'Bettung/Schotter', 'Unterbau/Entwässerung', 'Werkzeug/Kleingerät', 'Maschinen',
    'Messmittel', 'Sicherung/Signale', 'Schienenfehler', 'Sonstiges',
  ];

  zeilen: BildZeile[] = [];
  geladen = false;
  ladefehler = false;
  filter: Filter = 'offen';
  quelle: 'alle' | 'foto' | 'upload' | 'app' = 'alle';
  hochladenLaeuft = false;
  hochladeStand = '';
  hochladeFehler: string[] = [];
  loeschBestaetigung: string | null = null;
  kategorieFilter = '';

  constructor(private readonly http: HttpClient, private readonly api: BilderApiService) {}

  ngOnInit(): void {
    forkJoin({
      katalog: this.http.get<KatalogBild[]>('assets/bilder-katalog.json'),
      reviews: this.api.alle(),
      fotos: this.api.fotos(),
    }).subscribe({
      next: ({ katalog, reviews, fotos }) => {
        const map = new Map<string, BildReview>(reviews.reviews.map(r => [r.imageId, r]));
        const uploads: KatalogBild[] = fotos.photos.map(f => this.uploadZuKatalog(f));
        this.zeilen = [...uploads, ...katalog].map(b => {
          const r = map.get(b.id);
          return {
            ...b,
            decision: r?.decision ?? null,
            category: r?.category ?? '',
            note: r?.note ?? '',
            gespeichert: !!r,
            fehler: false,
          };
        });
        this.geladen = true;
      },
      error: () => { this.ladefehler = true; this.geladen = true; },
    });
  }

  private uploadZuKatalog(f: HochgeladenesFoto): KatalogBild {
    return {
      id: `up:${f.id}`,
      quelle: 'upload',
      uploadId: f.id,
      url: f.thumb,
      beschreibung: f.name,
      kategorieVorschlag: '',
      credit: `Hochgeladen ${new Date(f.createdAt).toLocaleString('de-DE')}`,
    };
  }

  /** Fotos vom Geraet waehlen (iPhone: Mediathek, Mehrfachauswahl), verkleinern, nacheinander hochladen. */
  async dateienGewaehlt(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const dateien = Array.from(input.files ?? []);
    input.value = '';
    if (!dateien.length) return;
    this.hochladenLaeuft = true;
    this.hochladeFehler = [];
    let ok = 0;
    for (let i = 0; i < dateien.length; i++) {
      this.hochladeStand = `${i + 1} von ${dateien.length}`;
      try {
        const full = await this.verkleinern(dateien[i], 1400, 0.82);
        const thumb = await this.verkleinern(dateien[i], 360, 0.7);
        const res = await firstValueFrom(this.api.fotoHochladen(dateien[i].name || 'foto.jpg', full, thumb));
        this.zeilen.unshift({
          ...this.uploadZuKatalog(res.photo),
          decision: null, category: '', note: '', gespeichert: false, fehler: false,
        });
        ok++;
      } catch {
        this.hochladeFehler.push(dateien[i].name || `Datei ${i + 1}`);
      }
    }
    this.hochladenLaeuft = false;
    this.hochladeStand = `${ok} von ${dateien.length} hochgeladen`;
    this.quelle = 'upload';
    this.filter = 'alle';
  }

  private async verkleinern(datei: File, maxKante: number, qualitaet: number): Promise<string> {
    const bmp = await createImageBitmap(datei);
    const faktor = Math.min(1, maxKante / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * faktor);
    canvas.height = Math.round(bmp.height * faktor);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return canvas.toDataURL('image/jpeg', qualitaet);
  }

  async vollansicht(z: BildZeile, ev: Event): Promise<void> {
    if (z.uploadId === undefined) return;
    ev.preventDefault();
    const fenster = window.open('', '_blank');
    try {
      const blob = await firstValueFrom(this.api.fotoVoll(z.uploadId));
      if (fenster) fenster.location.href = URL.createObjectURL(blob);
    } catch {
      fenster?.close();
    }
  }

  loeschen(z: BildZeile): void {
    if (z.uploadId === undefined) return;
    if (this.loeschBestaetigung !== z.id) { this.loeschBestaetigung = z.id; return; }
    this.api.fotoLoeschen(z.uploadId).subscribe({
      next: () => {
        this.zeilen = this.zeilen.filter(x => x.id !== z.id);
        this.loeschBestaetigung = null;
      },
      error: () => (z.fehler = true),
    });
  }

  get sichtbar(): BildZeile[] {
    return this.zeilen.filter(z =>
      (this.quelle === 'alle' || z.quelle === this.quelle) &&
      (!this.kategorieFilter || z.category === this.kategorieFilter) &&
      (this.filter === 'alle' ||
        (this.filter === 'offen' ? z.decision === null : z.decision === this.filter)),
    );
  }

  zaehle(d: BildEntscheidung | null): number {
    return this.zeilen.filter(z => z.decision === d).length;
  }

  waehle(z: BildZeile, d: BildEntscheidung): void {
    z.decision = z.decision === d ? null : d;
    // Beim ersten Beurteilen den Kategorie-Vorschlag aus dem Inventar uebernehmen.
    if (z.decision && !z.category && z.kategorieVorschlag) {
      const treffer = this.kategorien.find(k => z.kategorieVorschlag.toLowerCase().includes(k.split('/')[0].toLowerCase()));
      if (treffer) z.category = treffer;
    }
    this.speichere(z);
  }

  speichere(z: BildZeile): void {
    z.fehler = false;
    this.api.speichern(z.id, {
      decision: z.decision,
      category: z.category || null,
      note: z.note || null,
    }).subscribe({
      next: () => (z.gespeichert = true),
      error: () => (z.fehler = true),
    });
  }
}
