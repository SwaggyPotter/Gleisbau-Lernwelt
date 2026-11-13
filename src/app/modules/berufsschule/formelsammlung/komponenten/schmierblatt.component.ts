import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild,
} from '@angular/core';
import { Schmierblatt, starteSchmierblatt } from '../../../../shared/schmierblatt/schmierblatt';
import { skizzenVarianten } from '../apps';
import { Formel, formel } from '../kern/daten';
import { Aufgabe, MiniAppDef } from '../kern/typen';
import { fmt } from '../kern/zahlen';

interface LeistenEintrag {
  art: 'formel' | 'skizze' | 'aufgabe';
  titel: string;
  formel?: Formel;
  variante?: string;
}

interface Zug {
  eintrag: LeistenEintrag;
  quelle: HTMLElement;
  id: number;
  sx: number;
  sy: number;
  touch: boolean;
  aktiv: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  geist: HTMLElement | null;
}

/**
 * Arbeitsplatz beim Üben (Tim, 2026-11-07, ausgebaut 2026-11-09):
 * links das Schmierblatt (dasselbe Whiteboard wie bei Prozent-/Volumen-/Schotterberechnung, src/app/shared/schmierblatt),
 * rechts daneben der Taschenrechner (abschaltbar → mehr Zeichenfläche).
 * „∑ Formeln & Skizzen“ öffnet eine Leiste über dem Blatt: antippen = Karte unter die Aufgabe legen,
 * gedrückt halten bzw. mit der Maus ziehen = Karte genau an die Stelle legen (wie die Schotter-Tabelle).
 * Die gegebenen Werte stehen fest oben auf dem Blatt; bei einer neuen Aufgabe wird das Blatt geleert.
 */
