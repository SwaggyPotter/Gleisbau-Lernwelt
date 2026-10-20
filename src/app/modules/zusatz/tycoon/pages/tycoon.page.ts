import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { startTycoon, TycoonHandle } from '../tycoon-engine';
import { TycoonAnsicht, TycoonApiService, TycoonDuell, TycoonEintrag } from '../tycoon-api.service';
import { KLASSEN, levelAus } from '../tycoon-zuege';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TycoonWelt3D, zugDateien } from '../tycoon-3d';
import { Engine3D } from '../../../../shared/engine3d/engine3d';

const ANSICHT_KEY = 'tycoon-ansicht3d';
const KAMERA_KEY = 'tycoon-kamera-frei';

@Component({
  selector: 'app-tycoon',
  templateUrl: './tycoon.page.html',
  styleUrls: ['./tycoon.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class TycoonPage implements AfterViewInit, OnDestroy {
  @ViewChild('gameRoot') gameRoot!: ElementRef<HTMLElement>;

  /** Die 3D-Welt lebt nur, solange ihr Canvas angezeigt wird (*ngIf). */
  @ViewChild('c3d') set c3d(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement === this.weltCanvas) return;
    this.welt?.zerstoeren();
    this.welt = null;
    this.weltCanvas = ref?.nativeElement ?? null;
    this.starteWelt();
  }

  /** 3D-Ansicht der Karte (Standard an, Wahl wird im Browser gemerkt). */
  ansicht3d = this.leseAnsicht();
  /** Freie Kamera (drehen/zoomen) statt starrer Kartenansicht. Standard: starr. */
  kameraFrei = this.lese(KAMERA_KEY, false);

  tab: 'spiel' | 'rangliste' | 'duelle' = 'spiel';
  geladen = false;
  fehler = '';
  geteilt = false;
  teilenBusy = false;
  besucher = 0;
  status = '';
  ansichtVon: TycoonAnsicht | null = null;

  readonly modi = ['Entspannt', 'Normal', 'Anspruchsvoll', 'Stress'];
  rang: TycoonEintrag[] = [];
  rangGeladen = false;
  rangFehler = false;
  /** Sortierung der Rangliste. */
  rangNach: 'level' | 'geld' | 'strecken' | 'siege' = 'level';
  readonly rangKategorien: { id: 'level' | 'geld' | 'strecken' | 'siege'; n: string }[] = [
    { id: 'level', n: 'Level' }, { id: 'geld', n: 'Guthaben' }, { id: 'strecken', n: 'Strecken' }, { id: 'siege', n: 'Duell-Siege' },
  ];
  readonly klassen = KLASSEN;
  readonly level = levelAus;
  duelle: TycoonDuell[] = [];
  duelleGeladen = false;
  duellMeldung = '';

  private handle: TycoonHandle | null = null;
  private pending: unknown | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private welt: TycoonWelt3D | null = null;
  private weltCanvas: HTMLCanvasElement | null = null;
  private vorschau: Engine3D | null = null;
  private vorschauEl: HTMLElement | null = null;

  constructor(private readonly api: TycoonApiService, private readonly route: ActivatedRoute, private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.api.ansehen(userId).subscribe({
        next: a => { this.ansichtVon = a; this.besucher = a.visitors; this.geladen = true; this.starte(a.state, true); },
        error: e => { this.geladen = true; this.fehler = e?.status === 403 ? 'Dieses Netz ist nicht freigegeben.' : 'Netz konnte nicht geladen werden.'; },
      });
      return;
    }
    // Das Spiel startet erst nach erfolgreichem Laden -- sonst wuerde ein Ladefehler
    // den Serverstand beim naechsten Speichern mit einem leeren Spiel ueberschreiben.
    this.api.meinStand().subscribe({
      next: m => { this.geteilt = m.shared; this.besucher = m.visitors; this.geladen = true; this.starte(m.state, false); },
      error: () => { this.geladen = true; this.fehler = 'Spielstand konnte nicht geladen werden (angemeldet?).'; },
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.zeigeVorschau(null, 0);
    this.welt?.zerstoeren();
    this.welt = null;
    this.handle?.destroy();
    this.flush();
  }

  private starte(state: unknown, readOnly: boolean): void {
    if (this.destroyed) return;
    this.handle = startTycoon(this.gameRoot.nativeElement, {
      state,
      readOnly,
      onSave: data => this.queueSave(data),
      onVorschau: (el, typ) => this.zeigeVorschau(el, typ),
      onReset: () => {
        this.pending = null;
        if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
        this.api.zuruecksetzen().subscribe({ error: () => (this.status = 'Zurücksetzen fehlgeschlagen') });
        this.geteilt = false;
        this.besucher = 0;
      },
    });
    this.starteWelt();
  }

  schalte3d(): void {
    this.ansicht3d = !this.ansicht3d;
    try { localStorage.setItem(ANSICHT_KEY, this.ansicht3d ? '1' : '0'); } catch { /* egal */ }
  }

  schalteKamera(): void {
    this.kameraFrei = !this.kameraFrei;
    try { localStorage.setItem(KAMERA_KEY, this.kameraFrei ? '1' : '0'); } catch { /* egal */ }
    this.welt?.setzeFreieKamera(this.kameraFrei);
  }

  private leseAnsicht(): boolean {
    return this.lese(ANSICHT_KEY, true);
  }

  private lese(key: string, standard: boolean): boolean {
    try { const v = localStorage.getItem(key); return v === null ? standard : v === '1'; } catch { return standard; }
  }

  private starteWelt(): void {
    const handle = this.handle, canvas = this.weltCanvas;
    if (this.welt || !handle || !canvas || this.destroyed) return;
    try {
      this.welt = this.zone.runOutsideAngular(() => new TycoonWelt3D(canvas, handle.welt, (x, y) => handle.klickWelt(x, y)));
      this.welt.setzeFreieKamera(this.kameraFrei);
    } catch {
      // Kein WebGL: bei der 2D-Karte bleiben.
      this.welt = null;
      this.ansicht3d = false;
    }
  }

  /**
   * Ganzen Zug (Lok + Wagen) im Kaufdialog, bei "3D ansehen" und im Shop drehen lassen; el = null raeumt auf.
   * Bleibt der Behaelter derselbe (Shop: anderer Zug angeklickt), wird die laufende Engine weiterverwendet.
   */
  private zeigeVorschau(el: HTMLElement | null, typ: number): void {
    const zug = zugDateien(typ);
    if (el && el === this.vorschauEl && this.vorschau) {
      this.zone.runOutsideAngular(() => this.vorschau!.zeigeZug(zug.dateien, zug.umgedreht).catch(() => undefined));
      return;
    }
    this.vorschau?.zerstoeren();
    this.vorschau = null;
    this.vorschauEl = el;
    if (!el) return;
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    try {
      this.vorschau = this.zone.runOutsideAngular(() => {
        const e = new Engine3D(canvas);
        e.zeigeZug(zug.dateien, zug.umgedreht).catch(() => undefined);
        return e;
      });
    } catch {
      el.textContent = '3D-Vorschau nicht verfügbar.';
    }
  }

  private queueSave(data: unknown): void {
    this.pending = data;
    this.status = 'Speichert …';
    if (!this.saveTimer) this.saveTimer = setTimeout(() => this.flush(), 2500);
  }

  private flush(): void {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    if (this.pending === null) return;
    const data = this.pending;
    this.pending = null;
    this.api.speichern(data).subscribe({
      next: () => { if (!this.destroyed) this.status = 'Gespeichert ✓'; },
      error: () => { if (!this.destroyed) this.status = 'Speichern fehlgeschlagen'; },
    });
  }

  wechsle(t: 'spiel' | 'rangliste' | 'duelle'): void {
    this.tab = t;
    if (t === 'rangliste') this.ladeRangliste();
    if (t === 'duelle') this.ladeDuelle();
  }

  get rangSortiert(): TycoonEintrag[] {
    const wert = (e: TycoonEintrag) =>
      this.rangNach === 'geld' ? e.money : this.rangNach === 'strecken' ? e.lines : this.rangNach === 'siege' ? e.siege : e.xp;
    return [...this.rang].sort((a, b) => wert(b) - wert(a) || b.money - a.money);
  }

  /** Erst den aktuellen Spielstand speichern, damit der Server mit frischen Werten rechnet. */
  private sicher(): Observable<unknown> {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    if (this.pending === null) return of(null);
    const data = this.pending;
    this.pending = null;
    return this.api.speichern(data);
  }

  herausfordern(e: TycoonEintrag, stunden: 1 | 24): void {
    this.duellMeldung = '';
    this.sicher().pipe(switchMap(() => this.api.herausfordern(e.userId, stunden))).subscribe({
      next: () => { this.duellMeldung = 'Herausforderung an ' + e.name + ' verschickt (' + stunden + ' Std.). Sie startet, sobald angenommen wird.'; this.ladeDuelle(); },
      error: (err) => (this.duellMeldung = err?.error?.error ?? err?.error?.message ?? 'Herausforderung nicht möglich.'),
    });
  }

  ladeDuelle(): void {
    this.api.duelle().subscribe({
      next: (r) => { this.duelle = r.duelle; this.duelleGeladen = true; },
      error: () => { this.duelleGeladen = true; this.duellMeldung = 'Duelle konnten nicht geladen werden.'; },
    });
  }

  annehmen(d: TycoonDuell): void {
    this.sicher().pipe(switchMap(() => this.api.duellAnnehmen(d.id))).subscribe({ next: () => this.ladeDuelle(), error: () => (this.duellMeldung = 'Annehmen fehlgeschlagen.') });
  }

  ablehnen(d: TycoonDuell): void {
    this.api.duellAblehnen(d.id).subscribe({ next: () => this.ladeDuelle(), error: () => (this.duellMeldung = 'Das ging nicht.') });
  }

  abholen(d: TycoonDuell): void {
    this.api.duellAbholen(d.id).pipe(map((r) => r)).subscribe({
      next: (r) => {
        const text = r.ergebnis === 'sieg' ? '🏆 Duell gewonnen!' : r.ergebnis === 'remis' ? 'Duell unentschieden.' : 'Duell verloren – trotzdem Erfahrung gesammelt.';
        this.handle?.belohnung(r.xp, r.pokale, text);
        this.duellMeldung = text + ' +' + r.pokale + ' 🏆, +' + r.xp + ' Erfahrung (im Spiel gutgeschrieben).';
        this.ladeDuelle();
      },
      error: () => (this.duellMeldung = 'Belohnung konnte nicht abgeholt werden.'),
    });
  }

  /** Ganzzahl mit deutschem Tausenderpunkt (die Angular-Locale 'de' ist in der App nicht registriert). */
  eur(n: number): string {
    return Math.round(n || 0).toLocaleString('de-DE');
  }

  restzeit(d: TycoonDuell): string {
    if (!d.ende) return '';
    const min = Math.max(0, Math.round((new Date(d.ende).getTime() - Date.now()) / 60000));
    return min >= 60 ? Math.floor(min / 60) + ' Std. ' + (min % 60) + ' Min.' : min + ' Min.';
  }

  ladeRangliste(): void {
    this.flush();
    this.api.rangliste().subscribe({
      next: r => { this.rang = r.entries; this.rangGeladen = true; this.rangFehler = false; },
      error: () => { this.rangGeladen = true; this.rangFehler = true; },
    });
  }

  teilen(wert: boolean): void {
    this.teilenBusy = true;
    this.flush();
    this.api.teilen(wert).subscribe({
      next: r => { this.geteilt = r.shared; this.teilenBusy = false; },
      error: () => { this.teilenBusy = false; this.geteilt = !wert; this.status = 'Freigabe nicht möglich – erst eine Strecke bauen.'; },
    });
  }
}
