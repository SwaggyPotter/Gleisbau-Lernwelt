import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { BildEntscheidung, BildReview, BilderApiService } from '../../services/bilder-api.service';

interface KatalogBild {
  id: string;
  url: string;
  beschreibung: string;
  kategorieVorschlag: string;
  uploadId?: number;
}

interface Bauteil {
  kategorie: string;
  name: string;
  alias: string[];
}

interface BildEintrag {
  id: string;
  url: string;
  beschreibung: string;
  vorschlag: string;
  decision: BildEntscheidung | null;
  category: string;
  note: string;
  name: string;
  gespeichert: boolean;
  fehler: boolean;
}

interface ListenZeile {
  name: string;
  eigen: boolean;
  bilder: BildEintrag[];
}

interface ListenGruppe {
  kategorie: string;
  zeilen: ListenZeile[];
  vorhanden: number;
}

const norm = (s: string): string => s.trim().toLowerCase();

@Component({
  selector: 'app-bilder-benennen',
  templateUrl: './bilder-benennen.page.html',
  styleUrls: ['./bilder-benennen.page.scss'],
  standalone: false,
})
export class BilderBenennenPage implements OnInit {
  readonly kategorien = [
    'Schienenbefestigung', 'Zwischenlage', 'Schwellen', 'Schienen', 'Schienenverbindung/Stoß',
    'Weiche', 'Bettung/Schotter', 'Unterbau/Entwässerung', 'Werkzeug/Kleingerät', 'Maschinen',
    'Messmittel', 'Sicherung/Signale', 'Schienenfehler', 'Sonstiges',
  ];

  ansicht: 'benennen' | 'liste' = 'benennen';
  nurOhneName = true;
  nurFehlende = false;
  geladen = false;
  ladefehler = false;
  bilder: BildEintrag[] = [];
  bauteile: Bauteil[] = [];
  hochladenLaeuft = false;
  hochladeStand = '';
  hochladeFehler: string[] = [];

  constructor(private readonly http: HttpClient, private readonly api: BilderApiService) {}

  ngOnInit(): void {
    forkJoin({
      katalog: this.http.get<KatalogBild[]>('assets/bilder-katalog.json'),
      bauteile: this.http.get<Bauteil[]>('assets/bauteile-katalog.json'),
      reviews: this.api.alle(),
      fotos: this.api.fotos(),
    }).subscribe({
      next: ({ katalog, bauteile, reviews, fotos }) => {
        this.bauteile = bauteile;
        const map = new Map<string, BildReview>(reviews.reviews.map(r => [r.imageId, r]));
        const uploads: KatalogBild[] = fotos.photos.map(f => ({
          id: `up:${f.id}`, url: f.thumb, beschreibung: f.name, kategorieVorschlag: '', uploadId: f.id,
        }));
        this.bilder = [...uploads, ...katalog]
          .map(b => {
            const r = map.get(b.id);
            return {
              id: b.id,
              url: b.url,
              beschreibung: b.beschreibung,
              vorschlag: b.kategorieVorschlag,
              decision: r?.decision ?? null,
              category: r?.category ?? '',
              note: r?.note ?? '',
              name: r?.name ?? '',
              gespeichert: false,
              fehler: false,
            };
          })
          .filter(b => b.decision !== 'remove');
        this.geladen = true;
      },
      error: () => { this.ladefehler = true; this.geladen = true; },
    });
  }

  /** Fotos vom Handy waehlen (Mehrfachauswahl), im Browser verkleinern, nacheinander hochladen. */
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
        this.bilder.unshift({
          id: `up:${res.photo.id}`, url: res.photo.thumb, beschreibung: res.photo.name, vorschlag: '',
          decision: null, category: '', note: '', name: '', gespeichert: false, fehler: false,
        });
        ok++;
      } catch {
        this.hochladeFehler.push(dateien[i].name || `Datei ${i + 1}`);
      }
    }
    this.hochladenLaeuft = false;
    this.hochladeStand = `${ok} von ${dateien.length} hochgeladen`;
    this.ansicht = 'benennen';
    this.nurOhneName = true;
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

  get sichtbar(): BildEintrag[] {
    return this.nurOhneName ? this.bilder.filter(b => !b.name) : this.bilder;
  }

  get ohneName(): number {
    return this.bilder.filter(b => !b.name).length;
  }

  speichere(b: BildEintrag): void {
    b.fehler = false;
    this.api.speichern(b.id, {
      decision: b.decision,
      category: b.category || null,
      note: b.note || null,
      name: b.name,
    }).subscribe({
      next: () => (b.gespeichert = true),
      error: () => (b.fehler = true),
    });
  }

  /** Beim Waehlen eines bekannten Bauteils die Kategorie automatisch uebernehmen. */
  nameGeaendert(b: BildEintrag): void {
    const treffer = this.finde(b.name);
    if (treffer && !b.category) b.category = treffer.kategorie;
    this.speichere(b);
  }

  private finde(name: string): Bauteil | undefined {
    const n = norm(name);
    return n ? this.bauteile.find(t => norm(t.name) === n || t.alias.some(a => norm(a) === n)) : undefined;
  }

  get liste(): ListenGruppe[] {
    const bekannt = new Set<string>();
    const gruppen: ListenGruppe[] = this.kategorien.map(k => ({ kategorie: k, zeilen: [], vorhanden: 0 }));
    const nachName = (b: BildEintrag) => this.finde(b.name)?.name;

    for (const t of this.bauteile) {
      bekannt.add(t.name);
      const g = gruppen.find(x => x.kategorie === t.kategorie);
      if (!g) continue;
      const bilder = this.bilder.filter(b => nachName(b) === t.name);
      g.zeilen.push({ name: t.name, eigen: false, bilder });
      if (bilder.length) g.vorhanden++;
    }
    // Vom Nutzer frei vergebene Namen, die nicht in der Master-Liste stehen.
    const eigene = new Map<string, BildEintrag[]>();
    for (const b of this.bilder) {
      if (b.name && !nachName(b)) eigene.set(b.name, [...(eigene.get(b.name) ?? []), b]);
    }
    for (const [name, bilder] of eigene) {
      const g = gruppen.find(x => x.kategorie === bilder[0].category) ?? gruppen[gruppen.length - 1];
      g.zeilen.push({ name, eigen: true, bilder });
      g.vorhanden++;
    }
    return gruppen
      .map(g => ({ ...g, zeilen: this.nurFehlende ? g.zeilen.filter(z => !z.bilder.length) : g.zeilen }))
      .filter(g => g.zeilen.length > 0);
  }

  get gesamt(): { vorhanden: number; gesamt: number } {
    const g = this.liste;
    void g;
    const alle = this.bauteile.length;
    const vorhanden = this.bauteile.filter(t =>
      this.bilder.some(b => this.finde(b.name)?.name === t.name)).length;
    return { vorhanden, gesamt: alle };
  }
}
