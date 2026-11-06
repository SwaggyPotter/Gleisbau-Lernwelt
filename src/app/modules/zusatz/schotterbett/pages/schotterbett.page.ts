import { Component } from '@angular/core';
import { AufgabenGeneratorService, KATEGORIEN, diagrammFuer } from '../services/aufgaben-generator.service';
import { PruefungsaufgabeGeneratorService } from '../services/pruefungsaufgabe-generator.service';
import { SchotterbettDataService } from '../services/schotterbett-data.service';
import { SchotterEingabe, SchotterErgebnis, berechneSchotter } from '../services/schotter-rechnung';
import { formatDE, parseDE } from '../services/schotterbett-utils';
import {
  AUSRUESTUNG_A05, BOESCHUNG_N, DICHTE_UNVERDICHTET, DICHTE_VERDICHTET, EINZELREGELN, QUELLEN,
  SCHWELLENLAENGE_M, bettungsdickeCm, vorKopfCm,
} from '../data/regelwerk';
import {
  GLEISABSTAND_REGEL_M, TABELLEN_SEITEN, TABELLE_BETTUNG_CM, TABELLE_VOR_KOPF_CM, TabellenSeite,
  seitenIndex, tabellenwertM3ProKm,
} from '../data/schottertabelle';
import { SCHWELLEN, Schwelle } from '../data/schwellen';
import {
  Aufgabe, DiagrammTyp, KategorieId, KategorieInfo, Niveau, Pruefungsaufgabe, SchotterbettProgress, TeilAufgabe,
} from '../models/schotterbett.models';

const ZUFALL = 'zufall';

type Modus = 'pruefung' | 'ueben' | 'rechner';
type Status = 'richtig' | 'folgefehler' | 'falsch' | 'leer';

@Component({
  selector: 'app-schotterbett',
  templateUrl: './schotterbett.page.html',
  styleUrls: ['./schotterbett.page.scss'],
  standalone: false,
})
export class SchotterbettPage {
  readonly zufallId = ZUFALL;
  readonly kategorien: KategorieInfo[] = KATEGORIEN;
  readonly ausruestung = AUSRUESTUNG_A05;
  readonly einzelregeln = EINZELREGELN;
  readonly quellen = QUELLEN;
  readonly fmt = formatDE;

  modus: Modus = 'pruefung';
  progress!: SchotterbettProgress;

  // Prüfungsaufgabe
  niveau: Niveau = 'mittel';
  readonly niveaus: { id: Niveau; titel: string; text: string }[] = [
    { id: 'leicht', titel: 'Leicht', text: 'Neubau eingleisig, Werte vorgegeben' },
    { id: 'mittel', titel: 'Mittel', text: 'Eingleisig erneuern, Werte nach Ril, Wiederverwendung' },
    { id: 'schwer', titel: 'Schwer', text: 'Zweigleisig, Gleisabstand > 4 m, ein oder beide Gleise' },
  ];

  // Schottertabelle zum Umblättern
  readonly seiten = TABELLEN_SEITEN;
  readonly tabSchwellen = SCHWELLEN;
  readonly tabBettung = TABELLE_BETTUNG_CM;
  readonly tabVorKopf = TABELLE_VOR_KOPF_CM;
  readonly gleisabstandRegel = GLEISABSTAND_REGEL_M;
  seite = 1;
  private touchX: number | null = null;
  pa!: Pruefungsaufgabe;
  antworten: Partial<Record<string, string>> = {};
  status: Record<string, Status> = {};
  geprueft = false;
  rechenwegOffen = false;

  // Üben
  ausgewaehlteKategorie: string = ZUFALL;
  aufgabe!: Aufgabe;
  eingabe = '';
  feedback: 'correct' | 'wrong' | null = null;

