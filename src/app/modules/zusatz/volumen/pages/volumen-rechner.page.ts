import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { KOERPER, KoerperDef, KoerperId, koerper } from '../data/koerper';
import { STOFFE, Stoff, stoff } from '../data/stoffe';
import { Aufgabe, AufgabenArt, Stufe, f, neueAufgabe } from '../services/volumen-aufgaben';
import { Schmierblatt, starteSchmierblatt } from '../../../../shared/schmierblatt/schmierblatt';
import type { ModellAnsicht, Volumen3D } from '../three/volumen-3d';
import { zeichnung2D } from '../three/zeichnung-2d';

type Einheit = 'm' | 'cm' | 'mm';
const FAKTOR: Record<Einheit, number> = { m: 1, cm: 0.01, mm: 0.001 };
const SPEICHER = 'glw-volumen-einstellung';

/**
 * Volumenberechnung (Tim, 2026-11-06): links Aufgabe + Schmierblatt (wie Schotterberechnung) und Ergebnisfelder,
 * rechts 3D-Modell des Körpers – zur Aufgabe oder als freier Rechner mit Stoffauswahl und Gewicht in t/kg.
 * Schwerpunkt: Trapez-Prisma mit Gleisschotter. Das alte 10-Fragen-Quiz liegt unter /zusatz/volumen/quiz.
 */
