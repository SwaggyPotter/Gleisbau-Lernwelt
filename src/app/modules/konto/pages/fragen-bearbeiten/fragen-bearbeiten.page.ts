import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThemenquizDataService } from '../../../themenquiz/services/themenquiz-data.service';
import { ThemenquizDifficulty, ThemenquizQuestion, ThemenquizTopic } from '../../../themenquiz/models/themenquiz.models';
import {
  AenderungenMap, FragenAenderung, QuizAenderungenService, QuizBild, QuizBilderService, aenderungAnwenden,
} from '../../../../core/quiz-aenderungen/quiz-aenderungen.service';
import { BildReview, BilderApiService, HochgeladenesFoto } from '../../services/bilder-api.service';

interface Entwurf {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  source: string;
  sourceUrl: string;
  difficulty: ThemenquizDifficulty | '';
  imageKey: string;
}

interface GalerieBild {
  key: string;
  thumb: string;
  name: string;
  kategorie: string;
  quelle: 'quiz' | 'foto' | 'upload';
  info: string;
  entfernt: boolean;
}

/**
 * Admin: Themenquiz-Fragen bearbeiten (Tim, 2026-11-06). Frage, Antworten, richtige Antwort,
 * Erklärung, Quelle, Schwierigkeit und Bild ändern; Bild aus der Galerie (Quiz-Bilder, Tims Fotos,
 * hochgeladene Fotos aus der Bilder-Verwaltung). Gespeichert wird im Backend (quiz_aenderungen),
 * die Original-JSONs bleiben unverändert – „Original wiederherstellen“ macht alles rückgängig.
 */
@Component({
  selector: 'app-fragen-bearbeiten',
  templateUrl: './fragen-bearbeiten.page.html',
  styleUrls: ['./fragen-bearbeiten.page.scss'],
  standalone: false,
})
export class FragenBearbeitenPage implements OnInit, OnDestroy {
  readonly schwierigkeiten: { wert: ThemenquizDifficulty | ''; text: string }[] = [
    { wert: '', text: 'ohne' }, { wert: 'einfach', text: 'Einfach' }, { wert: 'mittel', text: 'Mittel' },
    { wert: 'schwer', text: 'Schwer' }, { wert: 'profi', text: 'Profi' },
  ];

  themen: ThemenquizTopic[] = [];
  topicId = '';
  titel = '';
  original: ThemenquizQuestion[] = [];
  aenderungen: Record<string, FragenAenderung> = {};
  fragen: ThemenquizQuestion[] = [];
  geladen = false;
  ladefehler = '';
  suche = '';

  offen: string | null = null;
  entwurf: Entwurf | null = null;
  busy = false;
  meldung = '';
  fehler = '';

  galerieOffen = false;
  galerie: GalerieBild[] = [];
  galerieGeladen = false;
  galerieSuche = '';
  galerieQuelle: 'alle' | 'quiz' | 'foto' | 'upload' = 'alle';
  galerieKategorie = '';
  galerieEntfernteZeigen = true;

