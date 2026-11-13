import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BuehnenStand, QuizshowApiService } from '../quizshow-api.service';
import { ShowTon } from '../ton';

const CODE_SPEICHER = 'glw-quizshow-code';

/**
 * Bühne (Laptop am Beamer): zeigt die Show, fragt zweimal pro Sekunde den Stand ab
 * und spielt Klänge/Animationen beim Wechsel. Gesteuert wird vom Tablet (Fernbedienung).
 */
@Component({
  selector: 'app-quizshow-buehne',
  templateUrl: './buehne.page.html',
  styleUrls: ['./buehne.page.scss'],
  standalone: false,
})
export class BuehnePage implements OnInit, OnDestroy {
  stand?: BuehnenStand;
  fehler = '';
  gestartet = false;
  /** Antwort, die gerade beim Umlauf leuchtet */
  leuchtet: number | null = null;
  /** Auflösung fertig (richtige Antwort grün) */
  geloest = false;
  readonly buchstaben = ['A', 'B', 'C', 'D'];
  readonly fernAdresse = `${location.host}/zusatz/quizshow/fernbedienung`;

  private readonly ton = new ShowTon();
  private timer?: ReturnType<typeof setInterval>;
  private laeuft = false;
  private umlaufTimer?: ReturnType<typeof setTimeout>;
  private ambienteTimer?: ReturnType<typeof setTimeout>;
  /** Punkte-Wackeln (geheim) und Siegerehrung */
  wackeln = false;
  wackelHoehen: number[] = [];
  private wackelTimer?: ReturnType<typeof setInterval>;
  siegerLeuchtet: number | null = null;
  siegerFertig = false;
  siegerText = '';
  private siegerTimer?: ReturnType<typeof setTimeout>;
  /** Countdown auf der Bühne */
  countdown: number | null = null;
  zeitAus = false;
  private timerId = 0;
  private countdownTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly api: QuizshowApiService, private readonly zone: NgZone) {}

  ngOnInit(): void {
    let code = '';
    try { code = localStorage.getItem(CODE_SPEICHER) ?? ''; } catch { /* ohne Speicher */ }
    if (code) {
      this.api.stand(code).subscribe({
        next: s => this.uebernehmen(s as BuehnenStand),
        error: () => this.neu(),
      });
    } else {
      this.neu();
    }
    this.timer = setInterval(() => this.abfragen(), 500);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.umlaufTimer) clearTimeout(this.umlaufTimer);
    if (this.ambienteTimer) clearTimeout(this.ambienteTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.wackelTimer) clearInterval(this.wackelTimer);
    if (this.siegerTimer) clearTimeout(this.siegerTimer);
    this.ton.alleStopp();
  }

  neu(): void {
    this.api.neueSitzung().subscribe({
      next: s => {
        try { localStorage.setItem(CODE_SPEICHER, s.code); } catch { /* egal */ }
        this.uebernehmen(s);
      },
      error: () => (this.fehler = 'Keine Verbindung zum Server.'),
    });
  }

  /** Alte Show verlassen: gemerkten Code vergessen und eine frische Sitzung (neuer Code, Punkte 0) holen */
  neueShow(): void {
    if (this.stand && !confirm(`Show ${this.stand.code} verlassen und eine neue mit neuem Code starten?`)) return;
    try { localStorage.removeItem(CODE_SPEICHER); } catch { /* egal */ }
    this.ton.alleStopp();
    this.wackelStopp();
    this.countdownStopp();
    if (this.siegerTimer) clearTimeout(this.siegerTimer);
    this.siegerFertig = false;
    this.siegerLeuchtet = null;
    this.stand = undefined;
    this.neu();
  }

  starten(): void {
    this.ton.freischalten();
    this.gestartet = true;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => undefined);
    // Steht die Show gerade beim Vorlesen, gleich ticken
    const s = this.stand;
    if (s?.phase === 'frage' && s.schritt >= 1 && s.schritt <= 5 && s.ton) this.ton.tickStart();
    this.ambientePruefen(0);
  }

  vollbild(): void {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  private abfragen(): void {
    const code = this.stand?.code;
    if (!code || this.laeuft) return;
    this.laeuft = true;
    this.api.stand(code, this.stand?.rev).subscribe({
      next: s => {
        this.laeuft = false;
        this.fehler = '';
        if (!('gleich' in s)) this.uebernehmen(s);
      },
      error: e => {
        this.laeuft = false;
        if (e?.status === 404) this.neu(); // Server neu gestartet → neue Bühne
        else this.fehler = 'Verbindung unterbrochen …';
      },
    });
  }

  private uebernehmen(neu: BuehnenStand): void {
    const alt = this.stand;
    this.timerPruefen(neu);
    this.punktePruefen(alt, neu);
    this.klaenge(neu);
    this.siegerPruefen(alt, neu);
    this.ambientePruefen(neu.phase === 'frage' && neu.schritt >= 7 ? 3500 : 300);
  }

  /** Punkte geändert → alle Balken wackeln unabhängig (niemand sieht, wer den Punkt bekam); nächste Frage → wieder klein */
  private punktePruefen(alt: BuehnenStand | undefined, neu: BuehnenStand): void {
    if (!alt) return;
    const summe = (s: BuehnenStand) => s.gruppen.reduce((n, g) => n + g.punkte, 0) + s.gruppen.length * 1000;
    const weiter = alt.phase !== neu.phase || alt.index !== neu.index || alt.runde !== neu.runde || (neu.phase === 'frage' && neu.schritt < alt.schritt) || (neu.phase === 'frage' && neu.schritt === 0);
    if (summe(alt) !== summe(neu)) {
      this.wackelStart(neu.gruppen.length);
    } else if (weiter && this.wackeln) {
      this.wackelStopp();
    }
  }

  private wackelStart(anzahl: number): void {
    const neueHoehen = () => (this.wackelHoehen = Array.from({ length: anzahl }, () => 25 + Math.random() * 75));
    neueHoehen();
    this.wackeln = true;
    if (this.wackelTimer) clearInterval(this.wackelTimer);
    let n = 0;
    this.wackelTimer = setInterval(() => this.zone.run(() => {
      neueHoehen();
      // nach ~3 s ruhiger: Balken bleiben stehen (ungefähr), bis die nächste Frage kommt
      if (++n >= 8 && this.wackelTimer) { clearInterval(this.wackelTimer); this.wackelTimer = undefined; }
    }), 380);
  }

  private wackelStopp(): void {
    if (this.wackelTimer) clearInterval(this.wackelTimer);
    this.wackelTimer = undefined;
    this.wackeln = false;
  }

  /** Siegerehrung starten, wenn das Ende erreicht oder „Gewinner anzeigen“ gedrückt wurde */
  private siegerPruefen(alt: BuehnenStand | undefined, neu: BuehnenStand): void {
    if (neu.phase !== 'ende') {
      if (this.siegerTimer) clearTimeout(this.siegerTimer);
      this.siegerLeuchtet = null;
      this.siegerFertig = false;
      return;
    }
    const neuGestartet = !alt || alt.phase !== 'ende' || alt.siegerNr !== neu.siegerNr;
    if (!neuGestartet) return;
    if (!alt) { this.siegerFertig = true; this.siegerText = this.siegerName(neu); return; } // Seite neu geladen
    this.wackelStopp();
    this.ton.alleStopp();
    this.siegerAnimation(neu);
  }

  private siegerName(s: BuehnenStand): string {
    const max = Math.max(...s.gruppen.map(g => g.punkte));
    const vorn = s.gruppen.filter(g => g.punkte === max);
    if (max <= 0) return 'Unentschieden!';
    return vorn.length > 1 ? `Gleichstand: ${vorn.map(g => g.name).join(' & ')}` : `${vorn[0].name} gewinnt!`;
  }

  private siegerAnimation(s: BuehnenStand): void {
    if (this.siegerTimer) clearTimeout(this.siegerTimer);
    const anzahl = s.gruppen.length;
    const max = Math.max(...s.gruppen.map(g => g.punkte));
    const ziel = Math.max(0, s.gruppen.findIndex(g => g.punkte === max));
    this.siegerFertig = false;
    this.siegerText = this.siegerName(s);
    const schritte = anzahl * 4 + ziel; // vier Runden über alle Balken, dann bis zum Gewinner
    let nr = 0;
    let pause = 70;
    const weiter = () => this.zone.run(() => {
      this.siegerLeuchtet = nr % anzahl;
      this.ton.klack(nr === schritte);
      if (nr >= schritte) {
        this.siegerTimer = setTimeout(() => this.zone.run(() => {
          this.siegerLeuchtet = null;
          this.siegerFertig = true;
          this.ton.richtig();
          this.ton.fanfare();
          this.ambientePruefen(4000);
        }), 600);
        return;
      }
      nr++;
      pause = nr < schritte - 7 ? pause * 1.04 : pause * 1.3;
      this.siegerTimer = setTimeout(weiter, pause);
    });
    // kurze Pause mit „Und gewonnen hat …“, dann geht das Licht los
    this.siegerTimer = setTimeout(weiter, 1200);
  }

  /** Hintergrund nur, wenn gerade kein Fragen-Sound läuft: Startbild, Zusatzrunde, nach der Auflösung, Ende. */
  private ambientePruefen(verzoegerung: number): void {
    if (this.ambienteTimer) clearTimeout(this.ambienteTimer);
    const s = this.stand;
    const ruhig = !!s && s.ton && s.hintergrund && !(s.phase === 'frage' && s.schritt <= 6) && this.countdown === null
      && !(s.phase === 'ende' && !this.siegerFertig);
    if (!ruhig) { this.ton.ambienteStopp(); return; }
    if (this.ton.ambienteLaeuft) return;
    this.ambienteTimer = setTimeout(() => {
      const t = this.stand;
      if (t && t.ton && t.hintergrund && !(t.phase === 'frage' && t.schritt <= 6) && this.countdown === null && this.leuchtet === null) this.ton.ambienteStart();
    }, verzoegerung);
  }

  /** Neuer Timer vom Tablet → Countdown starten (Restzeit vom Server, damit Uhrzeiten egal sind) */
  private timerPruefen(neu: BuehnenStand): void {
    const t = neu.timer;
    if (!t) {
      if (this.countdown !== null && !this.zeitAus) this.countdownStopp();
      return;
    }
    if (t.id === this.timerId) return;
    this.timerId = t.id;
    const ende = Date.now() + t.restMs;
    this.zeitAus = false;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.ton.ambienteStopp();
    let letzte = -1;
    const takt = () => this.zone.run(() => {
      const rest = Math.ceil((ende - Date.now()) / 1000);
      if (rest <= 0) {
        clearInterval(this.countdownTimer);
        this.countdown = 0;
        this.zeitAus = true;
        this.ton.zeitAus();
        setTimeout(() => this.zone.run(() => { this.countdownStopp(); this.ambientePruefen(500); }), 1800);
        return;
      }
      if (rest !== letzte) { letzte = rest; this.countdown = rest; this.ton.countdownTick(rest); }
    });
    takt();
    this.countdownTimer = setInterval(takt, 100);
  }

  private countdownStopp(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdown = null;
    this.zeitAus = false;
  }

  private klaenge(neu: BuehnenStand): void {
    const alt = this.stand;
    this.stand = neu;
    this.ton.an = neu.ton;
    if (!neu.ton) this.ton.alleStopp();
    if (!alt) {
      this.geloest = neu.phase === 'frage' && neu.schritt >= 7;
      return;
    }

    const gleicheFrage = alt.phase === 'frage' && neu.phase === 'frage' && alt.index === neu.index && alt.runde === neu.runde;
    const vorwaerts = gleicheFrage && neu.schritt === alt.schritt + 1;

    // Auflösung zurücksetzen, wenn wir nicht (mehr) bei Schritt 7 sind
    if (!(neu.phase === 'frage' && neu.schritt >= 7)) { this.geloest = false; this.umlaufStopp(); }

    if (neu.phase === 'runde' && alt.phase !== 'runde') { this.ton.fanfare(); return; }
    if (neu.phase === 'ende') return; // Klänge macht die Siegerehrung
    if (neu.phase !== 'frage') { this.ton.alleStopp(); return; }

    if (!gleicheFrage) {
      this.ton.spannungStop();
      if (neu.schritt === 0) this.ton.eroeffnung(neu.runde === 'final');
      else if (neu.schritt <= 5) this.ton.tickStart();
      this.geloest = neu.schritt >= 7;
      return;
    }

    if (vorwaerts) {
      if (neu.schritt === 1) this.ton.tickStart();
      else if (neu.schritt >= 2 && neu.schritt <= 5) { this.ton.einblenden(); this.ton.tickStart(); }
      else if (neu.schritt === 6) this.ton.spannung();
      else if (neu.schritt === 7) this.umlauf();
      return;
    }

    // Rückwärts oder gesprungen innerhalb der Frage
    this.ton.spannungStop();
    if (neu.schritt >= 1 && neu.schritt <= 5) this.ton.tickStart();
    else this.ton.tickStop();
    this.geloest = neu.schritt >= 7;
  }

  /** Licht läuft im Kreis um die Antworten, wird langsamer und bleibt auf der richtigen stehen. */
  private umlauf(): void {
    const richtig = this.stand?.frage?.richtig;
    if (richtig === null || richtig === undefined) { this.geloest = true; return; }
    this.ton.spannungStop();
    this.ton.tickStop();
    const reihenfolge = [0, 1, 3, 2]; // im Kreis: A → B → D → C (2×2-Raster)
    const ziel = reihenfolge.indexOf(richtig);
    const schritte = 4 * 3 + ziel; // drei Runden, dann bis zur richtigen
    let nr = 0;
    let pause = 60;
    const weiter = () => {
      this.zone.run(() => {
        this.leuchtet = reihenfolge[nr % 4];
        this.ton.klack(nr === schritte);
        if (nr >= schritte) {
          this.umlaufTimer = setTimeout(() => this.zone.run(() => {
            this.leuchtet = null;
            this.geloest = true;
            this.ton.richtig();
          }), 450);
          return;
        }
        nr++;
        // erst schnell, zum Ende deutlich langsamer
        pause = nr < schritte - 6 ? pause * 1.06 : pause * 1.32;
        this.umlaufTimer = setTimeout(weiter, pause);
      });
    };
    this.geloest = false;
    weiter();
  }

  private umlaufStopp(): void {
    if (this.umlaufTimer) clearTimeout(this.umlaufTimer);
    this.umlaufTimer = undefined;
    this.leuchtet = null;
  }

  bild(id: string): string {
    return this.api.bildUrl(id);
  }

  /** Balkenhöhe relativ zur führenden Gruppe (mind. ein Strich, damit 0 sichtbar bleibt) */
  hoehe(punkte: number): number {
    const max = Math.max(1, ...(this.stand?.gruppen ?? []).map(g => g.punkte));
    return Math.max(4, (punkte / max) * 100);
  }

  istVorn(punkte: number): boolean {
    const max = Math.max(...(this.stand?.gruppen ?? []).map(g => g.punkte));
    return max > 0 && punkte === max;
  }

  antwortKlasse(i: number): Record<string, boolean> {
    const s = this.stand!;
    const sichtbar = s.frage?.antworten[i] !== null;
    return {
      sichtbar,
      leuchtet: this.leuchtet === i,
      richtig: this.geloest && s.frage?.richtig === i,
      blass: this.geloest && s.frage?.richtig !== i,
    };
  }
}