  // Freier Rechner
  rechner = {
    vonKm: 12.35, bisKm: 13.85, v: 160, schwellenabstandCm: 60,
    vorKopfCm: 40, bettungsdickeCm: 30, ril: true,
    schwelle: 'b70',
    schwellenlaengeM: SCHWELLENLAENGE_M, schwellenhoeheM: 0.21, schwellenvolumenM3: 0.122,
    boeschungN: BOESCHUNG_N, dichteVerdichtet: DICHTE_VERDICHTET, dichteUnverdichtet: DICHTE_UNVERDICHTET,
    verschmutzungProzent: 40, wagenKapazitaetT: 50,
  };

  constructor(
    private readonly generator: AufgabenGeneratorService,
    private readonly paGenerator: PruefungsaufgabeGeneratorService,
    private readonly data: SchotterbettDataService,
  ) {
    this.progress = this.data.loadProgress();
    this.neueAufgabe();
    this.neuePruefungsaufgabe();
  }

  get quote(): number {
    return this.progress.total === 0 ? 0 : Math.round((this.progress.correct / this.progress.total) * 100);
  }

  onModusChange(value: string | number | undefined | null): void {
    if (value === 'pruefung' || value === 'ueben' || value === 'rechner') this.modus = value;
  }

  // ---------- Prüfungsaufgabe ----------

  onNiveauChange(value: string | number | undefined | null): void {
    if ((value !== 'leicht' && value !== 'mittel' && value !== 'schwer') || value === this.niveau) return;
    this.niveau = value;
    this.neuePruefungsaufgabe();
  }

  neuePruefungsaufgabe(): void {
    this.pa = this.paGenerator.generate(this.niveau);
    this.antworten = {};
    this.status = {};
    this.geprueft = false;
    this.rechenwegOffen = false;
  }

  get anzahlRichtig(): number {
    return Object.values(this.status).filter(s => s === 'richtig' || s === 'folgefehler').length;
  }

  get alleRichtig(): boolean {
    return this.anzahlRichtig === this.pa.teilaufgaben.length;
  }

  alleAusgefuellt(): boolean {
    return this.pa.teilaufgaben.every(t => !isNaN(parseDE(this.antworten[t.key] ?? '')));
  }

  pruefeAlle(): void {
    for (const t of this.pa.teilaufgaben) this.status[t.key] = this.bewerte(t);
    if (!this.geprueft) this.progress = this.data.recordResult(this.alleRichtig);
    this.geprueft = true;
  }

  private bewerte(t: TeilAufgabe): Status {
    const wert = parseDE(this.antworten[t.key] ?? '');
    if (isNaN(wert)) return 'leer';
    if (Math.abs(wert - t.korrekt) <= t.toleranzAbs + 1e-9) return 'richtig';
    if (t.folgeVon && t.folge) {
      const vor = this.pa.teilaufgaben.find(x => x.key === t.folgeVon);
      const vorWert = parseDE(this.antworten[t.folgeVon] ?? '');
      if (vor && !isNaN(vorWert) && vorWert > 0) {
        const f = t.folge(vorWert);
        const tol = t.korrekt ? t.toleranzAbs * Math.abs(f / t.korrekt) : 0;
        if (Math.abs(wert - f) <= tol + 1e-9) return 'folgefehler';
      }
    }
    return 'falsch';
  }

  zurPassendenSeite(): void {
    const i = seitenIndex(this.pa.tabelle.gleise, this.pa.tabelle.abstandCm);
    if (i >= 0) this.seite = i;
  }

  korrektFormatiert(t: TeilAufgabe): string {
    return formatDE(t.korrekt, t.nachkommastellen);
  }

  // ---------- Schottertabelle ----------

  get aktuelleSeite(): TabellenSeite {
    return this.seiten[this.seite];
  }

  blaettern(richtung: number): void {
    this.seite = (this.seite + richtung + this.seiten.length) % this.seiten.length;
  }

  tabWert(schwelle: Schwelle, bd: number, vk: number): string {
    const s = this.aktuelleSeite;
    return formatDE(tabellenwertM3ProKm(schwelle.id, s.abstandCm, vk, bd, s.gleise), 0);
  }

