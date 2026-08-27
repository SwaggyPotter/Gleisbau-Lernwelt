import { Component } from '@angular/core';
import { AufgabenGeneratorService, KATEGORIEN, diagrammFuer } from '../services/aufgaben-generator.service';
import { TrassierungDataService } from '../services/trassierung-data.service';
import { formatDE, parseDE } from '../services/trassierung-utils';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo, TrassierungProgress } from '../models/trassierung.models';

const ZUFALL = 'zufall';

@Component({
  selector: 'app-trassierung',
  templateUrl: './trassierung.page.html',
  styleUrls: ['./trassierung.page.scss'],
  standalone: false,
})
export class TrassierungPage {
  readonly zufallId = ZUFALL;
  readonly kategorien: KategorieInfo[] = KATEGORIEN;

  ausgewaehlteKategorie: string = ZUFALL;
  aufgabe!: Aufgabe;
  eingabe = '';
  feedback: 'correct' | 'wrong' | null = null;
  progress!: TrassierungProgress;

  constructor(
    private readonly generator: AufgabenGeneratorService,
    private readonly data: TrassierungDataService,
  ) {
    this.progress = this.data.loadProgress();
    this.neueAufgabe();
  }

  get diagramm(): DiagrammTyp {
    return diagrammFuer(this.aufgabe.kategorie);
  }

  get aktuelleKategorieInfo(): KategorieInfo | undefined {
    return this.kategorien.find(k => k.id === this.aufgabe.kategorie);
  }

  get quote(): number {
    return this.progress.total === 0 ? 0 : Math.round((this.progress.correct / this.progress.total) * 100);
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
    this.feedback = diff <= this.aufgabe.toleranzAbs ? 'correct' : 'wrong';
    this.progress = this.data.recordResult(this.aufgabe.kategorie, this.feedback === 'correct');
  }
}
