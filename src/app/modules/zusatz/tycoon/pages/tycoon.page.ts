import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { startTycoon, TycoonHandle } from '../tycoon-engine';
import { TycoonAnsicht, TycoonApiService, TycoonEintrag } from '../tycoon-api.service';

@Component({
  selector: 'app-tycoon',
  templateUrl: './tycoon.page.html',
  styleUrls: ['./tycoon.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class TycoonPage implements AfterViewInit, OnDestroy {
  @ViewChild('gameRoot') gameRoot!: ElementRef<HTMLElement>;

  tab: 'spiel' | 'rangliste' = 'spiel';
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

  private handle: TycoonHandle | null = null;
  private pending: unknown | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(private readonly api: TycoonApiService, private readonly route: ActivatedRoute) {}

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
    this.handle?.destroy();
    this.flush();
  }

  private starte(state: unknown, readOnly: boolean): void {
    if (this.destroyed) return;
    this.handle = startTycoon(this.gameRoot.nativeElement, {
      state,
      readOnly,
      onSave: data => this.queueSave(data),
      onReset: () => {
        this.pending = null;
        if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
        this.api.zuruecksetzen().subscribe({ error: () => (this.status = 'Zurücksetzen fehlgeschlagen') });
        this.geteilt = false;
        this.besucher = 0;
      },
    });
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

  wechsle(t: 'spiel' | 'rangliste'): void {
    this.tab = t;
    if (t === 'rangliste') this.ladeRangliste();
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
