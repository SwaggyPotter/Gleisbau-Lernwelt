import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Difficulty } from '../models/materialrechner.models';
import { BAUTEILE, Bauteil, OBERBAUARTEN, Oberbauart, schwellenJeKm } from '../data/oberbau';
import { randChoice, randInt } from '../services/rechnen-utils';

interface LeichtZeile {
  bauteil: Bauteil;
  jeSchwelle: number;
  korrekt: number;
  optionen: number[];
  gewaehlt: number | null;
}

interface PoolZeile {
  bauteil: Bauteil;
  jeSchwelle: number; // 0 = gehoert nicht zu diesem Oberbau
  angehakt: boolean;
  menge: string;
  ok?: boolean;
}

interface Feld { eingabe: string; korrekt: number; toleranz: number; ok?: boolean }

/**
 * Modus "Baustelle": Materialbedarf einer Gleiserneuerung.
 *  leicht – Schwellenzahl und Teile je Schwelle stehen da, Gesamtmenge ankreuzen.
 *  mittel – Länge + Oberbau in Worten; selbst wissen, welche Teile dazugehören, Schwellen ausrechnen.
 *  schwer – nur „km von – bis, Gleiserneuerung gegen Oberbauanordnung …“; Länge, Schwellen, Teile, Schiene.
 */
@Component({
  selector: 'app-mr-baustelle',
  templateUrl: './baustelle.component.html',
  styleUrls: ['./baustelle.component.scss'],
  standalone: false,
})
export class BaustelleComponent implements OnChanges {
  @Input() stufe: Difficulty = 'leicht';
  @Output() ergebnis = new EventEmitter<boolean>();

  oberbau!: Oberbauart;
  auftrag = '';
  kurzform = '';
  laengeM = 0;
  schwellen = 0;
  vonKm = '';
  bisKm = '';

  leichtZeilen: LeichtZeile[] = [];
  pool: PoolZeile[] = [];
  laenge?: Feld;
  schwellenFeld?: Feld;
  schiene?: Feld;

  geprueft = false;
  allesRichtig = false;
  loesung: string[] = [];

  ngOnChanges(): void {
    this.neu();
  }

  zahl(n: number): string {
    return n.toLocaleString('de-DE');
  }

  neu(): void {
    this.geprueft = false;
    this.loesung = [];
    this.laenge = this.schwellenFeld = this.schiene = undefined;
    const ob = (this.oberbau = randChoice(OBERBAUARTEN));
    const a = ob.teilungCm;

    if (this.stufe === 'schwer') {
      const von = randInt(5, 120) * 1000 + randInt(0, 19) * 50;
      const laenge = randInt(8, 60) * 50; // 400 … 3000 m
      this.laengeM = laenge;
      this.vonKm = this.km(von);
      this.bisKm = this.km(von + laenge);
      this.schwellen = Math.ceil((laenge * 100) / a);
      const teilung = Math.random() < 0.5 ? `${a} cm` : `${this.zahl(schwellenJeKm(a))} Schw./km`;
      this.kurzform = `${ob.schiene} – ${ob.schwelle.replace('Betonschwelle ', '').replace('Holzschwelle', 'Ho')} – ${ob.befestigung} – ${teilung}`;
      this.auftrag = `Zwischen km ${this.vonKm} und km ${this.bisKm} wird das Gleis erneuert gegen Oberbauanordnung ${this.kurzform}.`;
      this.laenge = { eingabe: '', korrekt: laenge, toleranz: 0 };
      // Bei „Schw./km“ ist km × 1667 ebenso richtig wie L / a → kleine Toleranz
      this.schwellenFeld = { eingabe: '', korrekt: this.schwellen, toleranz: 2 };
      this.schiene = { eingabe: '', korrekt: 2 * laenge, toleranz: 0 };
      this.poolBauen();
      return;
    }

    if (this.stufe === 'mittel') {
      const laenge = randInt(4, 50) * 50; // 200 … 2500 m
      this.laengeM = laenge;
      this.schwellen = Math.ceil((laenge * 100) / a);
      this.auftrag = `${this.zahl(laenge)} m Gleis werden erneuert und gegen ${ob.name} ersetzt. Schwellenteilung ${a} cm.`;
      this.schwellenFeld = { eingabe: '', korrekt: this.schwellen, toleranz: 1 };
      this.poolBauen();
      return;
    }

    // leicht
    const km = randChoice([0.5, 1, 1.5, 2, 2.5, 3]);
    this.laengeM = km * 1000;
    this.schwellen = Math.ceil((this.laengeM * 100) / a);
    this.auftrag = `${this.zahl(km)} km Gleis werden erneuert und gegen ${ob.name} ersetzt. Dafür werden ${this.zahl(this.schwellen)} Schwellen eingebaut (Teilung ${a} cm).`;
    this.leichtZeilen = ob.teile.map(t => {
      const korrekt = t.jeSchwelle * this.schwellen;
      const kandidaten = [korrekt, this.schwellen, korrekt * 2, Math.round(korrekt / 2), korrekt + this.schwellen, korrekt - this.schwellen]
        .filter(x => x > 0);
      const optionen = [korrekt, ...this.mische([...new Set(kandidaten.filter(x => x !== korrekt))]).slice(0, 3)];
      return { bauteil: BAUTEILE[t.key], jeSchwelle: t.jeSchwelle, korrekt, optionen: this.mische(optionen).sort((x, y) => x - y), gewaehlt: null };
    });
  }

