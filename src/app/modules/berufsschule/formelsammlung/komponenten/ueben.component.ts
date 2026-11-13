import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Aufgabe, AufgabenModus, MiniAppDef, Stufe } from '../kern/typen';
import { AppFortschritt } from '../kern/fortschritt';
import { FormelFortschrittService } from './fortschritt.service';
import { Antwort } from './aufgabe.component';
import { Richtung, kuppeOderWanne } from '../kern/formeln';
import { fmt } from '../kern/zahlen';
import { aufgabeKontext } from './aufgabe.component';
import { AppStatusService } from '../../../../core/app-status/app-status.service';
import { alleAppTiles } from '../../../../shared/katalog';
import { QuestionReportService } from '../../../../services/question-report.service';

const HILFSMITTEL_SPEICHER = 'glw-formelsammlung-hilfsmittel';

const MODUS_TEXT: Record<AufgabenModus, string> = {
  ueben: 'Generierte Aufgaben – ab Stufe 2 als Textaufgabe aus dem Baustellenalltag.',
  umstellen: 'Gleiche Formel, aber eine andere Größe ist gesucht.',
  einheiten: 'Vorsicht: Die Werte stehen nicht in den Einheiten der Formel – erst umrechnen!',
};

/**
 * Üben / Umstellen / Einheiten-Falle (Umbau Tim, 2026-11-11, Vorbild Schotterberechnung):
 * großes Schmierblatt mit „Neue Aufgabe“ und Stufe in der Werkzeugleiste, Ergebnis wird unten
 * in der aufklappbaren Leiste eingetragen; Aufgabe, Skizze und Statistik stehen unter dem Rechner.
 */
