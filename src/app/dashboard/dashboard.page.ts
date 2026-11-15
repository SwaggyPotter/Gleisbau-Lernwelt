import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../core/api-config';
import {
  QuizTile,
  WISSENSTEST_TILES,
  GLEISBAU_LERNFELD_TILES,
  BAUBERUFE_TILES,
  RECHENTRAINER_TILES,
  SPIELE_TILES,
  BERUFSSCHULE_TILES,
  MEHR_TILES,
  FORUM_TILE,
} from '../shared/katalog';
import { gastZugangBis } from '../core/site-gate/site-gate.component';
import { AppEinstellung, AppStatusService } from '../core/app-status/app-status.service';
import { AuthService } from '../core/auth/services/auth.service';
import { MAX_STERNE, naechsteStufe, richtigeAntworten, sterneFuer } from '../shared/sterne';
import { alleAppTiles } from '../shared/katalog';
import { PresenceService } from '../core/presence/presence.service';
import { AktivitaetService } from '../core/aktivitaet/aktivitaet.service';

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
  suche = '';

  private readonly appGruppen = [
    { titel: 'Spiele', farbe: '#e4572e', tiles: SPIELE_TILES },
    { titel: 'Rechner & Trainer', farbe: '#2e86ab', tiles: RECHENTRAINER_TILES },
    { titel: 'Berufsschule – Formelsammlung lernen', farbe: '#e1a100', tiles: BERUFSSCHULE_TILES },
    { titel: 'Lernfelder Gleisbau (LF10–14)', farbe: '#59a14f', tiles: GLEISBAU_LERNFELD_TILES },
    { titel: 'Lernfelder Bauberufe (LF01–09)', farbe: '#b07aa1', tiles: BAUBERUFE_TILES },
    { titel: 'Wissenstests', farbe: '#d99a00', tiles: WISSENSTEST_TILES },
  ];

  /** Startseite als Handy-Homescreen: alle Apps in farbigen Ordnern, per Suche filterbar. */
  eingeloggt = false;

  private readonly sonstigeTiles: QuizTile[] = MEHR_TILES;
  private readonly forumTile: QuizTile = FORUM_TILE;
  istAdmin = false;
  /** Zählt hoch, wenn Status/Sichtbarkeit sich ändern (erzwingt Neuaufbau der Ordner). */
  private statusVersion = 0;
  /** Kachel-ID, deren Drei-Punkte-Menü offen ist. */
  menueFuer: string | null = null;
  menueFehler: string | null = null;

  private alleGruppen: { titel: string; farbe: string; tiles: QuizTile[] }[] = [];
  private gefiltert: { titel: string; farbe: string; tiles: QuizTile[] }[] = [];
  private filterKey = '\0';

  /** Startseite als Handy-Homescreen: alle Apps in farbigen Ordnern, per Suche filterbar.
   *  Das Ergebnis wird gecacht, damit Angular bei jedem Zyklus dieselben Objekte sieht (sonst Endlos-Neuaufbau). */
  get gruppen(): { titel: string; farbe: string; tiles: QuizTile[] }[] {
    const key = this.suche + '|' + this.eingeloggt + '|' + this.istAdmin + '|' + this.statusVersion;
    if (key === this.filterKey) return this.gefiltert;
    this.filterKey = key;
    this.alleGruppen = [...this.appGruppen, { titel: 'Mehr', farbe: '#7f8c8d', tiles: this.eingeloggt ? [this.forumTile, ...this.sonstigeTiles] : this.sonstigeTiles }]
      // Versteckte Apps sieht nur der Admin (blass mit Hinweis)
      .map(g => ({ ...g, tiles: this.istAdmin ? g.tiles : g.tiles.filter(t => this.appStatus.einstellung(t).sichtbarkeit !== 'versteckt') }))
      // Innerhalb jedes Ordners: freigegeben + geprüft vorne, dann freigegeben, dann geprüft, Rest; versteckt ganz hinten.
      // Stabil sortiert – innerhalb einer Stufe bleibt die Katalog-Reihenfolge.
      .map(g => (g.titel === 'Mehr' ? g : { ...g, tiles: this.nachFreigabeSortiert(g.tiles) }))
      .filter(g => g.tiles.length > 0);
    const q = this.normalizeText(this.suche.trim());
    if (!q) {
      this.gefiltert = this.alleGruppen;
    } else {
      const terms = q.split(/\s+/).filter(Boolean);
      this.gefiltert = this.alleGruppen
        .map(g => ({ ...g, tiles: g.tiles.filter(t => {
          const hay = this.normalizeText([t.title, t.description, t.tag].join(' '));
          return terms.every(x => hay.includes(x));
        }) }))
        .filter(g => g.tiles.length > 0);
    }
    return this.gefiltert;
  }

  /** Rang je Kachel: 3 = freigegeben (auch Gäste) + geprüft, 2 = freigegeben, 1 = geprüft, 0 = Rest, -1 = versteckt */
  private freigabeRang(t: QuizTile): number {
    const e = this.appStatus.einstellung(t);
    if (e.sichtbarkeit === 'versteckt') return -1;
    return (e.sichtbarkeit === 'gaeste' ? 2 : 0) + (e.status === 'geprueft' ? 1 : 0);
  }

  private nachFreigabeSortiert(tiles: QuizTile[]): QuizTile[] {
    return tiles
      .map((t, i) => ({ t, i, r: this.freigabeRang(t) }))
      .sort((a, b) => b.r - a.r || a.i - b.i)
      .map(x => x.t);
  }

  /** Als Gast angemeldet: nur Apps mit Sichtbarkeit „gaeste“ sind nutzbar, der Rest ist ausgegraut. */
  get gast(): boolean {
    return !!gastZugangBis();
  }

  gesperrt(t: QuizTile): boolean {
    return this.gast && !this.istAdmin && this.appStatus.einstellung(t).sichtbarkeit !== 'gaeste';
  }

  einstellung(t: QuizTile): AppEinstellung {
    return this.appStatus.einstellung(t);
  }

  /** Drei-Punkte-Menü (nur Admin) öffnen/schließen, ohne die App zu starten. */
  menueUmschalten(t: QuizTile, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menueFehler = null;
    this.menueFuer = this.menueFuer === t.id ? null : t.id;
  }

  setzeEinstellung(t: QuizTile, aenderung: Partial<AppEinstellung>, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const neu = { ...this.appStatus.einstellung(t), ...aenderung };
    this.menueFehler = null;
    this.appStatus.speichern(t, neu).subscribe({
      error: () => { this.menueFehler = 'Speichern fehlgeschlagen.'; },
    });
  }

  /** Themenquiz-Kacheln (/themenquiz/<id>) lassen sich im Fragen-Editor bearbeiten. */
  bearbeitenLink(t: QuizTile): string | null {
    const m = /^\/themenquiz\/([a-z0-9-]+)$/.exec(t.link ?? '');
    return m ? `/konto/fragen-bearbeiten/${m[1]}` : null;
  }

  menueSchliessen(): void {
    this.menueFuer = null;
  }

  trackGruppe(_i: number, g: { titel: string }): string {
    return g.titel;
  }
  tileProgressByLink: Record<string, TileProgress> = {};
  /** Sterne je Kachel (1/10/50/150/250 richtige Antworten); fehlt = Kachel ohne Fragen */
  sterneById: Record<string, { anzahl: number; titel: string }> = {};
  readonly sternPlaetze = Array.from({ length: MAX_STERNE }, (_, i) => i);

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
      description: 'Quiz nach Lernfeldern — Baustelle (LF01) und Gleisbau (LF10-14).',
      icon: 'library-outline',
      link: '/kategorie/lernfelder',
      count: GLEISBAU_LERNFELD_TILES.length + BAUBERUFE_TILES.length,
    },
    {
      id: 'bereich-rechentrainer',
      title: 'Rechentrainer',
      description: 'Nivellieren, Volumen, Prozentrechnung, Gesamtquiz, Materialrechner, Trassierung, Weichen, Schienendehnung, Prüfungssimulation, Lernfortschritt und Glossar.',
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

  readonly user$ = this.auth.currentUser$;
  readonly online$ = this.presence.online$;

  constructor(
    private readonly auth: AuthService,
    private readonly presence: PresenceService,
    private readonly appStatus: AppStatusService,
    aktivitaet: AktivitaetService,
    private readonly http: HttpClient,
  ) {
    this.presence.start();
    aktivitaet.start();
    this.auth.currentUser$.subscribe(u => {
      this.eingeloggt = !!u;
      this.istAdmin = u?.role === 'admin';
      this.liveStarten();
    });
    this.appStatus.einstellungen$.subscribe(() => this.statusVersion++);
    this.appStatus.laden();
    this.refreshProgress();
    this.auth.restoreSession().subscribe();
  }

  ionViewWillEnter(): void {
    this.refreshProgress();
    this.appStatus.laden();
    this.liveStarten();
  }

  ionViewDidLeave(): void {
    clearInterval(this.liveTimer);
    this.liveTimer = null;
  }

  /* ---------- Live-Anzeige für den Admin (Tim, 2026-11-13): wer ist gerade in welcher App, wo lernt der Guru? ---------- */
  private liveTimer: any = null;
  private liveSeiten: { seite: string; n: number }[] = [];
  private liveBot: { app: string; text: string } | null = null;

  private liveStarten(): void {
    if (!this.istAdmin || this.liveTimer) return;
    const laden = () => this.http.get<{ seiten: { seite: string; n: number }[]; bot: { app: string; text: string } | null }>(`${API_BASE_URL}/guru/live`)
      .subscribe({ next: (r) => { this.liveSeiten = r.seiten; this.liveBot = r.bot; }, error: () => {} });
    laden();
    this.liveTimer = setInterval(laden, 15000);
  }

  private passt(seite: string, link: string): boolean {
    const l = link.split('?')[0].replace(/\/$/, '');
    return !!l && (seite === l || seite.startsWith(l + '/'));
  }

  /** Wie viele Leute sind gerade (letzte 3 Min.) in dieser App? 0 = niemand. */
  liveAnzahl(t: QuizTile): number {
    if (!this.istAdmin || !this.liveSeiten.length) return 0;
    return this.liveSeiten.reduce((a, s) => a + (this.passt(s.seite, t.link) ? s.n : 0), 0);
  }

  /** Lernt der Guru gerade in dieser App? */
  botHier(t: QuizTile): string | null {
    return this.istAdmin && this.liveBot && this.passt(this.liveBot.app, t.link) ? this.liveBot.text : null;
  }

  abmelden(): void {
    this.auth.logout();
  }

  zeigeSkinAuswahl = false;

  toggleSkinAuswahl(): void {
    this.zeigeSkinAuswahl = !this.zeigeSkinAuswahl;
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
    this.sterneAktualisieren();
  }

  private sterneAktualisieren(): void {
    const s: Record<string, { anzahl: number; titel: string }> = {};
    for (const t of alleAppTiles()) {
      const r = richtigeAntworten(t);
      if (r === null) continue;
      const n = naechsteStufe(r);
      s[t.id] = { anzahl: sterneFuer(r), titel: `${r} richtige Antworten` + (n ? ` – nächster Stern ab ${n}` : ' – alle Sterne!') };
    }
    this.sterneById = s;
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