  private sub = new Subscription();
  private zielFrage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly data: ThemenquizDataService,
    private readonly ae: QuizAenderungenService,
    private readonly bilder: QuizBilderService,
    private readonly bilderApi: BilderApiService,
  ) {}

  ngOnInit(): void {
    this.data.getTopics().subscribe(t => (this.themen = t));
    this.ae.neuLaden();
    this.sub.add(this.route.paramMap.subscribe(p => {
      this.zielFrage = this.route.snapshot.queryParamMap.get('frage');
      this.ladeThema(p.get('topicId') ?? '');
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private themaSub?: Subscription;

  private ladeThema(topicId: string): void {
    this.topicId = topicId;
    this.geladen = false;
    this.ladefehler = '';
    this.offen = null;
    this.entwurf = null;
    this.themaSub?.unsubscribe();
    this.themaSub = combineLatest([this.data.getOriginalQuiz(topicId), this.ae.aenderungen$, this.bilder.quellen$]).subscribe({
      next: ([quiz, alle]: [{ title: string; questions: ThemenquizQuestion[] }, AenderungenMap, unknown]) => {
        this.titel = quiz.title;
        this.original = quiz.questions;
        this.aenderungen = alle[topicId] ?? {};
        this.fragen = this.original.map(q => aenderungAnwenden(q, this.aenderungen[q.id]));
        this.geladen = true;
        if (this.zielFrage) {
          const id = this.zielFrage;
          this.zielFrage = null;
          const q = this.fragen.find(f => f.id === id);
          if (q) {
            this.oeffnen(q);
            setTimeout(() => document.getElementById('frage-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
          }
        }
      },
      error: () => { this.ladefehler = 'Dieses Thema konnte nicht geladen werden.'; this.geladen = true; },
    });
    this.sub.add(this.themaSub);
  }

  themaWechseln(id: string): void {
    this.router.navigate(['/konto/fragen-bearbeiten', id], { replaceUrl: true });
  }

  get sichtbareFragen(): ThemenquizQuestion[] {
    const q = this.suche.trim().toLowerCase();
    if (!q) return this.fragen;
    return this.fragen.filter(f => (f.question + ' ' + f.choices.join(' ') + ' ' + f.id).toLowerCase().includes(q));
  }

  get anzahlGeaendert(): number {
    return Object.keys(this.aenderungen).filter(id => this.original.some(o => o.id === id)).length;
  }

  /** Bild ist in der Bilder-Verwaltung auf „Entfernen“ gesetzt und wird im Quiz nicht gezeigt. */
  bildAusgeblendet(q: ThemenquizQuestion): boolean {
    return !!q.imageKey && !this.aenderungen[q.id]?.imageKey && this.ae.istEntfernt(q.imageKey);
  }

  entwurfBildEntfernt(): boolean {
    return !!this.entwurf?.imageKey && this.ae.istEntfernt(this.entwurf.imageKey);
  }

  geaendert(q: ThemenquizQuestion): boolean {
    return !!this.aenderungen[q.id];
  }

  bild(key: string | null | undefined): QuizBild | null {
    return this.bilder.aufloesen(key);
  }

  /** Vorschau im Editor: Galerie-Vorschaubild (auch für noch nicht gespeicherte Uploads), sonst die echte Bild-URL. */
  vorschau(key: string): string | null {
    if (!key) return null;
    const g = this.galerie.find(x => x.key === key);
    return g?.thumb ?? this.bilder.aufloesen(key)?.file ?? null;
  }

  oeffnen(q: ThemenquizQuestion): void {
    if (this.offen === q.id) { this.schliessen(); return; }
    this.offen = q.id;
    this.meldung = '';
    this.fehler = '';
    this.entwurf = {
      question: q.question,
      choices: [...q.choices],
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? '',
      source: q.source ?? '',
      sourceUrl: q.sourceUrl ?? '',
      difficulty: q.difficulty ?? '',
      imageKey: q.imageKey ?? '',
    };
  }

  schliessen(): void {
    this.offen = null;
    this.entwurf = null;
    this.galerieOffen = false;
  }

  trackIndex(i: number): number {
    return i;
  }

  antwortDazu(): void {
    if (this.entwurf && this.entwurf.choices.length < 6) this.entwurf.choices.push('');
  }

  antwortWeg(i: number): void {
    const e = this.entwurf;
    if (!e || e.choices.length <= 2) return;
    e.choices.splice(i, 1);
    if (e.correctIndex === i) e.correctIndex = 0;
    else if (e.correctIndex > i) e.correctIndex--;
  }

  private alsAenderung(e: Entwurf): FragenAenderung {
    return {
      question: e.question.trim(),
      choices: e.choices.map(c => c.trim()),
      correctIndex: e.correctIndex,
      explanation: e.explanation.trim(),
      source: e.source.trim(),
      sourceUrl: e.sourceUrl.trim(),
      difficulty: e.difficulty || null,
      imageKey: e.imageKey || null,
    };
  }

  /** Gleich dem Original? Dann wird statt Speichern die Änderung gelöscht. */
  private gleichOriginal(id: string, a: FragenAenderung): boolean {
    const o = this.original.find(q => q.id === id);
    if (!o) return false;
    return a.question === o.question.trim()
      && JSON.stringify(a.choices) === JSON.stringify(o.choices.map(c => c.trim()))
      && a.correctIndex === o.correctIndex
      && a.explanation === (o.explanation ?? '').trim()
      && a.source === (o.source ?? '').trim()
      && a.sourceUrl === (o.sourceUrl ?? '').trim()
      && (a.difficulty ?? null) === (o.difficulty ?? null)
      && (a.imageKey ?? null) === (o.imageKey ?? null);
  }

  speichern(): void {
    const e = this.entwurf;
    const id = this.offen;
    if (!e || !id) return;
    this.fehler = '';
    this.meldung = '';
    const a = this.alsAenderung(e);
    if (a.question.length < 3) { this.fehler = 'Die Frage ist zu kurz.'; return; }
    if (a.choices.some(c => !c)) { this.fehler = 'Bitte jede Antwort ausfüllen oder leere Antworten entfernen.'; return; }
    if (a.sourceUrl && !/^https?:\/\/\S+\.\S+/.test(a.sourceUrl)) { this.fehler = 'Der Quellen-Link muss mit http:// oder https:// beginnen.'; return; }
    this.busy = true;
    const anfrage = this.gleichOriginal(id, a)
      ? (this.aenderungen[id] ? this.ae.zuruecksetzen(this.topicId, id) : of(null))
      : this.ae.speichern(this.topicId, id, a);
    anfrage.subscribe({
      next: () => { this.busy = false; this.meldung = 'Gespeichert ✓ – gilt ab sofort für alle.'; },
      error: (err: { error?: { error?: string } }) => {
        this.busy = false;
        this.fehler = err?.error?.error ?? 'Speichern hat nicht geklappt.';
      },
    });
  }

  originalWiederherstellen(): void {
    const id = this.offen;
    if (!id || !this.aenderungen[id]) return;
    if (!confirm('Alle Änderungen an dieser Frage verwerfen und das Original wiederherstellen?')) return;
    this.busy = true;
    this.ae.zuruecksetzen(this.topicId, id).subscribe({
      next: () => {
        this.busy = false;
        const o = this.original.find(q => q.id === id);
        if (o) { this.offen = null; this.oeffnen(o); }
        this.meldung = 'Original wiederhergestellt ✓';
      },
      error: () => { this.busy = false; this.fehler = 'Zurücksetzen hat nicht geklappt.'; },
    });
  }

  zumQuiz(): void {
    this.router.navigate(['/themenquiz', this.topicId]);
  }

  // ------------------------------------------------------------------ Galerie

  galerieOeffnen(): void {
    this.galerieOffen = true;
    if (this.galerieGeladen) return;
    forkJoin({
      quellen: this.bilder.quellen$,
      reviews: this.bilderApi.alle().pipe(catchError(() => of({ reviews: [] as BildReview[] }))),
      fotos: this.bilderApi.fotos().pipe(catchError(() => of({ photos: [] as HochgeladenesFoto[] }))),
    }).subscribe(({ quellen, reviews, fotos }) => {
      const r = new Map(reviews.reviews.map(x => [x.imageId, x]));
      const liste: GalerieBild[] = [];
      for (const f of fotos.photos) {
        const rv = r.get(`up:${f.id}`);
        liste.push({ key: `up:${f.id}`, thumb: f.thumb, name: rv?.name || f.name, kategorie: rv?.category ?? '', quelle: 'upload', info: 'Hochgeladenes Foto', entfernt: rv?.decision === 'remove' });
      }
      for (const k of quellen.katalog.filter(x => x.quelle === 'foto')) {
        const rv = r.get(k.id);
        liste.push({ key: `foto:${k.id}`, thumb: k.url, name: rv?.name || k.beschreibung, kategorie: rv?.category || '', quelle: 'foto', info: `Tims Foto ${k.id}`, entfernt: rv?.decision === 'remove' });
      }
      for (const b of quellen.nachweise) {
        const rv = r.get(`app:${b.key}`);
        liste.push({ key: b.key, thumb: b.file, name: rv?.name || b.key, kategorie: rv?.category ?? '', quelle: 'quiz', info: b.credit, entfernt: rv?.decision === 'remove' });
      }
      this.galerie = liste;
      this.galerieGeladen = true;
    });
  }

  get galerieKategorien(): string[] {
    return [...new Set(this.galerie.map(g => g.kategorie).filter(Boolean))].sort();
  }

  get galerieSichtbar(): GalerieBild[] {
    const q = this.galerieSuche.trim().toLowerCase();
    return this.galerie.filter(g =>
      (this.galerieEntfernteZeigen || !g.entfernt)
      && (this.galerieQuelle === 'alle' || g.quelle === this.galerieQuelle)
      && (!this.galerieKategorie || g.kategorie === this.galerieKategorie)
      && (!q || (g.name + ' ' + g.kategorie + ' ' + g.info + ' ' + g.key).toLowerCase().includes(q)));
  }

  /** Wie oft ein Bild schon in diesem Thema benutzt wird (hilft, Doppelte zu erkennen). */
  verwendung(key: string): number {
    return this.fragen.filter(f => f.imageKey === key).length;
  }

  bildWaehlen(key: string): void {
    if (this.entwurf) this.entwurf.imageKey = key;
    this.galerieOffen = false;
  }

  trackBild(_i: number, g: GalerieBild): string {
    return g.key;
  }
}
