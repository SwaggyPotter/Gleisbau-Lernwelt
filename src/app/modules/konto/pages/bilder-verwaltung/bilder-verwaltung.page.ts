import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { BildEntscheidung, BildReview, BilderApiService, HochgeladenesFoto } from '../../services/bilder-api.service';
import { catchError, of } from 'rxjs';
import { ThemenquizDataService } from '../../../themenquiz/services/themenquiz-data.service';
import { ThemenquizFile } from '../../../themenquiz/models/themenquiz.models';
import { QuizAenderungenService, aenderungAnwenden, bildSchluessel } from '../../../../core/quiz-aenderungen/quiz-aenderungen.service';

/** Wo ein Bild in den Quizfragen steckt (für „Verwendet in …“). */
interface Verwendung {
  topicId: string;
  thema: string;
  questionId: string;
  frage: string;
}

interface Bildnachweis { key: string; file: string; credit: string; license: string; sourceUrl: string }

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
type VerwendungFilter = 'alle' | 'quiz' | 'frei';

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
  filter: Filter = 'alle';
  verwendungFilter: VerwendungFilter = 'alle';
  suche = '';
  /** normalisierter Bildschlüssel → Fragen, in denen das Bild steckt */
  private verwendung = new Map<string, Verwendung[]>();
  verwendungGeladen = false;
  aufgeklappt: Record<string, boolean> = {};
  quelle: 'alle' | 'foto' | 'upload' | 'app' = 'alle';
  hochladenLaeuft = false;
  hochladeStand = '';
  hochladeFehler: string[] = [];
  loeschBestaetigung: string | null = null;
  kategorieFilter = '';

  constructor(
    private readonly http: HttpClient,
    private readonly api: BilderApiService,
    private readonly themenquiz: ThemenquizDataService,
    private readonly ae: QuizAenderungenService,
  ) {}

  /** Schlüssel eines Galerie-Eintrags, wie er in den Fragen (imageKey) steht. */
  private schluessel(b: KatalogBild): string {
    if (b.quelle === 'upload') return b.id;            // up:7
    if (b.quelle === 'foto') return 'foto:' + b.id;    // foto:F001
    return bildSchluessel(b.id);                       // app:X -> X
  }

  verwendungen(z: KatalogBild): Verwendung[] {
    return this.verwendung.get(this.schluessel(z)) ?? [];
  }

  /** Themen, in denen das Bild vorkommt, mit Anzahl – für die Kurzzeile. */
  themenKurz(z: KatalogBild): string {
    const zaehler = new Map<string, number>();
    for (const v of this.verwendungen(z)) zaehler.set(v.thema, (zaehler.get(v.thema) ?? 0) + 1);
    return [...zaehler].map(([t, n]) => `${t} (${n})`).join(', ');
  }

  /** Alle Themenquiz-Fragen durchgehen (inkl. Admin-Änderungen) und merken, welches Bild wo steckt. */
  private verwendungLaden(): void {
    this.themenquiz.getTopics().subscribe({
      next: topics => {
        forkJoin({
          quizzes: forkJoin(topics.map(t => this.themenquiz.getOriginalQuiz(t.topicId).pipe(catchError(() => of(null as ThemenquizFile | null))))),
          ae: this.ae.aenderungen$.pipe(take(1)),
        }).subscribe(({ quizzes, ae }) => {
          const m = new Map<string, Verwendung[]>();
          for (const quiz of quizzes) {
            if (!quiz) continue;
            for (const orig of quiz.questions) {
              const q = aenderungAnwenden(orig, ae[quiz.topicId]?.[orig.id]);
              if (!q.imageKey) continue;
              const k = bildSchluessel(q.imageKey);
              if (!m.has(k)) m.set(k, []);
              m.get(k)!.push({ topicId: quiz.topicId, thema: quiz.title, questionId: q.id, frage: q.question });
            }
          }
          this.verwendung = m;
          this.verwendungGeladen = true;
        });
      },
    });
  }

  ngOnInit(): void {
    forkJoin({
      katalog: this.http.get<KatalogBild[]>('assets/bilder-katalog.json'),
      nachweise: this.http.get<Bildnachweis[]>('assets/bilder/bildnachweise.json').pipe(catchError(() => of([] as Bildnachweis[]))),
      reviews: this.api.alle(),
      fotos: this.api.fotos(),
    }).subscribe({
      next: ({ katalog, nachweise, reviews, fotos }) => {
        const map = new Map<string, BildReview>(reviews.reviews.map(r => [r.imageId, r]));
        const uploads: KatalogBild[] = fotos.photos.map(f => this.uploadZuKatalog(f));
        // Quiz-Bilder, die (noch) nicht im Bilder-Katalog stehen, trotzdem zeigen
        const vorhanden = new Set(katalog.map(k => k.id));
        for (const b of nachweise) {
          if (vorhanden.has('app:' + b.key)) continue;
          katalog.push({ id: 'app:' + b.key, quelle: 'app', url: b.file, beschreibung: b.key, kategorieVorschlag: '', credit: b.credit, lizenz: b.license, sourceUrl: b.sourceUrl });
        }
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
        this.verwendungLaden();
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
    const q = this.suche.trim().toLowerCase();
    return this.zeilen.filter(z =>
      (this.quelle === 'alle' || z.quelle === this.quelle) &&
      (this.verwendungFilter === 'alle' || (this.verwendungFilter === 'quiz') === this.verwendungen(z).length > 0) &&
      (!q || (z.id + ' ' + z.beschreibung + ' ' + z.note + ' ' + z.category + ' ' + this.themenKurz(z)).toLowerCase().includes(q)) &&
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
      next: () => {
        z.gespeichert = true;
        // „Entfernen“ wirkt sofort in den Quizfragen (auch ohne Neuladen in diesem Browser)
        this.ae.bildEntferntSetzen(this.schluessel(z), z.decision === 'remove');
      },
      error: () => (z.fehler = true),
    });
  }
}
