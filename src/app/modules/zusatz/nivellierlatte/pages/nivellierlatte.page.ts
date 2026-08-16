import { Component } from '@angular/core';

interface RodCell {
  svgY: number;
  x: number;
  width: number;
  height: number;
}

interface DecimeterLabel {
  svgY: number;
  x: number;
  text: string;
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

  /** Distanzkonstante (Fadenkonstante) des Instruments — Standardwert bei den meisten Nivelliergeraeten. */
  readonly stadiaConstant = 100;
  /** Abstand der beiden Distanzstriche von der Mittellinie im Visier, als Anteil des sichtbaren Ausschnitts (fix, wie beim echten Fadenkreuz). */
  readonly stadiaFraction = 0.3;
  readonly minDistanceM = 15;
  readonly maxDistanceM = 30;
  readonly distanceStepM = 5;
  readonly distanceToleranceM = 3;

  target = 0;
  distanceM = 0;

  guessInput = '';
  feedback: 'correct' | 'wrong' | null = null;
  lastDiffMm = 0;

  upperGuessInput = '';
  lowerGuessInput = '';
  distanceFeedback: 'correct' | 'wrong' | null = null;
  distanceGuessM = 0;

  round = 0;
  correctCount = 0;
  distanceCorrectCount = 0;
  bestStreak = 0;
  streak = 0;

  readonly rodCells: RodCell[] = this.buildRodCells();
  /** Dichte Dezimeter-Beschriftung — ein echtes Latten-Vorbild beschriftet jeden Dezimeter, nicht nur jeden Meter. */
  readonly decimeterLabels: DecimeterLabel[] = this.buildDecimeterLabels();
  readonly decimeterTicks: number[] = this.buildDecimeterTicks();

  constructor() {
    this.bestStreak = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    this.next();
  }

  get crosshairY(): number {
    return (this.rodMaxM - this.target) * 100;
  }

  get halfIntervalM(): number {
    return this.distanceM / (2 * this.stadiaConstant);
  }

  /** Wert, an dem der OBERE Distanzstrich die Latte schneidet. */
  get upperTargetM(): number {
    return this.target + this.halfIntervalM;
  }

  /** Wert, an dem der UNTERE Distanzstrich die Latte schneidet. */
  get lowerTargetM(): number {
    return this.target - this.halfIntervalM;
  }

  /** Sichtbarer Hoehenausschnitt (cm) im runden Zielfernrohr — waechst mit der simulierten Entfernung, genau wie beim echten Fernrohr mit fixem Fadenkreuz. */
  get scopeSpanCm(): number {
    return this.distanceM / (2 * this.stadiaFraction);
  }

  /** viewBox fuer die runde Zoom-Ansicht — zentriert die Ziellinie im Visier. */
  get scopeViewBox(): string {
    const half = this.scopeSpanCm / 2;
    const x = 11.4 - half; // 11.4 = Lattenmitte (rodLeft 10 + halfW 1.4)
    return `${x} ${this.crosshairY - half} ${this.scopeSpanCm} ${this.scopeSpanCm}`;
  }

