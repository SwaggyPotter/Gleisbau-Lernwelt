import { AfterViewInit, Component, ElementRef, isDevMode, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { startTycoon, TycoonHandle } from '../tycoon-engine';
import { TycoonAngebot, TycoonAnsicht, TycoonApiService, TycoonClan, TycoonEintrag, TycoonFirma, TycoonGebot, TycoonWertung } from '../tycoon-api.service';
import { ZUEGE } from '../tycoon-zuege';
import { GEBIET_STADT, gebietMitId } from '../tycoon-gebiete';
import { KLASSEN, levelAus } from '../tycoon-zuege';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
  /** Zug, in dessen Fuehrerstand gerade mitgefahren wird (3D), sonst null. */
  mitZug: number | null = null;

  tab: 'spiel' | 'rangliste' | 'clans' | 'wertung' | 'markt' = 'spiel';
  /* Wertung, Boerse, Markt (backend/src/routes/tycoon-gemeinschaft.ts) */
  wertung: TycoonWertung | null = null;
  wertungFehler = false;
  firmen: TycoonFirma[] = [];
  boerseGebuehr = 0.01;
  /** Wert aller eigenen Aktien zum aktuellen Kurs. */
  get depotWert(): number { return this.firmen.reduce((a, f) => a + (f.stueck || 0) * f.kurs, 0); }
  angebote: TycoonAngebot[] = [];
  gebote: TycoonGebot[] = [];
  marktMeldung = '';
  angebotArt: 'gebiet' | 'zug' = 'zug';
  angebotGebiet: number | null = null;
  angebotZug: number | null = null;
  angebotPreis = 5000;
  private weltDaten: any = null;
  readonly zugName = (t: number) => ZUEGE[t]?.n ?? 'Zug';
  readonly gebietName = (g: number | null) => (g === null ? '' : gebietMitId(g)?.n ?? 'Gebiet');
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
  rangNach: 'level' | 'geld' | 'strecken' | 'bezirke' = 'level';
  readonly rangKategorien: { id: 'level' | 'geld' | 'strecken' | 'bezirke'; n: string }[] = [
    { id: 'level', n: 'Level' }, { id: 'geld', n: 'Guthaben' }, { id: 'strecken', n: 'Strecken' }, { id: 'bezirke', n: 'Gebiete' },
  ];
  clans: TycoonClan[] = [];
  meinClan: string | null = null;
  clanFarben: string[] = [];
  clanMeldung = '';
  neuName = '';
  neuKuerzel = '';
  neuFarbe = '';
  /** Leer = offener Clan. */
  neuPasswort = '';
  passwortRecht = false;
  clanPasswortNeu = '';
  clanEinladungen: { clanId: string; von: string }[] = [];
  eingeladen = new Set<string>();
  spielerSuche = '';
  /** Clan, fuer den gerade das Passwortfeld offen ist. */
  passwortFuer: string | null = null;
  beitrittPasswort = '';
  private weltTimer: ReturnType<typeof setInterval> | null = null;
  readonly klassen = KLASSEN;
  readonly level = levelAus;

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
    document.body.classList.add('tycoon-offen');
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

  /** Body-Klasse, damit der Chat-Knopf der App im Spiel nicht über Menü und Karten-Knöpfen liegt. */
  ionViewWillEnter(): void { document.body.classList.add('tycoon-offen'); }
  ionViewWillLeave(): void { document.body.classList.remove('tycoon-offen'); }

  ngOnDestroy(): void {
    document.body.classList.remove('tycoon-offen');
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
      onMitfahren: (id) => this.zone.run(() => this.starteMitfahrt(id)),
      weltPunkt: (cx, cy) => (this.ansicht3d && this.welt ? this.welt.weltPunkt(cx, cy) : null),
      onAusschreibungNeu: (bl, richt, gegner) => this.api.ausschreibungNeu(bl, richt, gegner).subscribe({ next: () => this.ladeAusschreibungen(), error: () => undefined }),
      onAusschreibungGebot: (id, gebot, versprechen) => this.api.ausschreibungGebot(id, gebot, versprechen).subscribe({ error: (err) => this.handle?.meldung(err?.error?.error ?? 'Gebot nicht möglich.') }),
      onAusschreibungAbholen: (id) => this.api.ausschreibungAbholen(id).subscribe({ next: (r) => this.handle?.vertrag(r.bl, r.gebot, r.versprechen), error: () => undefined }),
      onTrassenSuchen: (stadt) => this.api.trassen(stadt).subscribe({ next: (r) => this.handle?.zeigeTrassen(stadt, r.strecken), error: () => this.handle?.zeigeTrassen(stadt, []) }),
      onTrasseMieten: (owner, ownerName, a, b, preisMin, p, info) => this.sicher().pipe(switchMap(() => this.api.trasseMieten(owner, a, b, preisMin))).subscribe({
        next: (r) => this.handle?.trasseGemietet(r.id, owner, ownerName, a, b, preisMin, p, info),
        error: (err) => this.handle?.meldung(err?.error?.error ?? 'Mieten nicht möglich.'),
      }),
      onTrasseKuendigen: (id) => this.api.trasseKuendigen(id).subscribe({ error: () => undefined }),
      onVorschau: (el, typ, farbe, extra) => this.zeigeVorschau(el, typ, farbe ?? null, !!extra),
      onGebiet: (gebiet, basis) => this.kaufeGebiet(gebiet, basis),
      onVerbindung: (a, b, nameA, nameB, gebiete) => this.meldeVerbindung(a, b, nameA, nameB, gebiete),
      onGebot: (gebiet, betrag) => this.bieteFuerGebiet(gebiet, betrag),
      onDurchfahrt: (posten, strecke) => this.sicher().pipe(switchMap(() => this.api.durchfahrt(posten, strecke))).subscribe({ error: () => undefined }),
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
    // Nur lokal (ng serve): Handle fuer Browser-Tests erreichbar machen; im Produktions-Build nicht vorhanden.
    if (isDevMode()) (window as unknown as { __tycoon?: TycoonHandle }).__tycoon = this.handle;
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
        this.weltDaten = w;
        this.handle?.setzeWelt(w);
        this.ladeAusschreibungen();
        if (w.gutschriftenOffen > 0) {
          this.api.gutschriftenAbholen().subscribe((g) => {
            const text = g.eintraege.length === 1 ? g.eintraege[0].text : g.eintraege.length + ' Gutschriften (Entschädigungen, Clan-Boni, Wertungen, Miete, Markt)';
            if (g.summe > 0 || g.xp > 0) this.handle?.gutschrift(g.summe, text, g.xp);
            if (g.pokale > 0) this.handle?.belohnung(0, g.pokale, text);
          });
        }
      },
      error: () => undefined,
    });
  }

  /** Ausschreibungen (Spieler gegen Spieler) in den Laendern mit eigenen Strecken. */
  private ladeAusschreibungen(): void {
    const h = this.handle;
    if (!h) return;
    this.api.ausschreibungen(h.bundeslaender()).subscribe({ next: (d) => this.handle?.setzeAusschreibungen(d), error: () => undefined });
  }

  ladeWertung(): void {
    this.flush();
    this.api.wertung().subscribe({ next: (w) => { this.wertung = w; this.wertungFehler = false; }, error: () => (this.wertungFehler = true) });
  }

  bisDatum(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' });
  }

  ladeMarkt(): void {
    this.flush();
    this.api.boerse().subscribe({ next: (b) => { this.firmen = b.firmen; this.boerseGebuehr = b.gebuehr; }, error: () => (this.marktMeldung = 'Börse konnte nicht geladen werden.') });
    this.api.markt().subscribe({ next: (m) => (this.angebote = m.angebote), error: () => (this.marktMeldung = 'Markt konnte nicht geladen werden.') });
    this.api.gebote().subscribe({ next: (g) => (this.gebote = g.gebote), error: () => undefined });
  }

  get geboteFuerMich(): TycoonGebot[] { return this.gebote.filter((g) => !g.meins); }
  get meineGebote(): TycoonGebot[] { return this.gebote.filter((g) => g.meins); }

  /** Gebot abgeben: der Betrag wird gleich abgebucht (zurueckgehalten) und kommt bei Ablehnung als Gutschrift zurueck. */
  private bieteFuerGebiet(gebiet: number, betrag: number): void {
    const name = gebietMitId(gebiet)?.n ?? 'Gebiet';
    this.sicher().pipe(switchMap(() => this.api.gebotAbgeben(gebiet, betrag))).subscribe({
      next: (r) => { this.handle?.abbuchen(r.betrag, '💬 Gebot für ' + name + ' abgegeben (' + this.eur(r.betrag) + ' € zurückgehalten)'); this.ladeMarkt(); },
      error: (err) => this.handle?.meldung(err?.error?.error ?? 'Gebot nicht möglich.'),
    });
  }

  /** Gebot annehmen/ablehnen (fuer mein Gebiet) oder eigenes zurueckziehen; Geld kommt jeweils als Gutschrift. */
  gebotAktion(g: TycoonGebot, aktion: 'annehmen' | 'ablehnen' | 'zurueck'): void {
    this.marktMeldung = '';
    if (aktion === 'annehmen' && !confirm(this.gebietName(g.gebiet) + ' für ' + this.eur(g.betrag) + ' € an ' + g.bieter + ' verkaufen?')) return;
    this.sicher().pipe(switchMap(() => this.api.gebotAktion(g.id, aktion))).subscribe({
      next: () => {
        this.marktMeldung = aktion === 'annehmen' ? 'Verkauft – das Geld kommt als Gutschrift.' : aktion === 'ablehnen' ? 'Gebot abgelehnt.' : 'Gebot zurückgezogen – der Betrag kommt zurück.';
        this.ladeWelt(); this.ladeMarkt();
      },
      error: (err) => { this.marktMeldung = err?.error?.error ?? 'Das ging nicht.'; this.ladeWelt(); this.ladeMarkt(); },
    });
  }

  get geld(): number { return this.handle?.geld() ?? 0; }
  get meineZuege(): { id: number; n: string; strecke: string; type: number }[] { return this.handle?.eigeneZuege() ?? []; }
  get meineGebiete(): number[] {
    const ich = this.weltDaten?.ich?.id;
    return (this.weltDaten?.bezirke || []).filter((b: any) => b.stadt === GEBIET_STADT && b.ownerId === ich).map((b: any) => b.bezirk);
  }

  /** Aktien kaufen (n > 0) oder verkaufen (n < 0); Geld bucht das Spiel. */
  aktie(f: TycoonFirma, n: number): void {
    this.marktMeldung = '';
    if (n > 0 && f.kurs * n * (1 + this.boerseGebuehr) > this.geld) { this.marktMeldung = 'Zu wenig Guthaben.'; return; }
    this.sicher().pipe(switchMap(() => this.api.aktienHandel(f.userId, n))).subscribe({
      next: (r) => {
        const text = (n > 0 ? '📈 ' + n + ' Aktien von ' + f.name + ' gekauft' : '📉 ' + -n + ' Aktien von ' + f.name + ' verkauft') + ' (Kurs ' + r.kurs.toLocaleString('de-DE') + ' €)';
        if (r.betrag < 0) this.handle?.abbuchen(-r.betrag, text + ' −' + this.eur(-r.betrag) + ' €');
        else this.handle?.gutschrift(r.betrag, text);
        this.ladeMarkt();
      },
      error: (err) => (this.marktMeldung = err?.error?.error ?? 'Handel nicht möglich.'),
    });
  }

  kaufeAngebot(a: TycoonAngebot): void {
    this.marktMeldung = '';
    if (a.preis > this.geld) { this.marktMeldung = 'Zu wenig Guthaben.'; return; }
    this.sicher().pipe(switchMap(() => this.api.marktKaufen(a.id))).subscribe({
      next: (r) => {
        this.handle?.abbuchen(r.preis, '🛒 Gekauft von ' + a.verkaeufer + ' (−' + this.eur(r.preis) + ' €)');
        if (r.art === 'zug') this.handle?.zugAufnehmen(r.zug, '🚆 ' + this.zugName(r.zug?.type) + ' gekauft');
        else this.ladeWelt();
        this.ladeMarkt();
      },
      error: (err) => { this.marktMeldung = err?.error?.error ?? 'Kauf nicht möglich.'; this.ladeMarkt(); },
    });
  }

  anbieten(): void {
    this.marktMeldung = '';
    const preis = Math.round(+this.angebotPreis);
    if (!(preis >= 1)) { this.marktMeldung = 'Bitte einen Preis eingeben.'; return; }
    if (this.angebotArt === 'gebiet') {
      if (this.angebotGebiet === null) { this.marktMeldung = 'Bitte ein Gebiet wählen.'; return; }
      this.api.anbieten('gebiet', preis, +this.angebotGebiet).subscribe({
        next: () => { this.marktMeldung = 'Gebiet steht zum Verkauf.'; this.ladeMarkt(); },
        error: (err) => (this.marktMeldung = err?.error?.error ?? 'Anbieten nicht möglich.'),
      });
      return;
    }
    if (this.angebotZug === null) { this.marktMeldung = 'Bitte einen Zug wählen.'; return; }
    const zug = this.handle?.zugAbgeben(+this.angebotZug);
    if (!zug) { this.marktMeldung = 'Zug nicht gefunden.'; return; }
    this.angebotZug = null;
    this.sicher().pipe(switchMap(() => this.api.anbieten('zug', preis, undefined, zug))).subscribe({
      next: () => { this.marktMeldung = 'Zug steht zum Verkauf (bis dahin ist er aus dem Spiel genommen).'; this.ladeMarkt(); },
      error: (err) => { this.handle?.zugAufnehmen(zug, 'Anbieten fehlgeschlagen – Zug zurück'); this.marktMeldung = err?.error?.error ?? 'Anbieten nicht möglich.'; },
    });
  }

  zurueckziehen(a: TycoonAngebot): void {
    this.api.marktZurueck(a.id).subscribe({
      next: (r) => { if (r.art === 'zug' && r.zug) this.handle?.zugAufnehmen(r.zug, '🚆 Angebot zurückgezogen'); this.ladeMarkt(); },
      error: (err) => { this.marktMeldung = err?.error?.error ?? 'Das ging nicht.'; this.ladeMarkt(); },
    });
  }

  private kaufeGebiet(gebiet: number, basis: number): void {
    this.sicher().pipe(switchMap(() => this.api.bezirkKaufen(GEBIET_STADT, gebiet, basis))).subscribe({
      next: (r) => {
        const name = gebietMitId(gebiet)?.n ?? 'Gebiet';
        this.handle?.bezahlt(r.preis, '🗺 Gebiet gekauft: ' + name);
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
      next: (r) => {
        this.clans = r.clans; this.meinClan = r.meinClan; this.clanFarben = r.farben; if (!this.neuFarbe) this.neuFarbe = r.farben[0];
        this.passwortRecht = r.passwortRecht; this.clanEinladungen = r.einladungen; this.eingeladen = new Set(r.eingeladen);
      },
      error: () => (this.clanMeldung = 'Clans konnten nicht geladen werden.'),
    });
  }

  get meinClanDaten(): TycoonClan | undefined { return this.clans.find((c) => c.id === this.meinClan); }
  clanVon(id: string): TycoonClan | undefined { return this.clans.find((c) => c.id === id); }

  /** Spieler, die man in den eigenen Clan einladen kann (aus der Rangliste), gefiltert nach Suche. */
  get einladbar(): TycoonEintrag[] {
    const k = this.meinClanDaten?.kuerzel, q = this.spielerSuche.trim().toLowerCase();
    return this.rang.filter((e) => !e.isMe && (!k || e.clan !== k) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  clanGruenden(): void {
    this.clanMeldung = '';
    this.api.clanGruenden(this.neuName, this.neuKuerzel, this.neuFarbe, this.neuPasswort).subscribe({
      next: () => { this.clanMeldung = 'Clan „' + this.neuName + '“ gegründet!'; this.neuName = ''; this.neuKuerzel = ''; this.neuPasswort = ''; this.ladeClans(); this.ladeWelt(); },
      error: (err) => (this.clanMeldung = err?.error?.error === 'Invalid request payload' ? 'Name 3–30 Zeichen, Kürzel 2–4 Buchstaben/Ziffern, Passwort leer oder mind. 4 Zeichen.' : err?.error?.error ?? 'Gründen nicht möglich.'),
    });
  }

  /** Clan mit Passwort: erst das Eingabefeld zeigen (ausser man ist eingeladen). */
  clanBeitreten(c: TycoonClan, ohnePasswort = false): void {
    this.clanMeldung = '';
    if (c.passwort && !ohnePasswort && this.passwortFuer !== c.id) { this.passwortFuer = c.id; this.beitrittPasswort = ''; return; }
    this.api.clanBeitreten(c.id, ohnePasswort ? '' : this.beitrittPasswort).subscribe({
      next: () => { this.clanMeldung = 'Willkommen bei ' + c.name + '!'; this.passwortFuer = null; this.beitrittPasswort = ''; this.ladeClans(); this.ladeWelt(); this.ladeRangliste(); },
      error: (err) => (this.clanMeldung = err?.error?.error ?? 'Beitritt nicht möglich.'),
    });
  }

  einladungAnnehmen(clanId: string): void {
    const c = this.clanVon(clanId);
    if (c) this.clanBeitreten(c, true);
  }

  einladungAblehnen(clanId: string): void {
    this.api.clanEinladungAblehnen(clanId).subscribe({ next: () => this.ladeClans(), error: () => (this.clanMeldung = 'Das ging nicht.') });
  }

  einladen(e: TycoonEintrag): void {
    this.clanMeldung = '';
    this.api.clanEinladen(e.userId).subscribe({
      next: () => { this.eingeladen.add(e.userId); this.clanMeldung = e.name + ' ist eingeladen.'; },
      error: (err) => (this.clanMeldung = err?.error?.error ?? 'Einladen nicht möglich.'),
    });
  }

  passwortSpeichern(): void {
    this.clanMeldung = '';
    this.api.clanPasswort(this.clanPasswortNeu).subscribe({
      next: (r) => { this.clanMeldung = r.passwort ? 'Passwort gesetzt – Beitritt nur noch mit Passwort oder Einladung.' : 'Passwort entfernt – jeder darf beitreten.'; this.clanPasswortNeu = ''; this.ladeClans(); },
      error: (err) => (this.clanMeldung = err?.error?.error === 'Invalid request payload' ? 'Passwort mindestens 4 Zeichen.' : err?.error?.error ?? 'Ändern nicht möglich.'),
    });
  }

  clanAustreten(): void {
    this.api.clanAustreten().subscribe({ next: () => { this.clanMeldung = 'Du bist ausgetreten.'; this.ladeClans(); this.ladeWelt(); }, error: () => (this.clanMeldung = 'Austritt nicht möglich.') });
  }

  schalte3d(): void {
    this.ansicht3d = !this.ansicht3d;
    if (!this.ansicht3d) this.mitZug = null;
    try { localStorage.setItem(ANSICHT_KEY, this.ansicht3d ? '1' : '0'); } catch { /* egal */ }
  }

  /** Im Fuehrerstand mitfahren: 3D einschalten (falls aus), dann Kamera auf den Zug. */
  starteMitfahrt(id: number): void {
    this.mitZug = id;
    if (!this.ansicht3d) this.schalte3d();
    this.welt?.mitfahren(id);
  }

  mitArt: 'hinten' | 'vorn' = 'hinten';
  setzeMitArt(art: 'hinten' | 'vorn'): void {
    this.mitArt = art;
    if (this.welt) this.welt.mitArt = art;
  }

  beendeMitfahrt(): void {
    this.mitZug = null;
    this.welt?.mitfahren(null);
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
      this.welt.onMitfahrtEnde = () => this.zone.run(() => (this.mitZug = null));
      this.welt.mitArt = this.mitArt;
      if (this.mitZug !== null) this.welt.mitfahren(this.mitZug);
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

  wechsle(t: 'spiel' | 'rangliste' | 'clans' | 'wertung' | 'markt'): void {
    this.tab = t;
    if (t === 'wertung') this.ladeWertung();
    if (t === 'markt') this.ladeMarkt();
    if (t === 'rangliste') this.ladeRangliste();
    // Die Spielerliste zum Einladen ist die Rangliste.
    if (t === 'clans') { this.ladeClans(); this.ladeRangliste(); }
  }

  get rangSortiert(): TycoonEintrag[] {
    const wert = (e: TycoonEintrag) =>
      this.rangNach === 'geld' ? e.money : this.rangNach === 'strecken' ? e.lines : this.rangNach === 'bezirke' ? e.bezirke : e.xp;
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

  /** Ganzzahl mit deutschem Tausenderpunkt (die Angular-Locale 'de' ist in der App nicht registriert). */
  eur(n: number): string {
    return Math.round(n || 0).toLocaleString('de-DE');
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
