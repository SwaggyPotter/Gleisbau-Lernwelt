import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MiniAppDef, RechnerAusgabe, RechnerVariante } from '../kern/typen';
import { fmt, parseEingabe, umrechnen } from '../kern/zahlen';

interface FeldZustand { text: string; einheit: string }

/** Rechner-Modus: Werte eingeben (Einheit wählbar), Ergebnisse, Warnungen, Rechenweg. */
@Component({
  selector: 'fs-rechner',
  standalone: false,
  template: `
<section class="fs-karte">
  <div class="fs-stufen" *ngIf="app.rechner.length > 1 && !varianteVonAussen">
    <button type="button" *ngFor="let v of app.rechner" class="fs-chip" [class.aktiv]="variante.id === v.id" (click)="varianteSetzen(v)">{{ v.label }}</button>
  </div>

  <div class="fs-rechner-felder">
    <label class="fs-rfeld" *ngFor="let f of variante.felder">
      <span class="fs-rfeld-name"><fs-formel [tex]="f.sym"></fs-formel> {{ f.name }}</span>
      <span class="fs-rfeld-eingabe">
        <input inputmode="decimal" [(ngModel)]="felder[f.key].text" (ngModelChange)="rechnen()" [attr.aria-label]="f.name" />
        <select *ngIf="(f.einheiten?.length ?? 0) > 1; else festeEinheit" [(ngModel)]="felder[f.key].einheit" (ngModelChange)="rechnen()" [attr.aria-label]="'Einheit ' + f.name">
          <option *ngFor="let e of f.einheiten" [value]="e">{{ e }}</option>
        </select>
        <ng-template #festeEinheit><span class="fs-eingabe-einheit">{{ f.einheiten?.[0] ?? f.einheit }}</span></ng-template>
      </span>
    </label>
    <label class="fs-rfeld" *ngFor="let sch of variante.schalter ?? []">
      <span class="fs-rfeld-name">{{ sch.label }}</span>
      <select [(ngModel)]="schalter[sch.key]" (ngModelChange)="rechnen()">
        <option *ngFor="let o of sch.optionen" [value]="o.wert">{{ o.label }}</option>
      </select>
    </label>
  </div>

  <div class="fs-warnung" *ngFor="let w of ausgabe.warnungen">⚠ {{ w }}</div>

  <div class="fs-ergebnisse" *ngIf="ausgabe.ergebnisse.length">
    <div class="fs-ergebnis" *ngFor="let e of ausgabe.ergebnisse" [class.haupt]="e.hervorheben">
      <span class="fs-ergebnis-name"><fs-formel [tex]="e.sym"></fs-formel> {{ e.name }}</span>
      <strong>{{ zahl(e.wert, e.nk) }} <small>{{ e.einheit }}</small></strong>
    </div>
  </div>

  <ol class="fs-schritte" *ngIf="ausgabe.schritte.length">
    <li *ngFor="let s of ausgabe.schritte">
      <span *ngIf="s.text">{{ s.text }}</span>
      <fs-formel *ngIf="s.latex" [tex]="s.latex" [block]="true"></fs-formel>
    </li>
  </ol>

  <div class="fs-tabelle-wrap" *ngIf="ausgabe.tabelle as t">
    <p class="fs-tabelle-titel">{{ t.titel }}</p>
    <table class="fs-tabelle">
      <thead><tr><th *ngFor="let k of t.kopf">{{ k }}</th></tr></thead>
      <tbody><tr *ngFor="let z of t.zeilen; let i = index" [class.markiert]="t.markiert?.includes(i)"><td *ngFor="let c of z">{{ c }}</td></tr></tbody>
    </table>
  </div>
</section>`,
})
export class RechnerComponent implements OnChanges {
  @Input({ required: true }) app!: MiniAppDef;
  /** Meldet die gewählte Rechner-Variante (z. B. damit die Seite die passende Skizze zeigt). */
  @Output() varianteWechsel = new EventEmitter<string>();
  /** Variante von außen steuern (Umschalter liegt dann auf der Seite, nicht im Rechner). */
  @Input() varianteId?: string;

  get varianteVonAussen(): boolean { return this.varianteId !== undefined; }

  variante!: RechnerVariante;
  felder: Record<string, FeldZustand> = {};
  schalter: Record<string, string> = {};
  ausgabe: RechnerAusgabe = { ergebnisse: [], warnungen: [], schritte: [] };

  ngOnChanges(): void {
    this.varianteSetzen(this.app.rechner.find(v => v.id === this.varianteId) ?? this.app.rechner[0]);
  }

  zahl(w: number, nk: number): string {
    return fmt(w, nk);
  }

  varianteSetzen(v: RechnerVariante): void {
    this.variante = v;
    if (!this.varianteVonAussen) this.varianteWechsel.emit(v.id);
    this.felder = {};
    for (const f of v.felder) {
      this.felder[f.key] = { text: fmt(f.standard, 4).replace(/,?0+$/, '').replace(/\./g, ''), einheit: f.einheiten?.[0] ?? f.einheit };
    }
    this.schalter = {};
    for (const s of v.schalter ?? []) this.schalter[s.key] = s.optionen[0].wert;
    this.rechnen();
  }

  rechnen(): void {
    const w: Record<string, number> = {};
    for (const f of this.variante.felder) {
      const z = this.felder[f.key];
      const roh = parseEingabe(z.text);
      w[f.key] = Number.isNaN(roh) ? NaN : umrechnen(roh, z.einheit, f.einheit);
    }
    try {
      this.ausgabe = this.variante.berechne(w, this.schalter);
    } catch {
      this.ausgabe = { ergebnisse: [], warnungen: ['Mit diesen Werten lässt sich nicht rechnen.'], schritte: [] };
    }
  }
}