@Component({
  selector: 'fs-schmierblatt',
  standalone: false,
  template: `
<div class="fs-platz smb-root" #rahmen [class.mit-rechner]="rechnerAn">
  <div class="fs-blatt-tools">
    <button type="button" class="btn small primary" *ngIf="neuKnopf" (click)="neueAufgabe.emit()" title="Neue Aufgabe">Neue Aufgabe ↻</button>
    <select class="btn small fs-stufe-wahl" *ngIf="stufen?.length" [ngModel]="stufe" (ngModelChange)="stufeChange.emit($event)" aria-label="Schwierigkeit">
      <option *ngFor="let s of stufen" [ngValue]="s">Stufe {{ s }} – {{ s === 1 ? 'leicht' : s === 2 ? 'mittel' : 'schwer' }}</option>
    </select>
    <span class="sep" *ngIf="neuKnopf || stufen?.length"></span>
    <button type="button" class="btn small fs-leisten-knopf" *ngIf="aufgabeZiehbar" [class.tool-an]="leisteOffen && tab === 'aufgabe'" (click)="leisteUmschalten('aufgabe')"
            title="Aufgabe anzeigen und aufs Blatt ziehen">📄 Aufgabe</button>
    <button type="button" class="btn small fs-leisten-knopf" *ngIf="formelnErlaubt && app" [class.tool-an]="leisteOffen && tab !== 'aufgabe'" (click)="leisteUmschalten('formeln')"
            title="Formeln und Skizzen anzeigen und aufs Blatt ziehen">∑ Formeln &amp; Skizzen</button>
    <button type="button" class="btn small" *ngIf="seiteKlappbar" [class.tool-an]="seiteOffen" (click)="seiteUmschalten()"
            [title]="seiteOffen ? 'Rechner und Aufgabe einklappen (mehr Platz zum Zeichnen)' : 'Rechner und Aufgabe ausklappen'"
            [attr.aria-label]="seiteOffen ? 'Rechner einklappen' : 'Rechner ausklappen'">🧮 {{ seiteOffen ? '▶' : '◀' }}</button>
    <button type="button" class="btn small" *ngIf="!seiteKlappbar" [class.tool-an]="rechnerAn" (click)="rechnerUmschalten()"
            [title]="rechnerAn ? 'Taschenrechner ausblenden (mehr Platz zum Zeichnen)' : 'Taschenrechner neben dem Blatt einblenden'">🧮 Rechner</button>
    <span class="sep"></span>
    <span class="smb-werkzeuge" #werkzeuge></span>
  </div>

  <div class="fs-platz-mitte">
   <div class="fs-blatt-spalte">
    <div class="fs-blatt-bereich">
      <div class="fs-blatt-flaeche" #flaeche [class.ziel]="ueberBlatt">
        <div class="aufgabe-blatt">
          <span class="fs-blatt-wert" *ngFor="let g of aufgabe.gegeben"><fs-formel [tex]="g.sym"></fs-formel> = {{ wert(g.wert, g.nk) }} {{ g.einheit }}<small *ngIf="zusatz(g.name) as z" class="fs-blatt-zusatz"> {{ z }}</small></span>
          <span class="fs-blatt-wert gesucht" *ngIf="aufgabe.art === 'zahl'">gesucht: <fs-formel [tex]="aufgabe.gesucht.sym"></fs-formel> in {{ aufgabe.gesucht.einheit }}</span>
        </div>
      </div>

      <aside class="fs-leiste" *ngIf="leisteOffen && (app || aufgabeZiehbar)" #leiste [class.zieht]="zug?.aktiv" (touchmove)="touchBewegt($event)">
        <div class="fs-leiste-kopf">
          <div class="fs-leiste-tabs" role="tablist">
            <button type="button" role="tab" *ngIf="aufgabeZiehbar" [class.aktiv]="tab === 'aufgabe'" (click)="tab = 'aufgabe'">Aufgabe</button>
            <ng-container *ngIf="formelnErlaubt && app">
              <button type="button" role="tab" [class.aktiv]="tab === 'formeln'" (click)="tab = 'formeln'">Formeln</button>
              <button type="button" role="tab" [class.aktiv]="tab === 'skizzen'" (click)="tab = 'skizzen'">Skizzen</button>
            </ng-container>
          </div>
          <button type="button" class="fs-leiste-zu" (click)="leisteOffen = false" aria-label="Leiste schließen">✕</button>
        </div>
        <p class="fs-leiste-hinweis">Antippen = aufs Blatt legen · gedrückt halten oder mit der Maus ziehen = an eine Stelle legen</p>
        <div class="fs-leiste-liste">
          <!-- Aufgabe als Karte zum Rüberziehen (Tim, 2026-11-11) -->
          <div class="fs-leiste-eintrag fs-leiste-aufgabe" *ngIf="tab === 'aufgabe'" (pointerdown)="ziehStart($event, aufgabeEintrag)" (contextmenu)="$event.preventDefault()">
            <span class="fs-leiste-titel">⠿ Aufgabe</span>
            <div class="fs-leiste-inhalt">
              <p class="fs-karte-text" *ngIf="aufgabe.text">{{ aufgabe.text }}</p>
              <ul class="fs-karte-gegeben" *ngIf="aufgabe.gegeben.length">
                <li *ngFor="let g of aufgabe.gegeben"><fs-formel [tex]="g.sym"></fs-formel> = <strong>{{ wert(g.wert, g.nk) }}</strong> {{ g.einheit }} <small>{{ g.name }}</small></li>
              </ul>
              <p class="fs-karte-frage"><strong>{{ aufgabe.frage }}</strong></p>
            </div>
          </div>
          <ng-container *ngFor="let e of (tab === 'formeln' ? formelEintraege : tab === 'skizzen' ? skizzenEintraege : [])">
            <div class="fs-leiste-eintrag" [class.unklar]="e.formel?.status === 'unklar'"
                 (pointerdown)="ziehStart($event, e)" (contextmenu)="$event.preventDefault()">
              <span class="fs-leiste-titel">⠿ {{ e.titel }}<span *ngIf="e.formel?.status === 'unklar'" class="fs-badge">❓ unklar</span></span>
              <div class="fs-leiste-inhalt" *ngIf="e.art === 'formel' && e.formel"><fs-formel [tex]="e.formel.latex" [block]="true"></fs-formel></div>
              <div class="fs-leiste-inhalt skizze" *ngIf="e.art === 'skizze' && app"><fs-skizze [typ]="app.skizze" [variante]="e.variante ?? ''"></fs-skizze></div>
            </div>
          </ng-container>
        </div>
      </aside>
    </div>
    <!-- Ergebnis-Leiste unten am Blatt (wie Schotterberechnung) -->
    <ng-content select="[fs-ergebnis]"></ng-content>
   </div>

    <aside class="fs-platz-rechner" [hidden]="seiteKlappbar ? !seiteOffen : (!rechnerAn && !seiteAn)">
      <fs-taschenrechner *ngIf="rechnerAn"></fs-taschenrechner>
      <!-- Aufgabe, Skizze, Statistik unter dem Rechner -->
      <ng-content select="[fs-seite]"></ng-content>
    </aside>
  </div>
</div>`,
})
export class SchmierblattComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) aufgabe!: Aufgabe;
  /** App für die Formel-/Skizzen-Leiste (ohne App: keine Leiste, z. B. gemischte Prüfung). */
  @Input() app?: MiniAppDef;
  /** Im Prüfungsmodus aus: keine Formeln. */
  @Input() formelnErlaubt = true;
  @Input() rechnerAn = true;
  @Output() rechnerAnChange = new EventEmitter<boolean>();
  /** „Neue Aufgabe ↻“ in der Werkzeugleiste */
  @Input() neuKnopf = false;
  @Output() neueAufgabe = new EventEmitter<void>();
  /** Stufenwahl in der Werkzeugleiste (leer = keine) */
  @Input() stufen?: number[];
  @Input() stufe?: number;
  @Output() stufeChange = new EventEmitter<number>();
  /** Seitenspalte auch ohne Rechner zeigen (für projizierten Inhalt [fs-seite]) */
  @Input() seiteAn = false;
  /** Aufgabe (Text, Werte, Frage) lässt sich wie eine Formel aufs Blatt ziehen */
  @Input() aufgabeZiehbar = false;
  /** Rechte Spalte (Rechner + Aufgabe) nur per 🧮 ausklappbar (Tim, 2026-11-11) */
  @Input() seiteKlappbar = false;
  @Input() seiteOffen = false;
  @Output() seiteOffenChange = new EventEmitter<boolean>();
  readonly aufgabeEintrag: LeistenEintrag = { art: 'aufgabe', titel: 'Aufgabe' };

  @ViewChild('rahmen', { static: true }) rahmen!: ElementRef<HTMLElement>;
  @ViewChild('werkzeuge', { static: true }) werkzeuge!: ElementRef<HTMLElement>;
  @ViewChild('flaeche', { static: true }) flaeche!: ElementRef<HTMLElement>;

  leisteOffen = false;
  tab: 'formeln' | 'skizzen' | 'aufgabe' = 'formeln';
  formelEintraege: LeistenEintrag[] = [];
  skizzenEintraege: LeistenEintrag[] = [];
  zug: Zug | null = null;
  ueberBlatt = false;

  private blatt?: Schmierblatt;
  private readonly bewegen = (e: PointerEvent) => this.ziehBewegt(e);
  private readonly loslassen = (e: PointerEvent) => this.ziehEnde(e, false);
  private readonly abbrechen = (e: PointerEvent) => this.ziehEnde(e, true);

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    const rahmen = this.rahmen.nativeElement;
    this.zone.runOutsideAngular(() => {
      this.blatt = starteSchmierblatt({
        flaeche: this.flaeche.nativeElement,
        werkzeuge: this.werkzeuge.nativeElement,
        vollbildEl: rahmen,
        seite: rahmen.closest('app-fs-mini-app, app-fs-hub, app-schienendehnung') as HTMLElement | null,
      });
    });
  }

  ngOnChanges(c: SimpleChanges): void {
    if (c['aufgabe'] && !c['aufgabe'].firstChange) this.blatt?.leeren();
    // Neue Aufgabe bei eingeklappter Seite: Aufgabe gleich zum Lesen/Rüberziehen zeigen
    if (c['aufgabe'] && this.aufgabeZiehbar && this.seiteKlappbar && !this.seiteOffen) { this.tab = 'aufgabe'; this.leisteOffen = true; }
    if (c['app']) {
      const app = this.app;
      this.formelEintraege = app ? app.formelIds.map(id => formel(id)).map(f => ({ art: 'formel' as const, titel: f.titel, formel: f })) : [];
      this.skizzenEintraege = app ? skizzenVarianten(app).map(v => ({ art: 'skizze' as const, titel: v.titel, variante: v.variante })) : [];
    }
  }

  ngOnDestroy(): void {
    this.ziehAufraeumen();
    this.blatt?.vollbild(false);
    this.blatt?.zerstoeren();
  }

  wert(w: number, nk: number): string {
    return fmt(w, nk);
  }

  /** Zusatz hinter „ – “ im Namen (z. B. „Steigung“/„Gefälle“ bei Neigungen), damit die Richtung auf dem Blatt steht */
  zusatz(name: string): string {
    const i = name.lastIndexOf(' – ');
    return i >= 0 ? name.slice(i + 3) : '';
  }

  leisteUmschalten(ziel: 'aufgabe' | 'formeln'): void {
    const gleich = ziel === 'aufgabe' ? this.tab === 'aufgabe' : this.tab !== 'aufgabe';
    if (this.leisteOffen && gleich) { this.leisteOffen = false; return; }
    this.tab = ziel;
    this.leisteOffen = true;
  }

  seiteUmschalten(): void {
    this.seiteOffen = !this.seiteOffen;
    this.seiteOffenChange.emit(this.seiteOffen);
  }

  rechnerUmschalten(): void {
    this.rechnerAn = !this.rechnerAn;
    this.rechnerAnChange.emit(this.rechnerAn);
  }

  // ---------- Formel/Skizze aufs Blatt ----------

  private aufsBlatt(e: LeistenEintrag, quelle: HTMLElement, pos?: { x: number; y: number }): void {
    const inhalt = quelle.querySelector('.fs-leiste-inhalt')?.innerHTML ?? '';
    const titel = e.art === 'skizze' && e.titel !== 'Skizze' ? `Skizze: ${e.titel}` : e.titel;
    this.blatt?.karte(titel, inhalt, {
      clientX: pos?.x,
      clientY: pos?.y,
      klasse: e.art === 'skizze' ? 'karte-skizze' : e.art === 'aufgabe' ? 'karte-formel karte-aufgabe' : 'karte-formel',
    });
    this.leisteOffen = false;
    // Aufgabe liegt jetzt auf dem Blatt → rechte Seite einklappen, mehr Platz
    if (e.art === 'aufgabe' && this.seiteKlappbar && this.seiteOffen) this.seiteUmschalten();
  }

  ziehStart(ev: PointerEvent, eintrag: LeistenEintrag): void {
    if (ev.button > 0 || this.zug) return;
    const quelle = ev.currentTarget as HTMLElement;
    const touch = ev.pointerType === 'touch';
    this.zug = { eintrag, quelle, id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, touch, aktiv: false, timer: null, geist: null };
    if (touch) {
      // Finger: erst nach kurzem Halten ziehen, sonst scrollt man nur durch die Liste.
      this.zug.timer = setTimeout(() => this.ziehAktivieren(), 350);
    } else {
      ev.preventDefault();
    }
    window.addEventListener('pointermove', this.bewegen);
    window.addEventListener('pointerup', this.loslassen);
    window.addEventListener('pointercancel', this.abbrechen);
  }

  private ziehAktivieren(): void {
    const z = this.zug;
    if (!z || z.aktiv) return;
    z.timer = null;
    z.aktiv = true;
    const r = z.quelle.getBoundingClientRect();
    const geist = z.quelle.cloneNode(true) as HTMLElement;
    geist.classList.add('fs-leiste-geist');
    geist.style.width = Math.min(r.width, 340) + 'px';
    geist.style.left = z.sx + 'px';
    geist.style.top = z.sy + 'px';
    this.rahmen.nativeElement.appendChild(geist);
    z.geist = geist;
    if (navigator.vibrate) try { navigator.vibrate(15); } catch { /* egal */ }
  }

  private ziehBewegt(e: PointerEvent): void {
    const z = this.zug;
    if (!z || e.pointerId !== z.id) return;
    const weg = Math.hypot(e.clientX - z.sx, e.clientY - z.sy);
    if (!z.aktiv) {
      if (z.touch) {
        if (weg > 10) this.ziehAufraeumen(); // bewegt, bevor das Halten erkannt wurde → Liste scrollt
        return;
      }
      if (weg < 6) return;
      this.ziehAktivieren();
    }
    if (z.geist) {
      z.geist.style.left = e.clientX + 'px';
      z.geist.style.top = e.clientY + 'px';
    }
    this.ueberBlatt = this.ueberFreierFlaeche(e.clientX, e.clientY);
  }

  private ziehEnde(e: PointerEvent, abgebrochen: boolean): void {
    const z = this.zug;
    if (!z || e.pointerId !== z.id) return;
    if (!abgebrochen) {
      if (z.aktiv) {
        if (this.ueberFreierFlaeche(e.clientX, e.clientY)) this.aufsBlatt(z.eintrag, z.quelle, { x: e.clientX, y: e.clientY });
      } else if (Math.hypot(e.clientX - z.sx, e.clientY - z.sy) < 10) {
        this.aufsBlatt(z.eintrag, z.quelle); // nur angetippt
      }
    }
    this.ziehAufraeumen();
  }

  /** Während des Ziehens mit dem Finger darf die Liste nicht scrollen. */
  touchBewegt(e: TouchEvent): void {
    if (this.zug?.aktiv && e.cancelable) e.preventDefault();
  }

  /** Über dem Blatt, aber nicht über dem Rechner. (Die Leiste ist beim Ziehen durchlässig.) */
  private ueberFreierFlaeche(x: number, y: number): boolean {
    return !!this.blatt?.ueberFlaeche(x, y);
  }

  private ziehAufraeumen(): void {
    const z = this.zug;
    if (z?.timer) clearTimeout(z.timer);
    z?.geist?.remove();
    this.zug = null;
    this.ueberBlatt = false;
    window.removeEventListener('pointermove', this.bewegen);
    window.removeEventListener('pointerup', this.loslassen);
    window.removeEventListener('pointercancel', this.abbrechen);
  }
}