@Component({
  selector: 'app-volumen-rechner',
  templateUrl: './volumen-rechner.page.html',
  styleUrls: ['./volumen-rechner.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class VolumenRechnerPage implements AfterViewInit, OnDestroy {
  @ViewChild('flaeche', { static: true }) flaeche!: ElementRef<HTMLElement>;
  @ViewChild('werkzeuge', { static: true }) werkzeuge!: ElementRef<HTMLElement>;
  @ViewChild('linkeSpalte', { static: true }) linkeSpalte!: ElementRef<HTMLElement>;
  @ViewChild('modellCanvas', { static: true }) modellCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('labelHost', { static: true }) labelHost!: ElementRef<HTMLElement>;
  @ViewChild('zeichnung', { static: true }) zeichnung!: ElementRef<HTMLElement>;

  readonly f = f;
  readonly koerperListe = KOERPER;
  readonly stoffe = STOFFE;
  readonly stoffGruppen = ['Schüttgut', 'Baustoff', 'Sonstiges'];

  modus: 'aufgabe' | 'rechner' = 'aufgabe';
  art: AufgabenArt = 'trapez';
  stufe: Stufe = 'leicht';
  aufgabe: Aufgabe = neueAufgabe('trapez', 'leicht');
  eingaben: Record<string, string> = {};
  bewertung: Record<string, 'ok' | 'warn' | 'bad' | ''> = {};
  stand = '';
  loesungZeigen = false;
  ergebnisseOffen = false;
  nurWerte = false;
  formelZeigen = false;
  modellFehler = '';
  /** 3D-Modell oder 2D-Zeichnung */
  ansicht: '3d' | '2d' = '3d';

  // Freier Rechner
  rk: KoerperId = 'trapez';
  einheit: Einheit = 'm';
  /** Werte je Körper in m */
  werte: Record<string, Record<string, number>> = {};
  stoffKey = 'schotter-verd';
  eigeneDichte = 1.6;
  eigeneDichteKg = false;
  boeschung = false;
  boeschungN = 1.5;

  private blatt?: Schmierblatt;
  private modell?: Volumen3D;
  private mo?: MutationObserver;
  private tot = false;

  constructor(private readonly zone: NgZone, private readonly host: ElementRef<HTMLElement>) {
    for (const k of KOERPER) this.werte[k.id] = Object.fromEntries(k.masse.map(m => [m.key, m.std]));
    try {
      const s = JSON.parse(localStorage.getItem(SPEICHER) || '{}');
      if (s.art === 'trapez' || s.art === 'alle') this.art = s.art;
      if (['leicht', 'mittel', 'schwer'].includes(s.stufe)) this.stufe = s.stufe;
      this.nurWerte = !!s.nurWerte;
      if (s.ansicht === '2d') this.ansicht = '2d';
    } catch { /* ohne gespeicherte Einstellung */ }
    this.aufgabe = neueAufgabe(this.art, this.stufe);
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.blatt = starteSchmierblatt({
        flaeche: this.flaeche.nativeElement,
        werkzeuge: this.werkzeuge.nativeElement,
        vollbildEl: this.linkeSpalte.nativeElement,
        seite: this.host.nativeElement,
      });
      this.mo = new MutationObserver(() => { this.modell?.farbenAusDesign(); this.modellZeigen(); });
      this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-theme', 'data-skin'] });
      import('../three/volumen-3d').then(({ Volumen3D }) => {
        if (this.tot) return;
        try {
          this.modell = new Volumen3D(this.modellCanvas.nativeElement, this.labelHost.nativeElement);
          if (this.ansicht === '2d') this.modell.pausieren();
          this.modellZeigen();
        } catch {
          this.zone.run(() => this.modellFehler = '3D-Ansicht wird von diesem Gerät nicht unterstützt.');
        }
      }).catch(() => this.zone.run(() => this.modellFehler = '3D-Ansicht konnte nicht geladen werden.'));
    });
    this.modellZeigen();
  }

  ionViewDidEnter(): void { if (this.ansicht === '3d') this.modell?.fortsetzen(); }
  ionViewWillLeave(): void { this.modell?.pausieren(); this.blatt?.vollbild(false); }

  ngOnDestroy(): void {
    this.tot = true;
    this.mo?.disconnect();
    this.blatt?.zerstoeren();
    this.modell?.zerstoeren();
  }

  /* ---------------- Aufgabe ---------------- */
  neu(): void {
    this.aufgabe = neueAufgabe(this.art, this.stufe);
    this.eingaben = {}; this.bewertung = {}; this.stand = '';
    this.loesungZeigen = false; this.ergebnisseOffen = false; this.formelZeigen = false;
    this.blatt?.leeren();
    if (this.modus === 'aufgabe') this.modellZeigen();
  }

  einstellungGeaendert(): void {
    this.speichern();
    this.neu();
  }

  nurWerteUmschalten(): void {
    this.nurWerte = !this.nurWerte;
    this.speichern();
  }

  private speichern(): void {
    try { localStorage.setItem(SPEICHER, JSON.stringify({ art: this.art, stufe: this.stufe, nurWerte: this.nurWerte, ansicht: this.ansicht })); } catch { /* egal */ }
  }

  ansichtSetzen(v: '3d' | '2d'): void {
    if (this.ansicht === v) return;
    this.ansicht = v;
    this.speichern();
    if (v === '2d') this.modell?.pausieren(); else this.modell?.fortsetzen();
    this.modellZeigen();
  }

  get aufgabeKoerper(): KoerperDef { return koerper(this.aufgabe.koerper); }
  get stufeName(): string { return { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[this.stufe]; }

  pruefen(): void {
    let richtig = 0;
    for (const feld of this.aufgabe.felder) {
      const roh = (this.eingaben[feld.key] ?? '').toString().trim();
      if (!roh) { this.bewertung[feld.key] = ''; continue; }
      const v = parseFloat(roh.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      const s = this.aufgabe.loesung[feld.key];
      let b: 'ok' | 'warn' | 'bad';
      if (isNaN(v)) b = 'bad';
      else if (feld.exakt) b = v === s ? 'ok' : Math.abs(v - s) === 1 ? 'warn' : 'bad';
      else { const rel = Math.abs(v - s) / Math.abs(s || 1); b = rel <= 0.01 ? 'ok' : rel <= 0.05 ? 'warn' : 'bad'; }
      this.bewertung[feld.key] = b;
      if (b === 'ok') richtig++;
    }
    this.stand = `· ${richtig} von ${this.aufgabe.felder.length} richtig`;
  }

  /** Für die Melde-Flagge: Aufgabe samt Musterlösung */
  get meldeKontext(): string {
    const a = this.aufgabe;
    const tmp = a.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const l = a.felder.map(x => `${x.label} = ${f(a.loesung[x.key], 3)} ${x.einheit}`).join('; ');
    return `Volumen #${a.nr} (${a.art}, ${a.stufe}): ${tmp} | Lösung: ${l}`;
  }

  /* ---------------- Modell ---------------- */
  modusSetzen(m: 'aufgabe' | 'rechner'): void { this.modus = m; this.modellZeigen(); }

  rechnerKoerper(id: KoerperId): void { this.rk = id; this.modellZeigen(); }

  get rDef(): KoerperDef { return koerper(this.rk); }

  /** Maße des Rechners in m (bei Böschung: c aus a, h und n) */
  get rMasse(): Record<string, number> {
    const m = { ...this.werte[this.rk] };
    if (this.rk === 'trapez' && this.boeschung) m['c'] = m['a'] + 2 * this.boeschungN * m['h'];
    return m;
  }

  anzeigeWert(key: string): number {
    const v = this.rMasse[key] / FAKTOR[this.einheit];
    return +v.toFixed(6);
  }
  wertSetzen(key: string, v: number | string | null): void {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
    if (!isFinite(n) || n <= 0) return;
    this.werte[this.rk][key] = n * FAKTOR[this.einheit];
    this.modellZeigen();
  }

  get rStoff(): Stoff | null { return this.stoffKey === 'eigen' ? null : stoff(this.stoffKey); }
  get rDichte(): number { return this.rStoff ? this.rStoff.dichte : (this.eigeneDichteKg ? this.eigeneDichte / 1000 : this.eigeneDichte); }
  get rFlach(): boolean { return !!this.rDef.flach; }
  get rFehler(): string {
    const m = this.rMasse;
    if (this.rk === 'rohr' && m['d'] >= m['D']) return 'Der Innendurchmesser muss kleiner als der Außendurchmesser sein.';
    if (Object.values(m).some(v => !(v > 0))) return 'Bitte alle Maße größer als 0 eingeben.';
    return '';
  }
  get rV(): number { return this.rDef.volumen(this.rMasse); }
  get rA(): number | null { return this.rDef.flaeche ? this.rDef.flaeche(this.rMasse) : null; }
  get rEingesetzt(): string { return this.rDef.eingesetzt(this.rMasse, f); }

  einheitText(m: number): string {
    const v = m / FAKTOR[this.einheit];
    return `${f(v, this.einheit === 'm' ? 3 : 1)} ${this.einheit}`;
  }

  formelAufsBlatt(): void {
    if (this.modus === 'rechner') {
      const d = this.rDef;
      const dichte = this.rDichte;
      if (d.flach) {
        this.blatt?.karte(d.name, `<div>${d.formel}</div><div style="margin-top:6px">${this.rEingesetzt} = <b>${f(this.rA ?? 0, 4)} m²</b></div>`);
        return;
      }
      const html = `<div>${d.formel}</div><div style="margin-top:6px">${this.rEingesetzt} = <b>${f(this.rV, 4)} m³</b></div>`
        + `<div>m = ${f(this.rV, 4)} m³ × ${f(dichte, 3)} t/m³ = <b>${f(this.rV * dichte, 3)} t</b> = ${f(this.rV * dichte * 1000, 1)} kg</div>`;
      this.blatt?.karte(d.name + (this.rStoff ? ' · ' + this.rStoff.name : ''), html);
    } else {
      const d = this.aufgabeKoerper;
      this.blatt?.karte(d.name, `<div>${d.formel}</div><div style="margin-top:6px;color:var(--sp-text-muted)">Gewicht: m = V × Dichte · 1 t = 1.000 kg</div>`);
    }
  }

  modellZeigen(): void {
    let ansicht: ModellAnsicht;
    if (this.modus === 'aufgabe') {
      const a = this.aufgabe, s = stoff(a.stoffKey);
      ansicht = { koerper: a.koerper, masse: a.masse, beschriftung: a.beschriftung, farbe: s.farbe, koernig: s.koernig };
    } else {
      if (this.rFehler) return;
      const m = this.rMasse, d = this.rDef;
      // Flächen ohne Stoff: neutrale Farbe
      const s = d.flach ? null : this.rStoff;
      const beschriftung: Record<string, string> = {};
      d.masse.forEach(x => beschriftung[x.key] = `${x.zeichen} = ${this.einheitText(m[x.key])}`);
      ansicht = { koerper: this.rk, masse: m, beschriftung, farbe: s?.farbe ?? '#9aa3ad', koernig: s?.koernig };
    }
    // 2D-Zeichnung immer mitführen (billig), damit der Wechsel sofort passt
    this.zeichnung.nativeElement.innerHTML = zeichnung2D(ansicht);
    if (this.modell) this.zone.runOutsideAngular(() => this.modell!.zeige(ansicht));
  }

}