@Component({
  selector: 'fs-ueben',
  standalone: false,
  template: `
<fs-schmierblatt [aufgabe]="aufgabe" [app]="app" [rechnerAn]="true" [aufgabeZiehbar]="true"
                 [seiteKlappbar]="true" [seiteOffen]="seiteOffen" (seiteOffenChange)="seiteGesetzt($event)"
                 [neuKnopf]="true" (neueAufgabe)="neu()" [stufen]="stufen" [stufe]="stufe" (stufeChange)="stufeSetzen($event)" [seiteAn]="true">

  <!-- Ergebnis unten am Blatt: aufklappen, eintragen, prüfen (wie Schotterberechnung) -->
  <section fs-ergebnis class="fs-ergebnis-leiste" [class.offen]="ergebnisOffen" [class.ok]="letzte?.richtig" [class.nok]="letzte && !letzte.richtig">
    <button type="button" class="fs-ergebnis-kopf" (click)="ergebnisUmschalten()" [attr.aria-expanded]="ergebnisOffen">
      <span>{{ !letzte ? 'Ergebnis eintragen' : letzte.richtig ? '✓ Richtig' : '✕ Leider falsch – Lösungsweg ansehen' }}
        <small class="stand" *ngIf="aufgabe.art === 'zahl' && !letzte">gesucht: {{ aufgabe.gesucht.name }} in {{ aufgabe.gesucht.einheit }}</small></span>
      <span class="pfeil">▲</span>
    </button>
    <div class="fs-ergebnis-body">
      <fs-aufgabe [aufgabe]="aufgabe" [kompakt]="true" (beantwortet)="antwort($event)"></fs-aufgabe>

      <!-- Testphase (gelb): nach jeder Aufgabe kurz bestätigen oder Problem melden -->
      <div class="fs-testphase" *ngIf="testphase && letzte">
        <ng-container [ngSwitch]="testStand">
          <ng-container *ngSwitchCase="'frage'">
            <p><strong>🟡 Testphase:</strong> Passt bei dieser Aufgabe alles – Werte, Formel, Lösung, Bewertung?</p>
            <div class="fs-testphase-knoepfe">
              <button type="button" class="fs-knopf" (click)="testStand = 'ok'">✓ Alles richtig</button>
              <button type="button" class="fs-knopf warn" (click)="testStand = 'melden'">⚑ Problem melden</button>
            </div>
          </ng-container>
          <ng-container *ngSwitchCase="'melden'">
            <p><strong>Was stimmt nicht?</strong> Aufgabe, Formel, Lösung der App und deine Eingabe ({{ letzte.eingabe }}) werden automatisch mitgeschickt.</p>
            <div class="fs-testphase-gruende">
              <button type="button" *ngFor="let g of gruende" class="fs-chip" [class.aktiv]="grund === g" (click)="grund = g">{{ g }}</button>
            </div>
            <textarea [(ngModel)]="kommentar" rows="3" maxlength="1500" placeholder="Optional: dein Rechenweg oder Ergebnis, z. B. „Ich komme auf 58,13 m mit (15,5 − 8,0)“"></textarea>
            <div class="fs-testphase-knoepfe">
              <button type="button" class="fs-knopf" (click)="testStand = 'frage'">Abbrechen</button>
              <button type="button" class="fs-knopf haupt" (click)="problemSenden()">Senden</button>
            </div>
          </ng-container>
          <p *ngSwitchCase="'ok'" class="fs-testphase-danke">👍 Danke fürs Mitprüfen!</p>
          <p *ngSwitchCase="'gesendet'" class="fs-testphase-danke">✅ Danke! Dein Hinweis ist gemeldet und wird geprüft.</p>
        </ng-container>
      </div>
      <div class="fs-aktionen">
        <button type="button" class="fs-knopf" [class.haupt]="beantwortet" (click)="neu()">Neue Aufgabe →</button>
        <button type="button" class="fs-knopf" (click)="ergebnisOffen = false">Einklappen ▼</button>
      </div>
    </div>
  </section>

  <!-- Unter dem Rechner: Aufgabe, Skizze, Statistik -->
  <div fs-seite class="fs-seite">
    <section class="fs-seite-karte">
      <p class="fs-seite-titel">Aufgabe <small>Stufe {{ stufe }}</small></p>
      <p class="fs-text" *ngIf="aufgabe.text">{{ aufgabe.text }}</p>
      <ul class="fs-seite-gegeben" *ngIf="aufgabe.gegeben.length">
        <li *ngFor="let g of aufgabe.gegeben"><fs-formel [tex]="g.sym"></fs-formel> = <strong>{{ zahl(g.wert, g.nk) }}</strong> {{ g.einheit }} <small>{{ g.name }}</small></li>
      </ul>
      <p class="fs-frage">{{ aufgabe.frage }}</p>
    </section>
    <label class="fs-schalter-klein"><input type="checkbox" [(ngModel)]="zeigeSkizze" /> Skizze anzeigen</label>
    <fs-skizze *ngIf="zeigeSkizze" [typ]="app.skizze" [variante]="skizzenVariante"></fs-skizze>
    <div class="fs-statzeile">
      <span>Serie <strong>{{ fortschritt.serie }}</strong></span>
      <span>Bestwert <strong>{{ fortschritt.bestSerie }}</strong></span>
      <span>Richtig <strong>{{ fortschritt.modi[modus].richtig }}/{{ fortschritt.modi[modus].gesamt }}</strong></span>
    </div>
    <p class="fs-modus-info">{{ info }}</p>
  </div>
</fs-schmierblatt>`,
})
export class UebenComponent implements OnChanges {
  @Input({ required: true }) app!: MiniAppDef;
  @Input({ required: true }) modus!: AufgabenModus;
  /** Skizze gleich eingeblendet (Standard: aus). */
  @Input() set skizzeAnfangs(an: boolean) { this.zeigeSkizze = an; }
  /** Meldet jede beantwortete Aufgabe (true = richtig), z. B. für die Statistik einer Zusatz-App. */
  @Output() ergebnis = new EventEmitter<boolean>();
  /** Kachel auf der Startseite, deren Status (z. B. Testphase) gilt; Standard: formelsammlung-<app-id> */
  @Input() kachelId?: string;

  testStand: 'frage' | 'melden' | 'ok' | 'gesendet' = 'frage';
  readonly gruende = ['Meine Lösung ist richtig, die App sagt falsch', 'Lösung der App ist falsch', 'Aufgabe/Werte unklar', 'Formel passt nicht', 'Sonstiges'];
  grund = this.gruende[0];
  kommentar = '';

  readonly stufen: Stufe[] = [1, 2, 3];
  stufe: Stufe = 1;
  aufgabe!: Aufgabe;
  beantwortet = false;
  zeigeSkizze = false;
  fortschritt!: AppFortschritt;
  // Tim, 2026-11-11: Rechner + Aufgabe rechts nur noch per 🧮 ausklappbar (Standard zu), Wahl wird gemerkt.
  seiteOffen = false;
  ergebnisOffen = false;
  letzte: Antwort | null = null;

