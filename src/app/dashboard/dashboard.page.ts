import { Component } from '@angular/core';
import {
  QuizTile,
  WISSENSTEST_TILES,
  GLEISBAU_LERNFELD_TILES,
  BAUBERUFE_TILES,
  RECHENTRAINER_TILES,
  SPIELE_TILES,
} from '../shared/katalog';

type TileProgress = {
  answered: number;
  total: number;
  ratio: number;
};

/** Eine Kachel auf der Startseite, die in einen Quiz-Bereich fuehrt. */
type Bereich = {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  count: number;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {
  summary = { completed: 0, inProgress: 0, planned: 0 };
  searchTerm = '';
  tileProgressByLink: Record<string, TileProgress> = {};

  /**
   * Die Startseite listet bewusst KEINE einzelnen Themen mehr auf (Tim,
   * 2026-08-17) — nur noch die Bereiche. Die Themenlisten selbst stecken in
   * den Kategorie-Seiten unter /kategorie/:id.
   */
  readonly bereiche: Bereich[] = [
    {
      id: 'bereich-wissenstests',
      title: 'Wissenstests',
      description: 'Die zehn Gleisbau-Themen, von den Grundlagen bis zum Trassenplan.',
      icon: 'school-outline',
      link: '/kategorie/wissenstests',
      count: WISSENSTEST_TILES.length,
    },
    {
      id: 'bereich-lernfelder',
      title: 'Lernfelder',
      description: 'Quiz nach Lernfeldern — Gleisbau (LF10-14) und allgemeine Bauberufe (LF01-09).',
      icon: 'library-outline',
      link: '/kategorie/lernfelder',
      count: GLEISBAU_LERNFELD_TILES.length + BAUBERUFE_TILES.length,
    },
    {
      id: 'bereich-rechentrainer',
      title: 'Rechentrainer',
      description: 'Nivellieren, Volumen, Prozentrechnung, Gesamtquiz und Materialrechner.',
      icon: 'calculator-outline',
      link: '/kategorie/rechentrainer',
      count: RECHENTRAINER_TILES.length,
    },
    {
      id: 'bereich-spiele',
      title: 'Spiele',
      description: 'Lernspiele statt Frage-Antwort — dieselben Themen, andere Form.',
      icon: 'game-controller-outline',
      link: '/kategorie/spiele',
      count: SPIELE_TILES.length,
    },
  ];

  /** Alle quizzbaren Kacheln — Grundlage fuer die bereichsuebergreifende Suche. */
  private readonly alleQuizKacheln: QuizTile[] = [
    ...WISSENSTEST_TILES,
    ...GLEISBAU_LERNFELD_TILES,
    ...BAUBERUFE_TILES,
    ...RECHENTRAINER_TILES,
    ...SPIELE_TILES,
  ];

  constructor() {
    this.refreshProgress();
  }

  ionViewWillEnter(): void {
    this.refreshProgress();
  }

  onSearchInput(event: Event): void {
    const custom = event as CustomEvent<{ value?: string }>;
    this.searchTerm = custom.detail?.value ?? '';
  }

  /** Suchtreffer ueber ALLE Bereiche hinweg, nicht mehr pro Sektion. */
  get suchtreffer(): QuizTile[] {
    const query = this.normalizeText(this.searchTerm);
    if (!query) return [];

    const terms = query.split(/\s+/).filter(Boolean);
    return this.alleQuizKacheln.filter(tile => {
      const haystack = this.normalizeText([tile.title, tile.description, tile.tag].join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }

  get totalVisibleTiles(): number {
    return this.suchtreffer.length;
  }

  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  tileImageStyle(tile: QuizTile): string {
    if (!tile.image) return '';
    // CSS url() interpretiert unquotierte Klammern im Pfad als Ende der
    // Funktion (z. B. "...Schoenberg_(1).jpg") — deshalb den Pfad in der
    // url()-Angabe in Anfuehrungszeichen setzen.
    return `url('${tile.image}')`;
  }

  trackByTileId(_index: number, tile: QuizTile): string {
    return tile.id;
  }

  trackByBereichId(_index: number, bereich: Bereich): string {
    return bereich.id;
  }

  private refreshProgress(): void {
    const progressByLink: Record<string, TileProgress> = {};
    let completed = 0;
    let inProgress = 0;
    let planned = 0;

    for (const tile of [...WISSENSTEST_TILES, ...GLEISBAU_LERNFELD_TILES, ...BAUBERUFE_TILES]) {
      const total = tile.questionCount ?? 0;
      if (!tile.topicId || total <= 0) continue;

      const answered = this.readAnsweredCount(tile.topicId);
      progressByLink[tile.link] = { answered, total, ratio: answered / total };

      if (answered >= total) completed += 1;
      else if (answered > 0) inProgress += 1;
      else planned += 1;
    }

    planned += RECHENTRAINER_TILES.length;
    this.summary = { completed, inProgress, planned };
    this.tileProgressByLink = progressByLink;
  }

  private readAnsweredCount(topicId: string): number {
    const raw = localStorage.getItem(`themenquiz-progress-${topicId}`);
    if (!raw) return 0;

    try {
      const parsed = JSON.parse(raw) as { quizStats?: Record<string, unknown> };
      return Object.keys(parsed.quizStats ?? {}).length;
    } catch {
      return 0;
    }
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss');
  }
}
