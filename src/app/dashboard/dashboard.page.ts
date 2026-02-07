import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../services/auth.service';

type GleisbauModule = {
  id: string;
  title: string;
  description: string;
  tag: string;
  link: string;
  year: 1 | 2 | 3;
  lf: string;
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
      year: 1,
      lf: 'Zusatz',
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
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.summary = { completed: 0, inProgress: 0, planned: this.gleisbauModules.length };
    });
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

  gleisbauGroups(): Array<{ year: 1 | 2 | 3; modules: GleisbauModule[] }> {
    const grouped: Record<number, GleisbauModule[]> = {};
    this.gleisbauModules.forEach(m => {
      if (!grouped[m.year]) grouped[m.year] = [];
      grouped[m.year].push(m);
    });
    return Object.keys(grouped)
      .map(y => ({ year: Number(y) as 1 | 2 | 3, modules: grouped[Number(y)] }))
      .sort((a, b) => a.year - b.year);
  }
}
