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

  constructor(private readonly data: BaumaschinenDataService) {
    this.progress = this.data.loadProgress();
    this.neueRunde();
  }

  get quote(): number {
    return this.progress.total === 0 ? 0 : Math.round((this.progress.correct / this.progress.total) * 100);
  }

  neueRunde(): void {
    const maschine = this.maschinen[Math.floor(Math.random() * this.maschinen.length)];
    const optionen = this.mische([maschine, ...this.waehleDistraktoren(maschine)]);
    this.runde = { maschine, optionen, antwort: null };
  }

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