  private poolBauen(): void {
    const je = new Map(this.oberbau.teile.map(t => [t.key, t.jeSchwelle]));
    this.pool = this.mische(Object.values(BAUTEILE)).map(b => ({ bauteil: b, jeSchwelle: je.get(b.key) ?? 0, angehakt: false, menge: '' }));
  }

  private km(m: number): string {
    return `${Math.floor(m / 1000)},${String(m % 1000).padStart(3, '0')}`;
  }

  private lies(s: string): number | null {
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.').trim());
    return isNaN(n) ? null : n;
  }

  private feldPruefen(f?: Feld): boolean {
    if (!f) return true;
    const n = this.lies(f.eingabe);
    f.ok = n !== null && Math.abs(n - f.korrekt) <= f.toleranz;
    return f.ok;
  }

  get leichtFertig(): boolean {
    return this.leichtZeilen.every(z => z.gewaehlt !== null);
  }

  waehle(z: LeichtZeile, wert: number): void {
    if (this.geprueft) return;
    z.gewaehlt = wert;
  }

  pruefen(): void {
    if (this.geprueft) return;
    const ob = this.oberbau;
    const a = ob.teilungCm;
    let ok = true;
    this.loesung = [];

    if (this.stufe === 'leicht') {
      ok = this.leichtZeilen.every(z => z.gewaehlt === z.korrekt);
      this.loesung = this.leichtZeilen.map(z => `${z.bauteil.name}: ${this.zahl(this.schwellen)} Schwellen × ${z.jeSchwelle} = ${this.zahl(z.korrekt)} Stück`);
    } else {
      if (this.laenge) {
        ok = this.feldPruefen(this.laenge) && ok;
        this.loesung.push(`Länge: km ${this.bisKm} − km ${this.vonKm} = ${this.zahl(this.laengeM)} m`);
      }
      ok = this.feldPruefen(this.schwellenFeld) && ok;
      this.loesung.push(`Schwellen: ${this.zahl(this.laengeM)} m ÷ ${String(a / 100).replace('.', ',')} m = ${this.zahl((this.laengeM * 100) / a)} → aufgerundet ${this.zahl(this.schwellen)} Stück (${ob.schwelle})`);
      // Mengen gegen die eingegebene ODER die richtige Schwellenzahl prüfen (Folgefehler nicht doppelt bestrafen)
      const eigeneSchwellen = this.lies(this.schwellenFeld?.eingabe ?? '') ?? this.schwellen;
      for (const z of this.pool) {
        if (z.jeSchwelle === 0) {
          z.ok = !z.angehakt;
        } else {
          const n = this.lies(z.menge);
          z.ok = z.angehakt && n !== null && (n === z.jeSchwelle * this.schwellen || n === z.jeSchwelle * eigeneSchwellen);
          this.loesung.push(`${z.bauteil.name}: ${z.jeSchwelle} je Schwelle × ${this.zahl(this.schwellen)} = ${this.zahl(z.jeSchwelle * this.schwellen)} Stück`);
        }
        ok = ok && !!z.ok;
      }
      const fremd = this.pool.filter(z => z.jeSchwelle === 0).map(z => z.bauteil.kurz);
      this.loesung.push(`Gehört NICHT zu ${ob.befestigung}: ${[...new Set(fremd)].join(', ')}`);
      if (this.schiene) {
        ok = this.feldPruefen(this.schiene) && ok;
        this.loesung.push(`Schiene ${ob.schiene}: 2 Schienenstränge × ${this.zahl(this.laengeM)} m = ${this.zahl(2 * this.laengeM)} m`);
      }
    }
    this.geprueft = true;
    this.allesRichtig = ok;
    this.ergebnis.emit(ok);
  }

  private mische<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
