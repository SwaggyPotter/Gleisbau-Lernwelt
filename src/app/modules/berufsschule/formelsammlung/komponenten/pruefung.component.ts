import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Aufgabe, AufgabenModus, MiniAppDef, Stufe } from '../kern/typen';
import { appMeta } from '../kern/daten';
import { fmt, randChoice } from '../kern/zahlen';
import { Antwort } from './aufgabe.component';
import { FormelFortschrittService } from './fortschritt.service';

interface Eintrag { aufgabe: Aufgabe; antwort: Antwort | null; offen: boolean }

/** Prüfungsmodus: gemischte Aufgaben auf Zeit, ohne Formel und Hilfe, mit Auswertung am Ende. */
@Component({
  selector: 'fs-pruefung',
  standalone: false,
  template: `
<!-- Laufende Prüfung: großes Schmierblatt, Antwort unten in der Ergebnis-Leiste, Angabe + Uhr unter dem Rechner -->
<fs-schmierblatt *ngIf="phase === 'laufen'" [aufgabe]="aktuell" [formelnErlaubt]="false" [(rechnerAn)]="rechnerAn" [seiteAn]="true" [aufgabeZiehbar]="true">
  <section fs-ergebnis class="fs-ergebnis-leiste" [class.offen]="ergebnisOffen">
    <button type="button" class="fs-ergebnis-kopf" (click)="ergebnisOffen = !ergebnisOffen" [attr.aria-expanded]="ergebnisOffen">
      <span>Antwort eintragen <small class="stand">Aufgabe {{ index + 1 }} / {{ eintraege.length }}</small></span>
      <span class="pfeil">▲</span>
    </button>
    <div class="fs-ergebnis-body">
      <fs-aufgabe [aufgabe]="aktuell" [pruefung]="true" [kompakt]="true" (beantwortet)="antwort($event)"></fs-aufgabe>
      <div class="fs-aktionen">
        <button type="button" class="fs-knopf" (click)="ueberspringen()">Überspringen</button>
        <button type="button" class="fs-knopf" (click)="beenden()">Abgeben</button>
        <button type="button" class="fs-knopf" (click)="ergebnisOffen = false">Einklappen ▼</button>
      </div>
    </div>
  </section>

  <div fs-seite class="fs-seite">
    <div class="fs-pruef-kopf">
      <span>Aufgabe {{ index + 1 }} / {{ eintraege.length }}</span>
      <span class="fs-uhr" [class.knapp]="rest <= 60">⏱ {{ uhr }}</span>
    </div>
    <div class="fs-balken"><span [style.width.%]="(index / eintraege.length) * 100"></span></div>
    <section class="fs-seite-karte">
      <p class="fs-seite-titel">Aufgabe <small *ngIf="apps.length > 1">{{ appTitel(aktuell.appId) }}</small></p>
      <p class="fs-text" *ngIf="aktuell.text">{{ aktuell.text }}</p>
      <ul class="fs-seite-gegeben" *ngIf="aktuell.gegeben.length">
        <li *ngFor="let g of aktuell.gegeben"><fs-formel [tex]="g.sym"></fs-formel> = <strong>{{ zahl(g.wert, g.nk) }}</strong> {{ g.einheit }} <small>{{ g.name }}</small></li>
      </ul>
      <p class="fs-frage">{{ aktuell.frage }}</p>
    </section>
    <p class="fs-hinweis-klein">Keine Formel, kein Tipp – Rückmeldung erst bei der Auswertung.</p>
  </div>
</fs-schmierblatt>

<section class="fs-karte" *ngIf="phase !== 'laufen'">
  <ng-container *ngIf="phase === 'start'">
    <h3 class="fs-h3">{{ titel }}</h3>
    <p>{{ anzahl }} gemischte Aufgaben (Üben, Umstellen, Einheiten-Falle), {{ minuten }} Minuten Zeit.
       Keine Formel, kein Tipp, keine Rückmeldung bis zum Schluss – wie in der Prüfung. Schmierblatt und Taschenrechner stehen bereit, deine Formelsammlung aus dem Unterricht darfst du nehmen.</p>
    <p *ngIf="bestwert >= 0" class="fs-hinweis-klein">Dein bisher bestes Ergebnis: {{ bestwert }} %</p>
    <button type="button" class="fs-knopf haupt" (click)="starten()">Prüfung starten</button>
  </ng-container>

  <ng-container *ngIf="phase === 'auswertung'">
    <h3 class="fs-h3">Auswertung: {{ richtig }} von {{ eintraege.length }} richtig ({{ prozent }} %)</h3>
    <p class="fs-note" [class.ok]="prozent >= 80" [class.nok]="prozent < 50">
      {{ prozent >= 80 ? 'Stark – das sitzt!' : prozent >= 50 ? 'Bestanden, aber da geht noch was. Schau dir die falschen Aufgaben an.' : 'Noch nicht sicher – übe die Themen mit den roten Aufgaben noch einmal.' }}
    </p>
    <p class="fs-hinweis-klein" *ngIf="zeitAbgelaufen">Die Zeit ist abgelaufen – offene Aufgaben zählen als falsch.</p>
    <ol class="fs-auswertung">
      <li *ngFor="let e of eintraege" [class.ok]="e.antwort?.richtig" [class.nok]="!e.antwort?.richtig">
        <button type="button" class="fs-auswertung-kopf" (click)="e.offen = !e.offen">
          <span>{{ e.antwort?.richtig ? '✓' : '✕' }}</span>
          <span class="fs-auswertung-frage">{{ e.aufgabe.text || e.aufgabe.frage }}</span>
          <span class="fs-auswertung-mehr">{{ e.offen ? '▲' : '▼' }}</span>
        </button>
        <div *ngIf="e.offen" class="fs-auswertung-detail">
          <p>{{ e.aufgabe.frage }}</p>
          <p>Deine Antwort: <strong>{{ e.antwort ? anzeige(e.antwort.eingabe) : '—' }}</strong> {{ e.aufgabe.art === 'zahl' ? e.aufgabe.gesucht.einheit : '' }}
             · Lösung: <strong>{{ loesung(e.aufgabe) }}</strong></p>
          <div class="fs-formelbox"><fs-formel [tex]="e.aufgabe.formelLatex" [block]="true"></fs-formel></div>
          <ol class="fs-schritte">
            <li *ngFor="let s of e.aufgabe.schritte">
              <span *ngIf="s.text">{{ s.text }}</span>
              <fs-formel *ngIf="s.latex" [tex]="s.latex" [block]="true"></fs-formel>
            </li>
          </ol>
        </div>
      </li>
    </ol>
    <button type="button" class="fs-knopf haupt" (click)="starten()">Neue Prüfung</button>
  </ng-container>
</section>`,
})
export class PruefungComponent implements OnDestroy {
  @Input({ required: true }) apps: MiniAppDef[] = [];
  @Input() anzahl = 8;
  @Input() minuten = 12;
  @Input() titel = 'Prüfungsmodus';
  @Input() bestwert = -1;
  @Output() fertig = new EventEmitter<number>();

