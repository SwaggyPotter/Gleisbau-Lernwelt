import { Component } from '@angular/core';
import { MASCHINEN } from '../data/maschinen';
import { BaumaschinenDataService } from '../services/baumaschinen-data.service';
import { BaumaschinenProgress, Maschine, Runde } from '../models/baumaschinen.models';

@Component({
  selector: 'app-baumaschinen',
  templateUrl: './baumaschinen.page.html',
  styleUrls: ['./baumaschinen.page.scss'],
  standalone: false,
})
export class BaumaschinenPage {
  readonly maschinen = MASCHINEN;

  runde!: Runde;
  progress!: BaumaschinenProgress;
  /** Bild der aktuellen Runde fertig geladen bzw. fehlgeschlagen */
  bildGeladen = false;
  bildFehler = false;
  /** Zähler, damit Angular das <img> je Runde neu erzeugt (kein altes Bild stehen lassen) */
  rundenNr = 0;

  constructor(private readonly data: BaumaschinenDataService) {
    this.progress = this.data.loadProgress();
    this.neueRunde();
    // Alle Bilder vorladen, damit „Nächstes Bild“ sofort erscheint
    for (const m of this.maschinen) { const img = new Image(); img.src = m.bildUrl; }
  }

  get quote(): number {
    return this.progress.total === 0 ? 0 : Math.round((this.progress.correct / this.progress.total) * 100);
  }

  neueRunde(): void {
    // Nie dieselbe Maschine zweimal hintereinander – sonst wirkt es, als hänge das Bild
    const letzte = this.runde?.maschine.id;
    const auswahl = this.maschinen.filter(m => m.id !== letzte);
    const maschine = auswahl[Math.floor(Math.random() * auswahl.length)];
    const optionen = this.mische([maschine, ...this.waehleDistraktoren(maschine)]);
    this.runde = { maschine, optionen, antwort: null };
    this.bildGeladen = false;
    this.bildFehler = false;
    this.rundenNr++;
  }

  bildOk(): void { this.bildGeladen = true; }
  bildKaputt(): void { this.bildFehler = true; }

  waehleAntwort(option: Maschine): void {
    if (this.runde.antwort) return;
    this.runde.antwort = option;
    const richtig = option.id === this.runde.maschine.id;
    this.progress = this.data.recordResult(richtig);
  }

  optionKlasse(option: Maschine): string {
    if (!this.runde.antwort) return '';
    if (option.id === this.runde.maschine.id) return 'correct';
    if (option.id === this.runde.antwort.id) return 'wrong';
    return 'muted';
  }

  private waehleDistraktoren(korrekt: Maschine): Maschine[] {
    const rest = this.mische(this.maschinen.filter(m => m.id !== korrekt.id));
    return rest.slice(0, 3);
  }

  private mische<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
