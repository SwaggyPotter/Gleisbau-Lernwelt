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
      id: 'zusatz-nivellieren',
      title: 'Zusatzmodul: Nivellieren im Gleisbau',
      description: 'Leitfaden inkl. Quiz und Checklisten aus dem Nivellement-PDF.',
      tag: 'Bonus',
      link: '/zusatz/nivellieren',
      year: 1,
      lf: 'Zusatz',
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