  constructor(private readonly fs: FormelFortschrittService,
              private readonly appStatus: AppStatusService, private readonly meldungen: QuestionReportService) {
    this.appStatus.laden();
    try {
      const h = JSON.parse(localStorage.getItem(HILFSMITTEL_SPEICHER) || '{}');
      if (h.v === 3) this.seiteOffen = !!h.seite;
    } catch { /* ohne gespeicherte Einstellung */ }
  }

  /** Status der Kachel ist „Testphase“ (gelb) */
  get testphase(): boolean {
    const id = this.kachelId ?? 'formelsammlung-' + this.app.id;
    const kachel = alleAppTiles().find(t => t.id === id);
    return !!kachel && this.appStatus.einstellung(kachel).status === 'testphase';
  }

  problemSenden(): void {
    const a = this.letzte;
    if (!a) return;
    const eingabe = a.aufgabe.art === 'zahl' ? `${a.eingabe} ${a.aufgabe.gesucht.einheit}` : a.eingabe;
    this.meldungen.submitReport({
      questionId: `testphase:${a.aufgabe.appId}:${a.aufgabe.formelId}`,
      topic: `Testphase ${this.kachelId ?? 'formelsammlung-' + this.app.id}`,
      question: `${aufgabeKontext(a.aufgabe)} | Eingabe: ${eingabe} | App-Bewertung: ${a.richtig ? 'richtig' : 'falsch'}${a.mitLoesung ? ' (Lösungsweg war offen)' : ''} | Formel: ${a.aufgabe.formelLatex}`,
      reason: 'Testphase: ' + this.grund,
      comment: this.kommentar.trim() || undefined,
    });
    this.testStand = 'gesendet';
  }

  zahl(w: number, nk: number): string {
    return fmt(w, nk);
  }

  ergebnisUmschalten(): void {
    // Kein automatischer Fokus aufs Eingabefeld: sonst springt auf Tablet/Handy sofort die Bildschirm-Tastatur auf (Tim, 2026-11-11)
    this.ergebnisOffen = !this.ergebnisOffen;
  }

  seiteGesetzt(an: boolean): void {
    this.seiteOffen = an;
    this.speichern();
  }

  private speichern(): void {
    try {
      localStorage.setItem(HILFSMITTEL_SPEICHER, JSON.stringify({ v: 3, seite: this.seiteOffen }));
    } catch { /* egal */ }
  }

  get info(): string {
    return MODUS_TEXT[this.modus];
  }

  get skizzenVariante(): string {
    if (this.app.skizze === 'schienendehnung') return this.aufgabe.gegeben.some(g => g.sym === 'T_1') ? 'luecke' : 'dehnung';
    if (this.app.skizze === 'pfeilhoehe') return this.aufgabe.formelId === 'hf-ab' ? 'ab' : 'mitte';
    if (this.app.skizze === 'ausrundung') {
      // Aus den gegebenen Neigungen (Name endet auf „– Steigung/Gefälle/waagerecht“) Kuppe/Wanne bestimmen.
      const richtung = (sym: string): { s: number; r: Richtung } | null => {
        const g = this.aufgabe.gegeben.find(x => x.sym === sym);
        if (!g) return null;
        const r: Richtung = g.name.endsWith('Gefälle') ? 'gefaelle' : g.name.endsWith('waagerecht') ? 'waagerecht' : 'steigung';
        return { s: g.wert, r };
      };
      const a = richtung('s_1');
      const b = richtung('s_2');
      return a && b ? kuppeOderWanne(a.s, a.r, b.s, b.r) : 'kuppe';
    }
    return '';
  }

  ngOnChanges(): void {
    this.fortschritt = this.fs.app(this.app.id);
    this.neu();
  }

  stufeSetzen(s: number): void {
    this.stufe = s as Stufe;
    this.neu();
  }

  neu(): void {
    this.aufgabe = this.app.generiere(this.modus, this.stufe);
    this.beantwortet = false;
    this.letzte = null;
    this.ergebnisOffen = false;
    this.testStand = 'frage';
    this.grund = this.gruende[0];
    this.kommentar = '';
  }

  antwort(a: Antwort): void {
    this.beantwortet = true;
    this.letzte = a;
    this.fortschritt = { ...this.fs.ergebnis(this.app.id, this.modus, a.richtig) };
    this.ergebnis.emit(a.richtig);
  }
}
