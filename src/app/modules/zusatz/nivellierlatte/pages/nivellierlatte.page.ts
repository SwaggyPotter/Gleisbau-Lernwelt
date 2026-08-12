import { Component } from '@angular/core';

interface DecimeterBlock {
  svgY: number;
  dark: boolean;
}

interface MeterLabel {
  svgY: number;
  value: number;
  red: boolean;
}

const STORAGE_KEY = 'nivellierlatte-highscore';

@Component({
  selector: 'app-nivellierlatte',
  templateUrl: './nivellierlatte.page.html',
  styleUrls: ['./nivellierlatte.page.scss'],
  standalone: false,
})
export class NivellierlattePage {
  readonly rodMinM = 0;
  readonly rodMaxM = 2.5;
  readonly toleranceMm = 5;
  readonly svgHeight = (this.rodMaxM - this.rodMinM) * 100; // cm-Einheiten

  /** Ausschnittgroesse (cm) im runden Zielfernrohr — je kleiner, desto staerker "gezoomt". */
  readonly scopeSpanCm = 22;
  /** Abstand der beiden Distanzstriche (Stadia) von der Hauptziellinie, in cm. */
  readonly stadiaOffsetCm = 6;

  target = 0;
  guessInput = '';
  feedback: 'correct' | 'wrong' | null = null;
  lastDiffMm = 0;
  round = 0;
  correctCount = 0;
  bestStreak = 0;
  streak = 0;

  readonly decimeterBlocks: DecimeterBlock[] = this.buildBlocks();
  readonly meterLabels: MeterLabel[] = this.buildMeterLabels();

  constructor() {
    this.bestStreak = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    this.next();
  }

  get crosshairY(): number {
    return (this.rodMaxM - this.target) * 100;
  }

  /** viewBox fuer die runde Zoom-Ansicht — zentriert die Ziellinie im Visier. */
  get scopeViewBox(): string {
    const half = this.scopeSpanCm / 2;
    const x = 10 - (this.scopeSpanCm - 24) / 2;
    return `${x} ${this.crosshairY - half} ${this.scopeSpanCm} ${this.scopeSpanCm}`;
  }

  submit(): void {
    const normalized = this.guessInput.replace(',', '.').trim();
    const guess = parseFloat(normalized);
    if (isNaN(guess)) return;

    const diffMm = Math.abs(guess - this.target) * 1000;
    this.lastDiffMm = Math.round(diffMm);
    this.feedback = diffMm <= this.toleranceMm ? 'correct' : 'wrong';

    if (this.feedback === 'correct') {
      this.correctCount++;
      this.streak++;
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
        localStorage.setItem(STORAGE_KEY, String(this.bestStreak));
      }
    } else {
      this.streak = 0;
    }
  }

  next(): void {
    this.round++;
    this.feedback = null;
    this.guessInput = '';
    const margin = 0.06;
    const range = this.rodMaxM - this.rodMinM - margin * 2;
    const mm = Math.round((this.rodMinM + margin + Math.random() * range) * 1000);
    this.target = mm / 1000;
  }

  private buildBlocks(): DecimeterBlock[] {
    const count = (this.rodMaxM - this.rodMinM) * 10;
    const blocks: DecimeterBlock[] = [];
    for (let i = 0; i < count; i++) {
      blocks.push({ svgY: i * 10, dark: i % 2 === 0 });
    }
    return blocks;
  }

  private buildMeterLabels(): MeterLabel[] {
    const labels: MeterLabel[] = [];
    for (let m = this.rodMinM; m <= this.rodMaxM; m++) {
      labels.push({ svgY: (this.rodMaxM - m) * 100, value: m, red: m % 2 === 1 });
    }
    return labels;
  }
}
