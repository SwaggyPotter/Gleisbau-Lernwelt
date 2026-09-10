import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ProfilApiService } from '../../services/profil-api.service';
import { Einstellungen, Errungenschaft, ModulStat, StatsUebersicht } from '../../models/profil.models';
import { modulLabel } from '../../module-labels';
import { ThemeService } from '../../../../core/theme/theme.service';

type Ansicht = 'uebersicht' | 'statistiken' | 'einstellungen' | 'errungenschaften';

const ACCENT = '#ff8a3d';
const SUCCESS = '#6fbf73';
const DANGER = '#e0806f';
const MUTED = '#8ca3af';
const GRID = 'rgba(111, 168, 220, 0.15)';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  standalone: false,
})
export class ProfilPage implements OnInit {
  readonly user$ = this.auth.currentUser$;
  ansicht: Ansicht = 'uebersicht';
  ladefehler = false;
  geladen = false;

  stats: StatsUebersicht | null = null;
  alleErrungenschaften: Errungenschaft[] = [];
  freigeschaltetKeys = new Set<string>();
  einstellungen: Einstellungen = { bevorzugtesLehrjahr: null, errungenschaftenHinweise: true, skin: 'standard' };
  einstellungenGespeichert = false;
  neuerName = '';
  nameGespeichert = false;

  neueEmail = '';
  neuesPasswort = '';
  neuesPasswortWiederholen = '';
  kontoFehler: string | null = null;
  kontoGespeichert = false;

  balkenChart: ChartConfiguration<'bar'> | null = null;
  ringChart: ChartConfiguration<'doughnut'> | null = null;
  streakChart: ChartConfiguration<'bar'> | null = null;

  readonly modulLabel = modulLabel;

  constructor(
    private readonly auth: AuthService,
    private readonly api: ProfilApiService,
    private readonly router: Router,
    private readonly theme: ThemeService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      stats: this.api.meineStatistiken(),
      alle: this.api.alleErrungenschaften(),
      meine: this.api.meineErrungenschaften(),
      einst: this.api.meineEinstellungen(),
    }).subscribe({
      next: ({ stats, alle, meine, einst }) => {
        this.stats = stats;
        this.alleErrungenschaften = alle.achievements;
        this.freigeschaltetKeys = new Set(meine.freigeschaltet.map(f => f.key));
        this.einstellungen = einst.settings;
        this.theme.waehle(einst.settings.skin);
        this.baueCharts(stats.module);
        this.geladen = true;
      },
      error: () => { this.ladefehler = true; this.geladen = true; },
    });
  }

  wechsleAnsicht(a: Ansicht): void {
    this.ansicht = a;
  }

  aktivModule(): ModulStat[] {
    return (this.stats?.module ?? []).filter(m => m.correct + m.wrong > 0);
  }

  istFreigeschaltet(key: string): boolean {
    return this.freigeschaltetKeys.has(key);
  }

  skinGeaendert(skin: Einstellungen['skin']): void {
    this.einstellungen.skin = skin;
  }

  einstellungenSpeichern(): void {
    this.api.einstellungenSpeichern(this.einstellungen).subscribe(res => {
      this.einstellungen = res.settings;
      this.einstellungenGespeichert = true;
      setTimeout(() => (this.einstellungenGespeichert = false), 2500);
    });
  }

  nameSpeichern(): void {
    const wert = this.neuerName.trim();
    if (!wert) return;
    this.auth.updateName(wert).subscribe(() => {
      this.neuerName = '';
      this.nameGespeichert = true;
      setTimeout(() => (this.nameGespeichert = false), 2500);
    });
  }

  kontoSpeichern(): void {
    this.kontoFehler = null;
    const email = this.neueEmail.trim();
    const passwort = this.neuesPasswort;

    if (!email && !passwort) return;
    if (passwort && passwort.length < 8) {
      this.kontoFehler = 'Das neue Passwort muss mindestens 8 Zeichen haben.';
      return;
    }
    if (passwort && passwort !== this.neuesPasswortWiederholen) {
      this.kontoFehler = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.auth.updateAccount({ email: email || undefined, newPassword: passwort || undefined }).subscribe({
      next: () => {
        this.neueEmail = '';
        this.neuesPasswort = '';
        this.neuesPasswortWiederholen = '';
        this.kontoGespeichert = true;
        setTimeout(() => (this.kontoGespeichert = false), 2500);
      },
      error: (err) => {
        this.kontoFehler = err?.error?.error ?? 'Änderung fehlgeschlagen.';
      },
    });
  }

  abmelden(): void {
    this.auth.logout();
    this.router.navigateByUrl('/dashboard');
  }

  private baueCharts(module: ModulStat[]): void {
    const aktiv = module.filter(m => m.correct + m.wrong > 0).sort((a, b) => (b.correct + b.wrong) - (a.correct + a.wrong)).slice(0, 12);

    this.balkenChart = {
      type: 'bar',
      data: {
        labels: aktiv.map(m => modulLabel(m.moduleKey)),
        datasets: [
          { label: 'Richtig', data: aktiv.map(m => m.correct), backgroundColor: SUCCESS },
          { label: 'Falsch', data: aktiv.map(m => m.wrong), backgroundColor: DANGER },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { color: MUTED, font: { size: 10 } }, grid: { color: GRID } },
          y: { stacked: true, ticks: { color: MUTED }, grid: { color: GRID } },
        },
        plugins: { legend: { labels: { color: MUTED } } },
      },
    };

    const totalCorrect = this.stats?.summe.richtig ?? 0;
    const totalWrong = (this.stats?.summe.beantwortet ?? 0) - totalCorrect;
    this.ringChart = {
      type: 'doughnut',
      data: {
        labels: ['Richtig', 'Falsch'],
        datasets: [{ data: [totalCorrect, totalWrong], backgroundColor: [SUCCESS, DANGER], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: MUTED } } },
      },
    };

    const mitStreak = module.filter(m => m.bestStreak > 0).sort((a, b) => b.bestStreak - a.bestStreak).slice(0, 10);
    this.streakChart = {
      type: 'bar',
      data: {
        labels: mitStreak.map(m => modulLabel(m.moduleKey)),
        datasets: [{ label: 'Beste Serie', data: mitStreak.map(m => m.bestStreak), backgroundColor: ACCENT }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: MUTED }, grid: { color: GRID } },
          y: { ticks: { color: MUTED, font: { size: 10 } }, grid: { color: GRID } },
        },
        plugins: { legend: { display: false } },
      },
    };
  }
}