  onTouchStart(ev: TouchEvent): void {
    this.touchX = ev.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(ev: TouchEvent): void {
    if (this.touchX === null) return;
    const dx = (ev.changedTouches[0]?.clientX ?? this.touchX) - this.touchX;
    this.touchX = null;
    if (Math.abs(dx) > 50) this.blaettern(dx < 0 ? 1 : -1);
  }

  // ---------- Üben ----------

  get diagramm(): DiagrammTyp {
    return diagrammFuer(this.aufgabe.kategorie);
  }

  get aktuelleKategorieInfo(): KategorieInfo | undefined {
    return this.kategorien.find(k => k.id === this.aufgabe.kategorie);
  }

  get korrekterWertFormatiert(): string {
    return formatDE(this.aufgabe.korrekterWert, this.aufgabe.nachkommastellen);
  }

  onKategorieChange(value: string | number | undefined | null): void {
    if (typeof value !== 'string' || value === this.ausgewaehlteKategorie) return;
    this.ausgewaehlteKategorie = value;
    this.neueAufgabe();
  }

  neueAufgabe(): void {
    const kategorie = this.ausgewaehlteKategorie === ZUFALL ? undefined : (this.ausgewaehlteKategorie as KategorieId);
    this.aufgabe = this.generator.generate(kategorie);
    this.eingabe = '';
    this.feedback = null;
  }

  pruefen(): void {
    if (this.feedback !== null) return;
    const wert = parseDE(this.eingabe);
    if (isNaN(wert)) return;

    const diff = Math.abs(wert - this.aufgabe.korrekterWert);
    this.feedback = diff <= this.aufgabe.toleranzAbs + 1e-9 ? 'correct' : 'wrong';
    this.progress = this.data.recordResult(this.feedback === 'correct');
  }

  // ---------- Freier Rechner ----------

  onRechnerV(): void {
    if (!this.rechner.ril) return;
    this.rechner.vorKopfCm = vorKopfCm(this.rechner.v);
    this.rechner.bettungsdickeCm = bettungsdickeCm(this.rechner.v);
  }

  onRechnerSchwelle(): void {
    const s = SCHWELLEN.find(x => x.id === this.rechner.schwelle);
    if (!s) return;
    this.rechner.schwellenlaengeM = s.laengeM;
    this.rechner.schwellenhoeheM = s.hoeheM;
    this.rechner.schwellenvolumenM3 = Math.round(s.volumenM3 * 1000) / 1000;
    if (s.abstandFestCm) this.rechner.schwellenabstandCm = s.abstandFestCm;
  }

  get rechnerErgebnis(): SchotterErgebnis | null {
    const r = this.rechner;
    const laengeM = Math.abs(r.bisKm - r.vonKm) * 1000;
    const eingabe: SchotterEingabe = {
      laengeM,
      schwellenabstandCm: r.schwellenabstandCm,
      schwellenlaengeM: r.schwellenlaengeM,
      schwellenhoeheM: r.schwellenhoeheM,
      schwellenvolumenM3: r.schwellenvolumenM3,
      vorKopfCm: r.vorKopfCm,
      bettungsdickeCm: r.bettungsdickeCm,
      boeschungN: r.boeschungN,
      dichteVerdichtet: r.dichteVerdichtet,
      dichteUnverdichtet: r.dichteUnverdichtet,
      wiederverwendungProzent: 100 - r.verschmutzungProzent,
      wagenKapazitaetT: r.wagenKapazitaetT,
    };
    const zahlen = Object.values(eingabe);
    if (zahlen.some(z => typeof z !== 'number' || isNaN(z))) return null;
    if (laengeM <= 0 || r.schwellenabstandCm <= 0 || r.wagenKapazitaetT <= 0 || r.dichteUnverdichtet <= 0) return null;
    return berechneSchotter(eingabe);
  }

  get rechnerLaengeM(): number {
    return Math.abs(this.rechner.bisKm - this.rechner.vonKm) * 1000;
  }
}
