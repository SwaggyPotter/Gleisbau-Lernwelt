import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, UserProfile } from '../services/auth.service';

interface LearningTile {
  title: string;
  description: string;
  progress: number; // value between 0 and 1
  status: 'Abgeschlossen' | 'In Arbeit' | 'Geplant';
  tag: string;
  color: 'success' | 'warning' | 'medium' | 'primary' | 'tertiary';
  eta?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {
  user$: Observable<UserProfile | null> = this.authService.user$;

  tiles: LearningTile[] = [
    {
      title: 'Gleisbau Grundlagen',
      description: 'Streckenteile, Spurweite, Lagerung. Pflichteinweisung fuer alle.',
      progress: 1,
      status: 'Abgeschlossen',
      tag: 'Pflichtmodul',
      color: 'success',
      eta: 'Abgeschlossen',
    },
    {
      title: 'Sicherheit & PSA',
      description: 'Sicherheitsbriefing, PSA-Checkliste und Notfallablaeufe.',
      progress: 0.78,
      status: 'In Arbeit',
      tag: 'Sicherheit',
      color: 'warning',
      eta: 'Noch 1 Check',
    },
    {
      title: 'Weichen & Kreuzungen',
      description: 'Weichenmontage, Justage, Sichtpruefung unter Last.',
      progress: 0.35,
      status: 'In Arbeit',
      tag: 'Vertiefung',
      color: 'primary',
      eta: 'Noch 3 Schritte',
    },
    {
      title: 'Schotter & Unterbau',
      description: 'Bettung, Stopfqualitaet, Verdichtung nach Vorgabe.',
      progress: 0.12,
      status: 'Geplant',
      tag: 'Praxis',
      color: 'medium',
      eta: 'Start offen',
    },
    {
      title: 'Qualitaetsnachweise',
      description: 'Fotodoku, Messpunkte und digitale Uebergabe.',
      progress: 0.5,
      status: 'In Arbeit',
      tag: 'Dokumentation',
      color: 'tertiary',
      eta: '50% erledigt',
    },
    {
      title: 'Maschinenkunde',
      description: 'Stopfmaschine, Schweissanlage, Sicherheitszonen.',
      progress: 0,
      status: 'Geplant',
      tag: 'Maschinen',
      color: 'medium',
      eta: 'Noch nicht begonnen',
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
