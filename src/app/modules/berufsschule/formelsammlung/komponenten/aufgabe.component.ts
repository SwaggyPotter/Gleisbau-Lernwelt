import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PruefErgebnis, pruefeAuswahl, pruefeZahl } from '../kern/pruefen';
import { Aufgabe } from '../kern/typen';
import { fmt } from '../kern/zahlen';

/** Aufgabe als Klartext für Meldungen (Werte, Frage, Lösung der App). */
export function aufgabeKontext(a: Aufgabe): string {
  const geg = a.gegeben.map(g => `${g.sym} = ${fmt(g.wert, g.nk)} ${g.einheit}${g.name ? ' (' + g.name + ')' : ''}`).join('; ');
  const loes = a.art === 'zahl' ? `${fmt(a.loesung, a.nk)} ${a.gesucht.einheit}` : a.optionen[a.richtig];
  return `Formelsammlung ${a.appId} (${a.modus}, Stufe ${a.stufe}, Formel ${a.formelId}): ${a.text ?? ''} | Gegeben: ${geg} | ${a.frage} | Lösung der App: ${loes}`;
}

export interface Antwort {
  aufgabe: Aufgabe;
  richtig: boolean;
  /** Eingabe als Text (bei Auswahl der Optionstext). */
  eingabe: string;
  /** Lösungsweg wurde vor dem Prüfen aufgedeckt. */
  mitLoesung: boolean;
}

/**
 * Eine Aufgabe: Textaufgabe, gegebene Werte, Eingabe mit Einheit bzw. Auswahl,
 * Stufenhilfe (Tipp → Formel → Lösungsweg) und Rechenweg nach dem Prüfen.
 * Im Prüfungsmodus: keine Hilfe, keine Rückmeldung – nur „Weiter“.
 */
@Component({
  selector: 'fs-aufgabe',
  standalone: false,
  template: `
<div class="fs-aufgabe" [attr.data-melde-kontext]="meldeKontext">
  <p class="fs-text" *ngIf="aufgabe.text && !kompakt">{{ aufgabe.text }}</p>

  <div class="fs-gegeben" *ngIf="aufgabe.gegeben.length && !kompakt">
    <span class="fs-gegeben-titel">Gegeben</span>
    <div class="fs-gegeben-liste">
      <span class="fs-wert" *ngFor="let g of aufgabe.gegeben" [title]="g.name">
        <fs-formel [tex]="g.sym"></fs-formel> = <strong>{{ zahl(g.wert, g.nk) }}</strong> {{ g.einheit }}
        <small>{{ g.name }}</small>
      </span>
    </div>
  </div>

  <p class="fs-frage">{{ aufgabe.frage }}</p>

  <!-- Zahleneingabe -->
  <ng-container *ngIf="aufgabe.art === 'zahl'">
    <form class="fs-eingabe-zeile" (ngSubmit)="pruefen()">
      <label class="fs-eingabe-sym"><fs-formel [tex]="aufgabe.gesucht.sym"></fs-formel> =</label>
      <button type="button" class="fs-pm" (click)="vorzeichen()" [disabled]="fertig" title="Vorzeichen wechseln">±</button>
      <input class="fs-eingabe" name="antwort" [(ngModel)]="eingabe" inputmode="decimal" enterkeyhint="done"
             autocomplete="off" [disabled]="fertig" placeholder="Ergebnis" aria-label="Ergebnis" />
      <span class="fs-eingabe-einheit">{{ aufgabe.gesucht.einheit }}</span>
      <button type="submit" class="fs-knopf haupt" [disabled]="fertig || !eingabe.trim()">{{ pruefung ? 'Weiter' : 'Prüfen' }}</button>
    </form>
    <p class="fs-hinweis-klein" *ngIf="ungueltig">Bitte eine Zahl eingeben (Komma oder Punkt erlaubt).</p>
  </ng-container>

  <!-- Auswahl -->
  <div class="fs-optionen" *ngIf="aufgabe.art === 'auswahl'">
    <button type="button" *ngFor="let o of aufgabe.optionen; let i = index" class="fs-option"
            [class.gewaehlt]="gewaehlt === i"
            [class.richtig]="fertig && !pruefung && i === aufgabe.richtig"
            [class.falsch]="fertig && !pruefung && gewaehlt === i && i !== aufgabe.richtig"
            [disabled]="fertig" (click)="waehlen(i)">
      <fs-formel *ngIf="istLatex(o); else klartext" [tex]="o"></fs-formel>
      <ng-template #klartext>{{ o }}</ng-template>
    </button>
  </div>

  <!-- Rückmeldung -->
  <div class="fs-feedback" *ngIf="fertig && !pruefung" [class.ok]="ergebnis?.richtig" [class.nok]="!ergebnis?.richtig">
    <strong *ngIf="ergebnis?.richtig && !mitLoesung">Richtig!</strong>
    <strong *ngIf="ergebnis?.richtig && mitLoesung">Richtig – zählt aber nicht, weil der Lösungsweg schon offen war.</strong>
    <strong *ngIf="!ergebnis?.richtig">Leider falsch.</strong>
    <span *ngIf="aufgabe.art === 'zahl'"> Lösung: {{ zahl(aufgabe.loesung, aufgabe.nk) }} {{ aufgabe.gesucht.einheit }}</span>
    <span *ngIf="aufgabe.art === 'zahl' && aufgabe.nk >= 0" class="fs-toleranz"> (Toleranz ± {{ toleranzText }})</span>
    <p *ngIf="ergebnis?.hinweis" class="fs-fehlerhinweis">💡 {{ ergebnis?.hinweis }}</p>
  </div>

  <!-- Stufenhilfe -->
  <div class="fs-hilfe" *ngIf="!pruefung">
    <button type="button" class="fs-knopf klein" *ngIf="hilfe < 1 && !fertig" (click)="hilfe = 1">💡 Tipp</button>
    <button type="button" class="fs-knopf klein" *ngIf="hilfe === 1 && !fertig" (click)="hilfe = 2">∑ Formel zeigen</button>
    <button type="button" class="fs-knopf klein" *ngIf="hilfe === 2 && !fertig" (click)="loesungZeigen()">Lösungsweg zeigen</button>
    <button type="button" class="fs-knopf klein" *ngIf="fertig && hilfe < 3" (click)="hilfe = 3">Lösungsweg zeigen</button>
    <p class="fs-tipp" *ngIf="hilfe >= 1">💡 {{ aufgabe.tipp }}</p>
    <div class="fs-formelbox" *ngIf="hilfe >= 2"><fs-formel [tex]="aufgabe.formelLatex" [block]="true"></fs-formel></div>
    <ol class="fs-schritte" *ngIf="hilfe >= 3">
      <li *ngFor="let s of aufgabe.schritte">
        <span *ngIf="s.text">{{ s.text }}</span>
        <fs-formel *ngIf="s.latex" [tex]="s.latex" [block]="true"></fs-formel>
      </li>
    </ol>
  </div>
</div>`,
})
export class AufgabeComponent implements OnChanges {
  @Input({ required: true }) aufgabe!: Aufgabe;
  @Input() pruefung = false;
  /** Ohne Aufgabentext und Gegeben-Liste (stehen in der Seitenspalte neben dem Schmierblatt). */
  @Input() kompakt = false;
  @Output() beantwortet = new EventEmitter<Antwort>();

