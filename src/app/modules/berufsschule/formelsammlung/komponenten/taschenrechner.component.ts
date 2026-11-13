import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { taschenrechnerAnzeige, taschenrechnerRechnen } from '../kern/taschenrechner';

interface Taste { t: string; ein?: string; art?: 'op' | 'fn' | 'gleich' | 'loesch'; breit?: boolean }

const TASTEN: Taste[] = [
  { t: 'C', art: 'loesch' }, { t: '⌫', art: 'loesch' }, { t: '(', art: 'fn' }, { t: ')', art: 'fn' }, { t: '÷', art: 'op' },
  { t: '7' }, { t: '8' }, { t: '9' }, { t: 'x²', ein: '²', art: 'fn' }, { t: '×', art: 'op' },
  { t: '4' }, { t: '5' }, { t: '6' }, { t: '√', ein: '√(', art: 'fn' }, { t: '−', art: 'op' },
  { t: '1' }, { t: '2' }, { t: '3' }, { t: 'π', art: 'fn' }, { t: '+', art: 'op' },
  { t: '0' }, { t: ',' }, { t: 'Ans', art: 'fn' }, { t: '=', art: 'gleich', breit: true },
];

/** Einfacher Taschenrechner zum Üben: Tasten oder Tastatur, Komma als Dezimalzeichen, Verlauf. */
@Component({
  selector: 'fs-taschenrechner',
  standalone: false,
  template: `
<div class="fs-tr">
  <div class="fs-tr-verlauf" *ngIf="verlauf.length">
    <button type="button" *ngFor="let v of verlauf" (click)="einfuegen(v.ergebnisRoh)" title="Ergebnis einfügen">
      {{ v.ausdruck }} = <strong>{{ v.ergebnis }}</strong>
    </button>
  </div>
  <!-- Mehrzeilig: lange Rechnungen brechen um und das Feld wächst mit (Tim, 2026-11-11) -->
  <textarea #feld class="fs-tr-anzeige" rows="1" [class.fehler]="fehler" [(ngModel)]="ausdruck" (ngModelChange)="getippt()"
         (keydown.enter)="$event.preventDefault(); gleich()" (keydown.escape)="ausdruck = ''" autocomplete="off" spellcheck="false"
         [attr.inputmode]="tastatur ? 'decimal' : 'none'" aria-label="Rechnung" placeholder="0"></textarea>
  <div class="fs-tr-tasten">
    <button type="button" *ngFor="let k of tasten" class="fs-tr-taste" [ngClass]="k.art || 'zahl'" [class.breit]="k.breit"
            (click)="druecke(k)">{{ k.t }}</button>
  </div>
  <label class="fs-schalter-klein"><input type="checkbox" [(ngModel)]="tastatur" /> Handy-Tastatur zulassen</label>
</div>`,
})
export class TaschenrechnerComponent implements AfterViewChecked {
  @ViewChild('feld', { static: true }) feld!: ElementRef<HTMLTextAreaElement>;
  readonly tasten = TASTEN;
  ausdruck = '';
  fehler = false;
  tastatur = false;
  ans = 0;
  verlauf: { ausdruck: string; ergebnis: string; ergebnisRoh: number }[] = [];
  private frischesErgebnis = false;

  druecke(k: Taste): void {
    if (k.t === 'C') { this.ausdruck = ''; this.fehler = false; return; }
    if (k.t === '⌫') { this.ausdruck = this.ausdruck.endsWith('Ans') ? this.ausdruck.slice(0, -3) : this.ausdruck.slice(0, -1); return; }
    if (k.art === 'gleich') { this.gleich(); return; }
    let ein = k.ein ?? k.t;
    // Nach „=“: Operator rechnet mit dem Ergebnis weiter, eine Zahl beginnt neu.
    if (this.frischesErgebnis) {
      if (k.art === 'op' || ein === '²') ein = 'Ans' + ein;
      this.ausdruck = '';
    }
    this.einfuegenText(ein);
  }

  getippt(): void {
    this.fehler = false;
    this.frischesErgebnis = false;
    if (/[\r\n]/.test(this.ausdruck)) this.ausdruck = this.ausdruck.replace(/[\r\n]+/g, '');
  }

  /** Höhe an den Inhalt anpassen: das Feld wird mit jeder Zeile etwas größer. */
  ngAfterViewChecked(): void {
    const el = this.feld.nativeElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  einfuegen(wert: number): void {
    this.ans = wert;
    this.einfuegenText('Ans');
  }

  gleich(): void {
    const a = this.ausdruck.trim();
    if (!a) return;
    const v = taschenrechnerRechnen(a, this.ans);
    if (v === null) { this.fehler = true; return; }
    this.ans = v;
    this.verlauf = [{ ausdruck: a, ergebnis: taschenrechnerAnzeige(v), ergebnisRoh: v }, ...this.verlauf].slice(0, 3);
    this.ausdruck = taschenrechnerAnzeige(v).replace(/\./g, '');
    this.frischesErgebnis = true;
  }

  private einfuegenText(t: string): void {
    this.frischesErgebnis = false;
    this.fehler = false;
    this.ausdruck += t;
    const el = this.feld.nativeElement;
    setTimeout(() => { el.focus({ preventScroll: true }); el.setSelectionRange(el.value.length, el.value.length); });
  }
}
