import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { MODELLE, ModellEintrag, ModellKategorie } from '../shared/engine3d/modell-katalog';
import type { Engine3D } from '../shared/engine3d/engine3d';

@Component({
  selector: 'app-modelle',
  templateUrl: './modelle.page.html',
  styleUrls: ['./modelle.page.scss'],
  standalone: false,
})
export class ModellePage implements AfterViewInit, OnDestroy {
  @ViewChild('leinwand', { static: true }) leinwand!: ElementRef<HTMLCanvasElement>;

  readonly kategorien: ('Alle' | ModellKategorie)[] = ['Alle', 'Lok', 'Wagen', 'Gleis', 'Gebäude'];
  kategorie: 'Alle' | ModellKategorie = 'Lok';
  ausgewaehlt: ModellEintrag | null = null;
  diorama = false;
  drehen = true;
  laedt = true;
  fehler = '';

  private engine: Engine3D | null = null;
  private startet = false;

  constructor(private readonly zone: NgZone) {}

  get liste(): ModellEintrag[] {
    return MODELLE.filter((m) => this.kategorie === 'Alle' || m.kategorie === this.kategorie);
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.startet) return;
    this.startet = true;
    try {
      // Engine erst hier laden: Babylon.js steckt dadurch nur in diesem Lazy-Chunk.
      const { Engine3D } = await import('../shared/engine3d/engine3d');
      this.zone.runOutsideAngular(() => {
        this.engine = new Engine3D(this.leinwand.nativeElement);
      });
      await this.waehle(MODELLE[0]);
    } catch (e) {
      console.error('3D-Start fehlgeschlagen', e);
      this.fehler = '3D konnte nicht gestartet werden (WebGL nicht verfügbar?).';
      this.laedt = false;
    }
  }

  async waehle(m: ModellEintrag): Promise<void> {
    if (!this.engine) return;
    this.diorama = false;
    this.ausgewaehlt = m;
    await this.zeige(() => this.engine!.zeigeModell(m.datei, this.drehen));
  }

  async zeigeDiorama(): Promise<void> {
    if (!this.engine) return;
    this.diorama = true;
    this.ausgewaehlt = null;
    const k = 'assets/modelle/kenney/';
    await this.zeige(() =>
      this.engine!.zeigeDiorama(k + 'railroad-straight.glb', k + 'train-locomotive-a.glb', [
        k + 'train-carriage-coal.glb',
        k + 'train-carriage-container-red.glb',
        k + 'train-carriage-box.glb',
      ]),
    );
  }

  toggleDrehen(): void {
    this.drehen = !this.drehen;
    this.engine?.setzeAutoDrehen(this.drehen && !this.diorama);
  }

  private async zeige(fn: () => Promise<unknown>): Promise<void> {
    this.laedt = true;
    this.fehler = '';
    try {
      await this.zone.runOutsideAngular(fn);
    } catch (e) {
      console.error('Modell laden fehlgeschlagen', e);
      this.fehler = 'Modell konnte nicht geladen werden.';
    }
    this.laedt = false;
  }

  ionViewWillLeave(): void {
    this.aufraeumen();
  }

  ngOnDestroy(): void {
    this.aufraeumen();
  }

  private aufraeumen(): void {
    this.engine?.zerstoeren();
    this.engine = null;
    this.startet = false;
  }

  ionViewWillEnter(): void {
    // Nach ionViewWillLeave (Seite bleibt im Stack) die Engine neu starten.
    if (!this.startet && this.leinwand) void this.ngAfterViewInit();
  }
}
