import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../services/auth.service';
import { GamificationService } from '../services/gamification.service';

type GleisbauModule = {
  id: string;
  title: string;
  description: string;
  tag: string;
  link: string;
  year?: 1 | 2 | 3;
  lf: string;
};

type ModuleProgress = {
  completed: number;
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
  user: UserProfile | null = null;
  summary = { completed: 0, inProgress: 0, planned: 0 };
  searchTerm = '';
  moduleProgressByLink: Record<string, ModuleProgress> = {};
  private readonly blockTotalsByField: Record<number, number> = {
    1: 8,
    2: 10,
    3: 9,
    4: 9,
    5: 9,
    6: 10,
    7: 9,
    8: 9,
    9: 9,
    10: 10,
    11: 9,
    12: 9,
    13: 9,
    14: 9,
  };
  gleisbauModules: GleisbauModule[] = [
    {
      id: 'lf01-custom',
      title: 'Lernfeld 1: Baustellen einrichten (Gleisbau)',
      description: 'Interaktives Modul mit Blocks, Quiz, Szenarien und Puzzle.',
      tag: 'Gleisbau',
      link: '/lernfelder/1',
      year: 1,
      lf: 'LF 1',
    },
    {
      id: 'lf02-bau',
      title: 'Lernfeld 2: Bauwerke erschliessen & gruenden',
      description: 'Baugrund, Baugruben, Wasserhaltung, Fundamente, Vermessung, Leitungen.',
      tag: 'Tiefbau',
      link: '/lernfelder/2',
      year: 1,
      lf: 'LF 2',
    },
    {
      id: 'lf03-mauerwerk',
      title: 'Lernfeld 3: Mauern eines einschaligen Baukoerpers',
      description: 'Einschalige Waende, Baustoffe, Verbaende, Oeffnungen, Abdichtung und Arbeitssicherheit.',
      tag: 'Mauerwerk',
      link: '/lernfelder/3',
      year: 1,
      lf: 'LF 3',
    },
    {
      id: 'lf04-stahlbeton',
      title: 'Lernfeld 4: Herstellen eines Stahlbetonbauteiles',
      description: 'Planlesen, Beton-Grundlagen, Schalung, Bewehrung, Betonage, Nachbehandlung und QS.',
      tag: 'Stahlbeton',
      link: '/lernfelder/4',
      year: 1,
      lf: 'LF 4',
    },
    {
      id: 'lf05-holzbau',
      title: 'Lernfeld 5: Herstellen einer Holzkonstruktion',
      description: 'Holzeigenschaften, Holzschutz, Abbund, Verbindungen, Montage, Maschinensicherheit und QS.',
      tag: 'Holzbau',
      link: '/lernfelder/5',
      year: 1,
      lf: 'LF 5',
    },
    {
      id: 'lf06-beschichten',
      title: 'Lernfeld 6: Bauteile beschichten und bekleiden',
      description: 'Untergrundpruefung, Putz/Anstrich, Fliesen, Nassbereich, Fugen, Maengelbilder und Gefahrstoffe.',
      tag: 'Ausbau',
      link: '/lernfelder/6',
      year: 1,
      lf: 'LF 6',
    },
    {
      id: 'zusatz-nivellieren',
      title: 'Zusatzmodul: Nivellieren im Gleisbau',
      description: 'Leitfaden inkl. Quiz und Checklisten aus dem Nivellement-PDF.',
      tag: 'Bonus',
      link: '/zusatz/nivellieren',
      lf: 'Zusatz',
    },
    {
      id: 'zusatz-volumen',
      title: 'Zusatzmodul: Volumen berechnen',
      description: '10 Quizaufgaben zu Volumenberechnung im Gleisbau, inkl. Trapezprofilen und Aussparungen.',
      tag: 'Bonus',
      link: '/zusatz/volumen',
      lf: 'Zusatz',
    },
    {
      id: 'zusatz-prozentrechnung',
      title: 'Zusatzmodul: Prozentrechnung',
      description: 'Prozentwert, Rabatt, Erhoehung, Rueckrechnung und Toleranzen mit praxisnahen Aufgaben.',
      tag: 'Bonus',
      link: '/zusatz/prozentrechnung',
      lf: 'Zusatz',
    },
    {
      id: 'zusatz-gesamtquiz',
      title: 'Zusatzmodul: Gesamtquiz alle Module',
      description: 'Ein grosses Quiz mit allen Fragen aus Lernfeld 1-14 und den Zusatzmodulen.',
      tag: 'Bonus',
      link: '/zusatz/gesamtquiz',
      lf: 'Quiz',
    },
    {
      id: 'lf07-baugruben',
      title: 'Lernfeld 7: Baugruben und Graeben herstellen und sichern',
      description: 'Boeschung oder Verbau auswaehlen, Wasserhaltung beurteilen und Sicherheit konsequent umsetzen.',
      tag: 'Tiefbau',
      link: '/lernfelder/7',
      year: 2,
      lf: 'LF 7',
    },
    {
      id: 'lf08-verkehrsflaechen',
      title: 'Lernfeld 8: Verkehrsflaechen herstellen',
      description: 'Planum, Trag- und Deckschichten ausfuehren, Pflaster und Asphalt unterscheiden, Qualitaet sichern.',
      tag: 'Tiefbau',
      link: '/lernfelder/8',
      year: 2,
      lf: 'LF 8',
    },
    {
      id: 'lf09-entwaesserungssysteme',
      title: 'Lernfeld 9: Entwaesserungssysteme herstellen',
      description: 'Rohrleitungen verlegen, Gefaelle kontrollieren, Schaechte anschliessen und Dichtheit sicherstellen.',
      tag: 'Tiefbau',
      link: '/lernfelder/9',
      year: 2,
      lf: 'LF 9',
    },
    {
      id: 'lf10-instandsetzen',
      title: 'Lernfeld 10: Bauwerke instand setzen und erneuern',
      description: 'Schaeden beurteilen, sanieren, Rueckbau sichern und Bestand funktionsfaehig erneuern.',
      tag: 'Tiefbau',
      link: '/lernfelder/10',
      year: 2,
      lf: 'LF 10',
    },
    {
      id: 'lf11-gleisanlage',
      title: 'Lernfeld 11: Gleisanlage herstellen und sichern',
      description: 'Oberbau verstehen, Gleise einbauen, stopfen, vermessen und sicher im Gleisbereich arbeiten.',
      tag: 'Gleisbau',
      link: '/lernfelder/11',
      year: 3,
      lf: 'LF 11',
    },
    {
      id: 'lf12-instandhaltung',
      title: 'Lernfeld 12: Gleisanlagen instand halten',
      description: 'Gleisfehler erkennen, messen, nachstopfen, nachrichten und sicher unter Betrieb arbeiten.',
      tag: 'Gleisbau',
      link: '/lernfelder/12',
      year: 3,
      lf: 'LF 12',
    },
    {
      id: 'lf13-weichenbau',
      title: 'Lernfeld 13: Weichen bauen und instand halten',
      description: 'Weichenaufbau verstehen, Weichen einbauen, Stelltechnik pruefen und typische Fehler sicher beheben.',
      tag: 'Gleisbau',
      link: '/lernfelder/13',
      year: 3,
      lf: 'LF 13',
    },
    {
      id: 'lf14-sonderbauformen',
      title: 'Lernfeld 14: Sonderbauformen und besondere Gleisanlagen',
      description: 'Bahnuebergaenge, feste Fahrbahn und komplexe Gleisbereiche sicher herstellen und instand halten.',
      tag: 'Gleisbau',
      link: '/lernfelder/14',
      year: 3,
      lf: 'LF 14',
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly gamification: GamificationService,
  ) {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.summary = { completed: 0, inProgress: 0, planned: this.gleisbauModules.length };
      this.refreshModuleProgress();
    });
  }

  ionViewWillEnter(): void {
    this.refreshModuleProgress();
  }

  get displayName(): string {
    return this.gamification.getDisplayName(this.user);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSearchInput(event: Event): void {
    const custom = event as CustomEvent<{ value?: string }>;
    this.searchTerm = custom.detail?.value ?? '';
  }

  get filteredModules(): GleisbauModule[] {
    const query = this.normalizeText(this.searchTerm);
    if (!query) return this.gleisbauModules;

    const terms = query.split(/\s+/).filter(Boolean);
    return this.gleisbauModules.filter(module => {
      const haystack = this.normalizeText([
        module.title,
        module.description,
        module.tag,
        module.lf,
      ].join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }

  get yearGroups(): Array<{ year: 1 | 2 | 3; modules: GleisbauModule[] }> {
    const years: Array<1 | 2 | 3> = [1, 2, 3];
    return years
      .map(year => ({
        year,
        modules: this.filteredModules.filter(module => module.year === year),
      }))
      .filter(group => group.modules.length > 0);
  }

  get extraModules(): GleisbauModule[] {
    return this.filteredModules.filter(module => module.year === undefined);
  }

  get totalVisibleModules(): number {
    return this.filteredModules.length;
  }

  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  private refreshModuleProgress(): void {
    const progressByLink: Record<string, ModuleProgress> = {};

    for (const module of this.gleisbauModules) {
      const fieldNumber = this.parseFieldNumber(module.link);
      if (fieldNumber === null) {
        continue;
      }

      const total = this.blockTotalsByField[fieldNumber] ?? 0;
      if (total <= 0) {
        continue;
      }

      const storageKey = `lf${String(fieldNumber).padStart(2, '0')}-progress`;
      const completed = Math.min(this.readCompletedBlocks(storageKey), total);
      progressByLink[module.link] = {
        completed,
        total,
        ratio: total > 0 ? completed / total : 0,
      };
    }

    this.moduleProgressByLink = progressByLink;
  }

  private parseFieldNumber(link: string): number | null {
    const match = /^\/lernfelder\/(\d+)$/.exec(link);
    if (!match) {
      return null;
    }
    return Number(match[1]);
  }

  private readCompletedBlocks(storageKey: string): number {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return 0;
    }

    try {
      const parsed = JSON.parse(raw) as { completedBlocks?: unknown };
      const completedBlocks = parsed.completedBlocks;
      return Array.isArray(completedBlocks) ? completedBlocks.length : 0;
    } catch {
      return 0;
    }
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss');
  }
}
