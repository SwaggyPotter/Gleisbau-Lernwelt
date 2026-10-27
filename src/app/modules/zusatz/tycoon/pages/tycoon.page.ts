import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { startTycoon, TycoonHandle } from '../tycoon-engine';
import { TycoonAnsicht, TycoonApiService, TycoonClan, TycoonDuell, TycoonEintrag } from '../tycoon-api.service';
import { GEBIET_STADT, gebietMitId } from '../tycoon-gebiete';
import { KLASSEN, levelAus } from '../tycoon-zuege';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TycoonWelt3D, zugDateien } from '../tycoon-3d';
import { ladeHoehen } from '../tycoon-hoehen';
import { Engine3D } from '../../../../shared/engine3d/engine3d';

/** Neuer Schluessel (2026-10-27): 2D ist jetzt Standard, alte gemerkte 3D-Wahl gilt nicht mehr. */
const ANSICHT_KEY = 'tycoon-ansicht3d-v2';
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

  /** 3D-Ansicht der Karte (Standard aus = 2D, Wahl wird im Browser gemerkt). */
  ansicht3d = this.leseAnsicht();
  /** Freie Kamera (drehen/zoomen) statt starrer Kartenansicht. Standard: starr. */
  kameraFrei = this.lese(KAMERA_KEY, false);

  tab: 'spiel' | 'rangliste' | 'duelle' | 'clans' = 'spiel';
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
  rangNach: 'level' | 'geld' | 'strecken' | 'bezirke' | 'siege' = 'level';
  readonly rangKategorien: { id: 'level' | 'geld' | 'strecken' | 'bezirke' | 'siege'; n: string }[] = [
    { id: 'level', n: 'Level' }, { id: 'geld', n: 'Guthaben' }, { id: 'strecken', n: 'Strecken' }, { id: 'bezirke', n: 'Gebiete' }, { id: 'siege', n: 'Duell-Siege' },
  ];
  clans: TycoonClan[] = [];
  meinClan: string | null = null;
  clanFarben: string[] = [];
  clanMeldung = '';
  neuName = '';
  neuKuerzel = '';
  neuFarbe = '';
  private weltTimer: ReturnType<typeof setInterval> | null = null;
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
  private hoehenBereit = false;

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
    if (this.weltTimer) clearInterval(this.weltTimer);
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
      onVorschau: (el, typ, farbe, extra) => this.zeigeVorschau(el, typ, farbe ?? null, !!extra),
      onGebiet: (gebiet, basis) => this.kaufeGebiet(gebiet, basis),
      onVerbindung: (a, b, nameA, nameB, gebiete) => this.meldeVerbindung(a, b, nameA, nameB, gebiete),
      onClanProjekt: (art) => this.api.clanProjektStarten(art).subscribe({
        next: () => { this.handle?.meldung('🤝 Clan-Großprojekt gestartet!'); this.ladeWelt(); },
        error: (err) => this.handle?.meldung(err?.error?.error ?? 'Projekt konnte nicht gestartet werden.'),
      }),
      onClanBeitrag: (betrag, schicht) => this.api.clanBeitrag(betrag, schicht).subscribe({
        next: (r) => { this.handle?.clanBezahlt(schicht ? 0 : betrag, r.fertig ? '🎉 Clan-Großprojekt fertig!' : '🤝 Beitrag: ' + betrag.toLocaleString('de-DE') + ' € (' + Math.round(r.stand / r.ziel * 100) + ' %)'); this.ladeWelt(); },
        error: (err) => this.handle?.meldung(err?.error?.error ?? 'Beitrag nicht möglich.'),
      }),
      onReset: () => {
        this.pending = null;
        if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
        // Danach gleich die Welt neu laden, damit die freigegebenen Gebiete nicht noch als eigene erscheinen.
        this.api.zuruecksetzen().subscribe({ next: () => this.ladeWelt(), error: () => (this.status = 'Zurücksetzen fehlgeschlagen') });
        this.geteilt = false;
        this.besucher = 0;
      },
    });
    this.starteWelt();
    if (!readOnly) {
      this.ladeWelt();
      this.weltTimer = setInterval(() => this.ladeWelt(), 30000);
    }
  }

  /** Gemeinsame Welt laden und offene Gutschriften (Entschaedigungen) gleich gutschreiben. */
  private ladeWelt(): void {
    this.api.welt().subscribe({
      next: (w) => {
        this.handle?.setzeWelt(w);
        if (w.gutschriftenOffen > 0) {
          this.api.gutschriftenAbholen().subscribe((g) => {
            if (g.summe > 0 || g.xp > 0) this.handle?.gutschrift(g.summe, g.eintraege.length === 1 ? g.eintraege[0].text : g.eintraege.length + ' Gutschriften (Entschädigungen / Clan-Boni)', g.xp);
          });
        }
      },
      error: () => undefined,
    });
  }

  private kaufeGebiet(gebiet: number, basis: number): void {
    this.sicher().pipe(switchMap(() => this.api.bezirkKaufen(GEBIET_STADT, gebiet, basis))).subscribe({
      next: (r) => {
        const name = gebietMitId(gebiet)?.n ?? 'Gebiet';
        this.handle?.bezahlt(r.preis, (r.uebernommen ? '⚔ Gebiet übernommen: ' : '🗺 Gebiet gekauft: ') + name);
        this.ladeWelt();
      },
      error: (err) => { this.handle?.meldung(err?.error?.error ?? 'Kauf nicht möglich.'); this.ladeWelt(); },
    });
  }

  /** a, b: Streckenenden (Stadt-Index oder Bahnhof ab 1000), gebiete: deren Gebiete (fuer den Clan-Bonus). */
  private meldeVerbindung(a: number, b: number, nameA: string, nameB: string, gebiete: number[]): void {
    this.sicher().pipe(switchMap(() => this.api.verbindung(a, b, nameA, nameB, gebiete))).subscribe({
      next: (r) => { if (r.mitglieder > 0) this.handle?.meldung('🤝 ' + r.mitglieder + ' Clan-Mitglied(er) in ' + nameA + '/' + nameB + ' bekommen +' + r.xp + ' Erfahrung.'); },
      error: () => undefined,
    });
  }

  ladeClans(): void {
    this.api.clans().subscribe({
      next: (r) => { this.clans = r.clans; this.meinClan = r.meinClan; this.clanFarben = r.farben; if (!this.neuFarbe) this.neuFarbe = r.farben[0]; },
      error: () => (this.clanMeldung = 'Clans konnten nicht geladen werden.'),
    });
  }

  clanGruenden(): void {
    this.clanMeldung = '';
    this.api.clanGruenden(this.neuName, this.neuKuerzel, this.neuFarbe).subscribe({
      next: () => { this.clanMeldung = 'Clan „' + this.neuName + '“ gegründet!'; this.neuName = ''; this.neuKuerzel = ''; this.ladeClans(); this.ladeWelt(); },
      error: (err) => (this.clanMeldung = err?.error?.error === 'Invalid request payload' ? 'Name 3–30 Zeichen, Kürzel 2–4 Buchstaben/Ziffern.' : err?.error?.error ?? 'Gründen nicht möglich.'),
    });
  }

  clanBeitreten(c: TycoonClan): void {
    this.api.clanBeitreten(c.id).subscribe({ next: () => { this.clanMeldung = 'Willkommen bei ' + c.name + '!'; this.ladeClans(); this.ladeWelt(); }, error: () => (this.clanMeldung = 'Beitritt nicht möglich.') });
  }

  clanAustreten(): void {
    this.api.clanAustreten().subscribe({ next: () => { this.clanMeldung = 'Du bist ausgetreten.'; this.ladeClans(); this.ladeWelt(); }, error: () => (this.clanMeldung = 'Austritt nicht möglich.') });
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
    return this.lese(ANSICHT_KEY, false);
  }

  private lese(key: string, standard: boolean): boolean {
    try { const v = localStorage.getItem(key); return v === null ? standard : v === '1'; } catch { return standard; }
  }

  private starteWelt(): void {
    const handle = this.handle, canvas = this.weltCanvas;
    if (this.welt || !handle || !canvas || this.destroyed) return;
    // Erst die Hoehen laden (Gelaende, Staedte und Gleise stehen darauf); bei Fehler flach weiter.
    if (!this.hoehenBereit) {
      ladeHoehen().finally(() => { this.hoehenBereit = true; this.starteWelt(); });
      return;
    }
    try {
      this.welt = this.zone.runOutsideAngular(() => new TycoonWelt3D(canvas, handle.welt, (x, y, kk) => handle.klickWelt(x, y, kk), (x, y, kk) => handle.zeigerWelt(x, y, kk), () => handle.losgelassen()));
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
  private zeigeVorschau(el: HTMLElement | null, typ: number, farbe: string | null = null, extraWagen = false): void {
    const zug = zugDateien(typ, extraWagen);
    if (el && el === this.vorschauEl && this.vorschau) {
      this.zone.runOutsideAngular(() => this.vorschau!.zeigeZug(zug.dateien, zug.umgedreht, farbe).catch(() => undefined));
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
        e.zeigeZug(zug.dateien, zug.umgedreht, farbe).catch(() => undefined);
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

  wechsle(t: 'spiel' | 'rangliste' | 'duelle' | 'clans'): void {
    this.tab = t;
    if (t === 'rangliste') this.ladeRangliste();
    if (t === 'duelle') this.ladeDuelle();
    if (t === 'clans') this.ladeClans();
  }

  get rangSortiert(): TycoonEintrag[] {
    const wert = (e: TycoonEintrag) =>
      this.rangNach === 'geld' ? e.money : this.rangNach === 'strecken' ? e.lines : this.rangNach === 'bezirke' ? e.bezirke : this.rangNach === 'siege' ? e.siege : e.xp;
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
