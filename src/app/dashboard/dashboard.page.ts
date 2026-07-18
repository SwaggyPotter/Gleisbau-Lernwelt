import { Component } from '@angular/core';

type QuizTile = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  link: string;
  topicId?: string;
  questionCount?: number;
};

type TileProgress = {
  answered: number;
  total: number;
  ratio: number;
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

  readonly quizTopics: QuizTile[] = [
    {
      id: 'themenquiz-grundlagen',
      title: 'Gleisbau-Grundlagen',
      description: 'Aufbau Eisenbahngleis, Oberbau, Unterbau und Aufgaben des Gleisbauers.',
      tag: 'Grundlagen',
      icon: 'school-outline',
      link: '/themenquiz/grundlagen',
      topicId: 'grundlagen',
      questionCount: 6,
    },
    {
      id: 'themenquiz-spurweite',
      title: 'Spurweite und Gleisgeometrie',
      description: 'EBO Spurweite, Regelspur 1435 mm, Gleisbogen, Ueberhoehung.',
      tag: 'Geometrie',
      icon: 'resize-outline',
      link: '/themenquiz/spurweite',
      topicId: 'spurweite',
      questionCount: 6,
    },
    {
      id: 'themenquiz-schiene',
      title: 'Schienen',
      description: 'Schienenaufbau, Profil, Waermeausdehnung, verschweisstes Gleis.',
      tag: 'Schiene',
      icon: 'remove-outline',
      link: '/themenquiz/schiene',
      topicId: 'schiene',
      questionCount: 5,
    },
    {
      id: 'themenquiz-schwellen',
      title: 'Schwellen',
      description: 'Aufgabe, Arten, Lastverteilung und Spurhaltung.',
      tag: 'Schwellen',
      icon: 'reorder-four-outline',
      link: '/themenquiz/schwellen',
      topicId: 'schwellen',
      questionCount: 5,
    },
    {
      id: 'themenquiz-bettung',
      title: 'Bettung und Schotter',
      description: 'Gleisschotter, Lastverteilung, Entwaesserung, Bettungsquerschnitt.',
      tag: 'Bettung',
      icon: 'layers-outline',
      link: '/themenquiz/bettung',
      topicId: 'bettung',
      questionCount: 10,
    },
    {
      id: 'themenquiz-kleineisen',
      title: 'Schienenbefestigung und Kleineisen',
      description: 'Spannklemme, Zwischenlage, Rippenplatte und weitere Kleineisen.',
      tag: 'Kleineisen',
      icon: 'construct-outline',
      link: '/themenquiz/kleineisen',
      topicId: 'kleineisen',
      questionCount: 7,
    },
    {
      id: 'themenquiz-handwerkzeuge',
      title: 'Handwerkzeuge im Gleisbau',
      description: 'Gleiswinde, Schienenheber, Schottergabel und Sicherheit.',
      tag: 'Werkzeuge',
      icon: 'hammer-outline',
      link: '/themenquiz/handwerkzeuge',
      topicId: 'handwerkzeuge',
      questionCount: 6,
    },
    {
      id: 'themenquiz-kleingeraete',
      title: 'Kleingeraete und Maschinen',
      description: 'Schienenbohrmaschine, Trennschleifmaschine und Sicherheit.',
      tag: 'Geraete',
      icon: 'cog-outline',
      link: '/themenquiz/kleingeraete',
      topicId: 'kleingeraete',
      questionCount: 6,
    },
    {
      id: 'themenquiz-messmittel',
      title: 'Messmittel und Vermessung',
      description: 'Spurweitenmessgeraet, Nivelliergeraet, Pfeilhoehe und Temperatur.',
      tag: 'Messen',
      icon: 'speedometer-outline',
      link: '/themenquiz/messmittel',
      topicId: 'messmittel',
      questionCount: 7,
    },
    {
      id: 'themenquiz-trassenplan',
      title: 'Trassenplan lesen',
      description: 'Kilometrierung, Lageplan, Laengsschnitt und Symbole.',
      tag: 'Planung',
      icon: 'map-outline',
      link: '/themenquiz/trassenplan',
      topicId: 'trassenplan',
      questionCount: 7,
    },
  ];

  readonly extraTiles: QuizTile[] = [
    {
      id: 'zusatz-nivellieren',
      title: 'Zusatzmodul: Nivellieren im Gleisbau',
      description: 'Leitfaden inkl. Quiz und Checklisten aus dem Nivellement-PDF.',
      tag: 'Bonus',
      icon: 'trending-up-outline',
      link: '/zusatz/nivellieren',
    },
    {
      id: 'zusatz-volumen',
      title: 'Zusatzmodul: Volumen berechnen',
      description: '10 Quizaufgaben zu Volumenberechnung im Gleisbau, inkl. Trapezprofilen und Aussparungen.',
      tag: 'Bonus',
      icon: 'cube-outline',
      link: '/zusatz/volumen',
    },
    {
      id: 'zusatz-prozentrechnung',
      title: 'Zusatzmodul: Prozentrechnung',
      description: 'Prozentwert, Rabatt, Erhoehung, Rueckrechnung und Toleranzen mit praxisnahen Aufgaben.',
      tag: 'Bonus',
      icon: 'calculator-outline',
      link: '/zusatz/prozentrechnung',
    },
    {
      id: 'zusatz-gesamtquiz',
      title: 'Zusatzmodul: Gesamtquiz alle Module',
      description: 'Ein grosses Quiz mit allen Fragen aus den Zusatzmodulen.',
      icon: 'trophy-outline',
      tag: 'Bonus',
      link: '/zusatz/gesamtquiz',
    },
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

  get filteredQuizTopics(): QuizTile[] {
    return this.filterTiles(this.quizTopics);
  }

  get filteredExtraTiles(): QuizTile[] {
    return this.filterTiles(this.extraTiles);
  }

  get totalVisibleTiles(): number {
    return this.filteredQuizTopics.length + this.filteredExtraTiles.length;
  }

  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  trackByTileId(_index: number, tile: QuizTile): string {
    return tile.id;
  }

  private filterTiles(tiles: QuizTile[]): QuizTile[] {
    const query = this.normalizeText(this.searchTerm);
    if (!query) return tiles;

    const terms = query.split(/\s+/).filter(Boolean);
    return tiles.filter(tile => {
      const haystack = this.normalizeText([tile.title, tile.description, tile.tag].join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }

  private refreshProgress(): void {
    const progressByLink: Record<string, TileProgress> = {};
    let completed = 0;
    let inProgress = 0;
    let planned = 0;

    for (const tile of this.quizTopics) {
      const total = tile.questionCount ?? 0;
      if (!tile.topicId || total <= 0) continue;

      const answered = this.readAnsweredCount(tile.topicId);
      progressByLink[tile.link] = { answered, total, ratio: answered / total };

      if (answered >= total) completed += 1;
      else if (answered > 0) inProgress += 1;
      else planned += 1;
    }

    planned += this.extraTiles.length;
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
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00df/g, 'ss');
  }
}