  submit(): void {
    const guess = this.parseNumber(this.guessInput);
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

  submitDistance(): void {
    const upper = this.parseNumber(this.upperGuessInput);
    const lower = this.parseNumber(this.lowerGuessInput);
    if (isNaN(upper) || isNaN(lower)) return;

    this.distanceGuessM = (upper - lower) * this.stadiaConstant;
    const diffM = Math.abs(this.distanceGuessM - this.distanceM);
    this.distanceFeedback = diffM <= this.distanceToleranceM ? 'correct' : 'wrong';
    if (this.distanceFeedback === 'correct') {
      this.distanceCorrectCount++;
    }
  }

  next(): void {
    this.round++;
    this.feedback = null;
    this.guessInput = '';
    this.distanceFeedback = null;
    this.upperGuessInput = '';
    this.lowerGuessInput = '';

    const steps = Math.round((this.maxDistanceM - this.minDistanceM) / this.distanceStepM);
    this.distanceM = this.minDistanceM + this.distanceStepM * Math.floor(Math.random() * (steps + 1));

    const half = this.distanceM / (2 * this.stadiaConstant);
    const buffer = 0.05;
    const low = this.rodMinM + half + buffer;
    const high = this.rodMaxM - half - buffer;
    let bandLow = Math.max(low, 1.2);
    let bandHigh = Math.min(high, 1.7);
    if (bandLow > bandHigh) {
      bandLow = low;
      bandHigh = high;
    }
    const useBand = Math.random() < 0.8;
    const rangeLow = useBand ? bandLow : low;
    const rangeHigh = useBand ? bandHigh : high;
    const mm = Math.round((rangeLow + Math.random() * (rangeHigh - rangeLow)) * 1000);
    this.target = mm / 1000;
  }

  private parseNumber(raw: string): number {
    return parseFloat(raw.replace(',', '.').trim());
  }

  private buildRodCells(): RodCell[] {
    const fieldH = 2;
    const fieldsPerDecimeter = 5;
    const decimeterCount = (this.rodMaxM - this.rodMinM) * 10;
    // Lattenhaelfte im selben Verhaeltnis zur Feldhoehe wie in der Referenz
    // (HALF_W 70 : FIELD_H 100 = 0.7) — sonst wirken die Felder gestaucht.
    const rodLeft = 10;
    const halfW = fieldH * 0.7;
    const centerX = rodLeft + halfW;
    const toothWidth = halfW * 0.45;
    const notchOuterWidth = halfW * 0.55;
    const cells: RodCell[] = [];

    for (let d = 0; d < decimeterCount; d++) {
      const activeLeft = d % 2 === 0;
      const fullX = activeLeft ? rodLeft : centerX;
      const outerX = activeLeft ? rodLeft : centerX + toothWidth;
      const toothX = activeLeft ? centerX : centerX - toothWidth;
      const decBaseY = d * 10;

      for (let f = 0; f < fieldsPerDecimeter; f++) {
        const fieldBaseY = decBaseY + f * fieldH;

        if (f === 0) {
          cells.push({ svgY: fieldBaseY, x: toothX, width: toothWidth, height: fieldH * 0.15 });
          cells.push({ svgY: fieldBaseY + fieldH * 0.5, x: toothX, width: toothWidth, height: fieldH * 0.33 });
        } else {
          const notchLower = (f - 1) % 2 === 0;
          if (notchLower) {
            cells.push({ svgY: fieldBaseY, x: fullX, width: halfW, height: fieldH * 0.55 });
            cells.push({ svgY: fieldBaseY + fieldH * 0.55, x: outerX, width: notchOuterWidth, height: fieldH * 0.35 });
            cells.push({ svgY: fieldBaseY + fieldH * 0.9, x: fullX, width: halfW, height: fieldH * 0.1 });
          } else {
            cells.push({ svgY: fieldBaseY, x: fullX, width: halfW, height: fieldH * 0.1 });
            cells.push({ svgY: fieldBaseY + fieldH * 0.1, x: outerX, width: notchOuterWidth, height: fieldH * 0.35 });
            cells.push({ svgY: fieldBaseY + fieldH * 0.45, x: fullX, width: halfW, height: fieldH * 0.55 });
          }
        }
      }
    }
    return cells;
  }

  private buildDecimeterLabels(): DecimeterLabel[] {
    const decimeterCount = (this.rodMaxM - this.rodMinM) * 10;
    const rodLeft = 10;
    const halfW = 2 * 0.7;
    const labels: DecimeterLabel[] = [];
    for (let d = 0; d < decimeterCount; d++) {
      const activeLeft = d % 2 === 0;
      const decBaseY = d * 10;
      const heightM = this.rodMaxM - (decBaseY + 10) / 100;
      const value = Math.round(heightM * 10);
      const x = activeLeft ? rodLeft + halfW / 2 : rodLeft + halfW + halfW / 2;
      labels.push({ svgY: decBaseY + 1.44, x, text: String(value).padStart(2, '0') });
    }
    return labels;
  }

  private buildDecimeterTicks(): number[] {
    const heightCm = (this.rodMaxM - this.rodMinM) * 100;
    const fieldH = 2;
    const ticks: number[] = [];
    for (let y = 0; y <= heightCm; y += fieldH) {
      ticks.push(y);
    }
    return ticks;
  }
}