  constructor(private readonly fs: FormelFortschrittService) {}

  phase: 'start' | 'laufen' | 'auswertung' = 'start';
  rechnerAn = true;
  ergebnisOffen = false;

  get aktuell(): Aufgabe {
    return this.eintraege[this.index].aufgabe;
  }

  zahl(w: number, nk: number): string {
    return fmt(w, nk);
  }
  eintraege: Eintrag[] = [];
  index = 0;
  rest = 0;
  zeitAbgelaufen = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  get uhr(): string {
    const m = Math.floor(this.rest / 60);
    const s = this.rest % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get richtig(): number {
    return this.eintraege.filter(e => e.antwort?.richtig).length;
  }

  get prozent(): number {
    return this.eintraege.length ? Math.round((this.richtig / this.eintraege.length) * 100) : 0;
  }

  appTitel(id: string): string {
    return appMeta(id)?.titel ?? id;
  }

  anzeige(t: string): string {
    return t;
  }

  loesung(a: Aufgabe): string {
    return a.art === 'zahl' ? `${fmt(a.loesung, a.nk)} ${a.gesucht.einheit}` : a.optionen[a.richtig];
  }

  starten(): void {
    const plan: { modus: AufgabenModus; stufe: Stufe }[] = [];
    for (let i = 0; i < this.anzahl; i++) {
      // Mischung: gut die Hälfte Üben (Stufe 2/3), Rest Umstellen und Einheiten-Falle.
      const z = i % 4;
      plan.push(z < 2 ? { modus: 'ueben', stufe: randChoice([2, 3] as const) } : z === 2 ? { modus: 'umstellen', stufe: 2 } : { modus: 'einheiten', stufe: 2 });
    }
    this.eintraege = plan
      .map((p, i) => ({ aufgabe: this.apps[i % this.apps.length].generiere(p.modus, p.stufe), antwort: null, offen: false }))
      .sort(() => Math.random() - 0.5);
    this.index = 0;
    this.ergebnisOffen = false;
    this.rest = this.minuten * 60;
    this.zeitAbgelaufen = false;
    this.phase = 'laufen';
    this.stopp();
    this.timer = setInterval(() => {
      this.rest -= 1;
      if (this.rest <= 0) {
        this.zeitAbgelaufen = true;
        this.beenden();
      }
    }, 1000);
  }

  antwort(a: Antwort): void {
    this.eintraege[this.index].antwort = a;
    this.weiter();
  }

  ueberspringen(): void {
    this.weiter();
  }

  private weiter(): void {
    if (this.index + 1 >= this.eintraege.length) {
      this.beenden();
    } else {
      this.index += 1;
      this.ergebnisOffen = false;
    }
  }

  beenden(): void {
    this.stopp();
    if (this.phase !== 'laufen') return;
    this.phase = 'auswertung';
    for (const e of this.eintraege) e.offen = !e.antwort?.richtig && this.eintraege.length <= 3;
    // Beantwortete Prüfungsaufgaben zählen für die Sterne (gemischte Prüfung: eigene Kachel)
    for (const e of this.eintraege) if (e.antwort) this.fs.melde(this.apps.length > 1 ? 'gemischt' : e.aufgabe.appId, e.antwort.richtig);
    this.fertig.emit(this.prozent);
  }

  private stopp(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  ngOnDestroy(): void {
    this.stopp();
  }
}
