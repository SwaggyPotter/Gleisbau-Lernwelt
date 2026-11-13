import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Aufgabe, Bild, FORMELN, FormelArt, Stufe, f, neueAufgabe } from '../services/prozent-aufgaben';
import { prozentBild } from '../services/prozent-bild';
import { Schmierblatt, starteSchmierblatt } from '../../../../shared/schmierblatt/schmierblatt';

const SPEICHER = 'glw-prozent-einstellung';
type RModus = 'grund' | 'aendern' | 'neigung';

/**
 * Prozentrechnung (Tim, 2026-11-06): wie Volumen-/Schotterberechnung – links Aufgabe + Schmierblatt + Ergebnisse,
 * rechts Bild zur Aufgabe (Prozentstreifen, Kette, Neigungsdreieck) oder freier Rechner.
 * Das alte Quiz liegt unter /zusatz/prozentrechnung/quiz.
 */
@Component({
  selector: 'app-prozent-rechner',
  templateUrl: './prozent-rechner.page.html',
  styleUrls: ['./prozent-rechner.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class ProzentRechnerPage implements AfterViewInit, OnDestroy {
  @ViewChild('flaeche', { static: true }) flaeche!: ElementRef<HTMLElement>;
  @ViewChild('werkzeuge', { static: true }) werkzeuge!: ElementRef<HTMLElement>;
  @ViewChild('linkeSpalte', { static: true }) linkeSpalte!: ElementRef<HTMLElement>;
  @ViewChild('bildEl', { static: true }) bildEl!: ElementRef<HTMLElement>;

  readonly f = f;
  readonly formeln = FORMELN;

  modus: 'aufgabe' | 'rechner' = 'aufgabe';
  stufe: Stufe = 'leicht';
  aufgabe: Aufgabe;
  eingaben: Record<string, string> = {};
  bewertung: Record<string, 'ok' | 'warn' | 'bad' | ''> = {};
  stand = '';
  loesungZeigen = false;
  ergebnisseOffen = false;
  nurWerte = false;
  formelZeigen = false;

  // Freier Rechner
  rModus: RModus = 'grund';
  gesucht: 'W' | 'G' | 'p' = 'W';
  rG = 1200; rP = 15; rW = 180;
  aRichtung: 'plus' | 'minus' = 'plus';
  aGegeben: 'start' | 'ende' = 'start';
  aWert = 1000; aP = 19;
  nGesucht: 'promille' | 'dh' = 'promille';
  nL = 500; nDh = 2.5; nPromille = 5;

  private blatt?: Schmierblatt;

  constructor(private readonly zone: NgZone, private readonly host: ElementRef<HTMLElement>) {
    try {
      const s = JSON.parse(localStorage.getItem(SPEICHER) || '{}');
      if (['leicht', 'mittel', 'schwer'].includes(s.stufe)) this.stufe = s.stufe;
      this.nurWerte = !!s.nurWerte;
    } catch { /* ohne gespeicherte Einstellung */ }
    this.aufgabe = neueAufgabe(this.stufe);
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.blatt = starteSchmierblatt({
        flaeche: this.flaeche.nativeElement,
        werkzeuge: this.werkzeuge.nativeElement,
        vollbildEl: this.linkeSpalte.nativeElement,
        seite: this.host.nativeElement,
      });
    });
    this.bildZeigen();
  }

  ionViewWillLeave(): void { this.blatt?.vollbild(false); }
  ngOnDestroy(): void { this.blatt?.zerstoeren(); }

  /* ---------------- Aufgabe ---------------- */
  neu(): void {
    this.aufgabe = neueAufgabe(this.stufe);
    this.eingaben = {}; this.bewertung = {}; this.stand = '';
    this.loesungZeigen = false; this.ergebnisseOffen = false; this.formelZeigen = false;
    this.blatt?.leeren();
    this.bildZeigen();
  }

  private speichern(): void {
    try { localStorage.setItem(SPEICHER, JSON.stringify({ stufe: this.stufe, nurWerte: this.nurWerte })); } catch { /* egal */ }
  }
  stufeGeaendert(): void { this.speichern(); this.neu(); }
  nurWerteUmschalten(): void { this.nurWerte = !this.nurWerte; this.speichern(); }

  get stufeName(): string { return { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[this.stufe]; }

  pruefen(): void {
    let richtig = 0;
    for (const feld of this.aufgabe.felder) {
      const roh = (this.eingaben[feld.key] ?? '').toString().trim();
      if (!roh) { this.bewertung[feld.key] = ''; continue; }
      const v = parseFloat(roh.replace(/\s|€|%|‰/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      const s = this.aufgabe.loesung[feld.key];
      let b: 'ok' | 'warn' | 'bad';
      if (isNaN(v)) b = 'bad';
      else if (feld.exakt) b = v === s ? 'ok' : Math.abs(v - s) === 1 ? 'warn' : 'bad';
      else {
        // Geldbeträge: auf den Cent (± 1 Cent Rundung), sonst 1 % grün / 5 % gelb
        const rel = Math.abs(v - s) / Math.abs(s || 1);
        if (feld.einheit === '€') b = Math.abs(v - s) <= 0.015 ? 'ok' : rel <= 0.01 ? 'warn' : 'bad';
        else b = rel <= 0.01 ? 'ok' : rel <= 0.05 ? 'warn' : 'bad';
      }
      this.bewertung[feld.key] = b;
      if (b === 'ok') richtig++;
    }
    this.stand = `· ${richtig} von ${this.aufgabe.felder.length} richtig`;
  }

  get meldeKontext(): string {
    const a = this.aufgabe;
    const tmp = a.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const l = a.felder.map(x => `${x.label} = ${f(a.loesung[x.key], 3)} ${x.einheit}`).join('; ');
    return `Prozent #${a.nr} (${a.stufe}, ${a.titel}): ${tmp} | Lösung: ${l}`;
  }

  /* ---------------- Rechts: Bild / Rechner ---------------- */
  modusSetzen(m: 'aufgabe' | 'rechner'): void { this.modus = m; this.bildZeigen(); }
  rModusSetzen(m: RModus): void { this.rModus = m; this.bildZeigen(); }

  get formelArt(): FormelArt {
    if (this.modus === 'aufgabe') return this.aufgabe.formel;
    return this.rModus;
  }

  private pos(n: number): boolean { return typeof n === 'number' && isFinite(n) && n > 0; }

  /** Ergebnis des freien Rechners: Kacheln + Bild, oder Fehlertext */
  get rErgebnis(): { fehler?: string; kacheln: { name: string; wert: string; haupt?: boolean }[]; bild?: Bild } {
    if (this.rModus === 'grund') {
      const { rG: G, rP: p, rW: W } = this;
      if (this.gesucht === 'W') {
        if (!this.pos(G) || !this.pos(p)) return { fehler: 'Bitte G und p größer als 0 eingeben.', kacheln: [] };
        const w = G * p / 100;
        return { kacheln: [{ name: 'Prozentwert W', wert: f(w, 4), haupt: true }], bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${f(G, 4)}`, W: `W = ${f(w, 4)}`, P: `${f(p, 4)} %` } };
      }
      if (this.gesucht === 'G') {
        if (!this.pos(W) || !this.pos(p)) return { fehler: 'Bitte W und p größer als 0 eingeben.', kacheln: [] };
        const g = W * 100 / p;
        return { kacheln: [{ name: 'Grundwert G', wert: f(g, 4), haupt: true }], bild: { art: 'streifen', modus: 'anteil', p: Math.min(p, 100), G: `G = ${f(g, 4)}`, W: `W = ${f(W, 4)}`, P: `${f(p, 4)} %` } };
      }
      if (!this.pos(W) || !this.pos(G)) return { fehler: 'Bitte W und G größer als 0 eingeben.', kacheln: [] };
      const pp = W * 100 / G;
      return { kacheln: [{ name: 'Prozentsatz p', wert: f(pp, 4) + ' %', haupt: true }], bild: { art: 'streifen', modus: 'anteil', p: Math.min(pp, 100), G: `G = ${f(G, 4)}`, W: `W = ${f(W, 4)}`, P: `${f(pp, 2)} %` } };
    }
    if (this.rModus === 'aendern') {
      const p = this.aP, v = this.aWert, plus = this.aRichtung === 'plus';
      if (!this.pos(v) || !this.pos(p)) return { fehler: 'Bitte Wert und p größer als 0 eingeben.', kacheln: [] };
      if (!plus && p >= 100) return { fehler: 'Eine Minderung muss kleiner als 100 % sein.', kacheln: [] };
      const q = plus ? 100 + p : 100 - p;
      const start = this.aGegeben === 'start' ? v : v * 100 / q, ende = this.aGegeben === 'start' ? v * q / 100 : v, d = Math.abs(ende - start);
      return {
        kacheln: [
          { name: 'Ausgangswert (100 %)', wert: f(start, 4), haupt: this.aGegeben === 'ende' },
          { name: plus ? 'Erhöhung' : 'Minderung', wert: f(d, 4) },
          { name: `neuer Wert (${f(q, 4)} %)`, wert: f(ende, 4), haupt: this.aGegeben === 'start' },
        ],
        bild: { art: 'streifen', modus: plus ? 'plus' : 'minus', p, G: `G = ${f(start, 4)}`, W: `${plus ? '+' : '−'} ${f(d, 4)}`, P: `${f(p, 4)} %`, E: `neu = ${f(ende, 4)}` },
      };
    }
    const l = this.nL;
    if (this.nGesucht === 'promille') {
      if (!this.pos(l) || !this.pos(this.nDh)) return { fehler: 'Bitte Länge und Höhenunterschied größer als 0 eingeben.', kacheln: [] };
      const n = this.nDh / l * 1000;
      return {
        kacheln: [{ name: 'Neigung', wert: f(n, 3) + ' ‰', haupt: true }, { name: 'Neigung', wert: f(n / 10, 4) + ' %' }],
        bild: { art: 'neigung', promille: n, l: `l = ${f(l, 3)} m`, dh: `Δh = ${f(this.nDh, 3)} m`, n: `${f(n, 3)} ‰`, steigt: true },
      };
    }
    if (!this.pos(l) || !this.pos(this.nPromille)) return { fehler: 'Bitte Länge und Neigung größer als 0 eingeben.', kacheln: [] };
    const dh = l * this.nPromille / 1000;
    return {
      kacheln: [{ name: 'Höhenunterschied Δh', wert: f(dh, 4) + ' m', haupt: true }, { name: 'in cm', wert: f(dh * 100, 2) + ' cm' }],
      bild: { art: 'neigung', promille: this.nPromille, l: `l = ${f(l, 3)} m`, dh: `Δh = ${f(dh, 3)} m`, n: `${f(this.nPromille, 3)} ‰`, steigt: true },
    };
  }

  bildZeigen(): void {
    const el = this.bildEl?.nativeElement;
    if (!el) return;
    const bild = this.modus === 'aufgabe' ? this.aufgabe.bild : this.rErgebnis.bild;
    if (bild) el.innerHTML = prozentBild(bild);
  }

  formelAufsBlatt(): void {
    const fm = FORMELN[this.formelArt];
    let html = `<div>${fm.html}</div>`;
    if (this.modus === 'rechner') {
      const e = this.rErgebnis;
      if (!e.fehler) html += `<div style="margin-top:6px">${e.kacheln.map(k => `${k.name}: <b>${k.wert}</b>`).join('<br>')}</div>`;
    }
    this.blatt?.karte(fm.name, html);
  }
}