  eingabe = '';
  gewaehlt: number | null = null;
  fertig = false;
  ungueltig = false;
  hilfe = 0;
  mitLoesung = false;
  ergebnis: PruefErgebnis | null = null;

  ngOnChanges(): void {
    this.eingabe = '';
    this.gewaehlt = null;
    this.fertig = false;
    this.ungueltig = false;
    this.hilfe = 0;
    this.mitLoesung = false;
    this.ergebnis = null;
  }

  zahl(w: number, nk: number): string {
    return fmt(w, nk);
  }

  istLatex(o: string): boolean {
    return /[\\_^]/.test(o);
  }

  get toleranzText(): string {
    if (this.aufgabe.art !== 'zahl') return '';
    const a = this.aufgabe;
    const rel = Math.abs(a.loesung) * a.toleranz.rel;
    const t = Math.max(rel, a.toleranz.abs);
    return `${fmt(t, Math.max(a.nk, t < 1 ? 2 : 1))} ${a.gesucht.einheit}`;
  }

  get meldeKontext(): string {
    const a = this.aufgabe;
    const geg = a.gegeben.map(g => `${g.sym} = ${fmt(g.wert, g.nk)} ${g.einheit}`).join('; ');
    const loes = a.art === 'zahl' ? `${fmt(a.loesung, a.nk)} ${a.gesucht.einheit}` : a.optionen[a.richtig];
    return `Formelsammlung ${a.appId} (${a.modus}, Stufe ${a.stufe}): ${a.text ?? ''} ${geg} | ${a.frage} | Lösung: ${loes}`;
  }

  vorzeichen(): void {
    const t = this.eingabe.trim();
    this.eingabe = t.startsWith('-') || t.startsWith('−') ? t.slice(1) : `-${t}`;
  }

  loesungZeigen(): void {
    this.hilfe = 3;
    this.mitLoesung = true;
  }

  pruefen(): void {
    if (this.fertig || this.aufgabe.art !== 'zahl') return;
    const e = pruefeZahl(this.aufgabe, this.eingabe);
    if (e.ungueltig) {
      this.ungueltig = true;
      return;
    }
    this.abschliessen(e, this.eingabe.trim());
  }

  waehlen(i: number): void {
    if (this.fertig || this.aufgabe.art !== 'auswahl') return;
    this.gewaehlt = i;
    this.abschliessen(pruefeAuswahl(this.aufgabe, i), this.aufgabe.optionen[i]);
  }

  private abschliessen(e: PruefErgebnis, eingabe: string): void {
    this.ungueltig = false;
    this.ergebnis = e;
    this.fertig = true;
    if (!e.richtig && !this.pruefung) this.hilfe = 3;
    this.beantwortet.emit({ aufgabe: this.aufgabe, richtig: e.richtig && !this.mitLoesung, eingabe, mitLoesung: this.mitLoesung });
  }
}
