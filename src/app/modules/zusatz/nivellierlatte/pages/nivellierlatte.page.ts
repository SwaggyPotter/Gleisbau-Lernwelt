import { Component } from '@angular/core';

/**
 * Geometrie der E-Teilung, nach dem echten Lattenvorbild.
 *
 * Masssystem: 1 cm = 10 SVG-Einheiten, ein Dezimeter also 100. Damit sind
 * alle Balken exakt zentimetergenau — das ist der Sinn der E-Teilung, man
 * kann die Zentimeter direkt abzaehlen.
 *
 * Aufteilung pro Dezimeter (wie auf dem Foto):
 * - OBERE 5 cm: das "E" — drei 1-cm-Balken, verbunden durch einen
 *   senkrechten Steg am aeusseren Rand.
 * - UNTERE 5 cm: nur die drei Balken ("Vierecke"), ohne Steg.
 * - Muster und Dezimeterzahl liegen auf gegenueberliegenden Haelften und
 *   wechseln bei jedem Dezimeter gemeinsam die Seite (versetzt).
 */
const UNITS_PER_CM = 10;
const UNITS_PER_DM = UNITS_PER_CM * 10;
const UNITS_PER_M = UNITS_PER_DM * 10;

/** Ein "E" ist 5 cm hoch, also genau die halbe Dezimeterhoehe. */
const E_HEIGHT = 5 * UNITS_PER_CM;
const BAR_HEIGHT = UNITS_PER_CM;
/** Die Latte ist in zwei gleich breite Haelften geteilt: Muster und Zahl. */
const HALF_W = 30;
const STAFF_W = HALF_W * 2;
const CENTER_X = HALF_W;
const SPINE_W = 8;

interface RodRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RodLabel {
  x: number;
  y: number;
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

  /** Referenz-Konstanten, damit das Template dieselben Werte nutzt. */
  readonly staffW = STAFF_W;
  readonly centerX = CENTER_X;
  readonly svgHeight = (this.rodMaxM - this.rodMinM) * UNITS_PER_M;

  /** Distanzkonstante (Fadenkonstante) des Instruments — Standard bei Nivelliergeraeten. */
  readonly stadiaConstant = 100;
  /** Abstand der Distanzstriche von der Ziellinie, als Anteil des sichtbaren Ausschnitts. */
  readonly stadiaFraction = 0.3;
  readonly minDistanceM = 14;
  readonly maxDistanceM = 20;
  readonly distanceStepM = 2;
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

  readonly rodRedCells: RodRect[] = [];
  readonly rodLabels: RodLabel[] = [];
  readonly rodFieldLines: number[] = [];

  constructor() {
    this.buildRod();
    this.bestStreak = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    this.next();
  }

  get crosshairY(): number {
    return (this.rodMaxM - this.target) * UNITS_PER_M;
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

  /**
   * Sichtbarer Ausschnitt im Zielfernrohr (SVG-Einheiten). Waechst mit der
   * simulierten Entfernung: das Fadenkreuz sitzt fix im Okular, je weiter die
   * Latte weg ist, desto mehr Lattenlaenge liegt zwischen den Distanzstrichen.
   */
  get scopeSpan(): number {
    const spanCm = this.distanceM / (2 * this.stadiaFraction);
    return spanCm * (UNITS_PER_M / 100);
  }

  /** viewBox fuer die runde Zoom-Ansicht — zentriert die Ziellinie im Visier. */
  get scopeViewBox(): string {
    const span = this.scopeSpan;
    return `${STAFF_W / 2 - span / 2} ${this.crosshairY - span / 2} ${span} ${span}`;
  }

  /**
   * viewBox fuer das Kontext-Panel. Zeigt wie in der Referenz einen festen
   * Ausschnitt der Latte (dort per `overflow:hidden`), nicht die volle Laenge —
   * sonst waere der Streifen bei 2,5 m Lattenlaenge nur wenige Pixel breit.
   */
  get rodViewBox(): string {
    const span = UNITS_PER_DM * 10;
    const top = Math.min(Math.max(this.crosshairY - span / 2, 0), this.svgHeight - span);
    return `0 ${top} ${STAFF_W} ${span}`;
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

    // Rand so waehlen, dass der komplette Sichtausschnitt auf der Latte liegt.
    const halfSpanM = this.scopeSpan / 2 / UNITS_PER_M;
    const low = this.rodMinM + halfSpanM;
    const high = this.rodMaxM - halfSpanM;
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

  /**
   * Baut die komplette Latte auf. Pro Dezimeter: oben das "E" (Balken + Steg),
   * unten nur die Balken. Muster und Zahl liegen auf gegenueberliegenden
   * Haelften und wechseln bei jedem Dezimeter die Seite.
   */
  private buildRod(): void {
    const dmCount = Math.round((this.rodMaxM - this.rodMinM) * 10);

    for (let dm = 0; dm < dmCount; dm++) {
      const dmTop = dm * UNITS_PER_DM;
      this.rodFieldLines.push(dmTop);

      const patternLeft = dm % 2 === 0;
      const patternX = patternLeft ? 0 : HALF_W;

      // Obere 5 cm: das "E" — Balken plus Steg am aeusseren Rand.
      this.buildBars(dmTop, patternX);
      this.rodRedCells.push({
        x: patternLeft ? patternX : patternX + HALF_W - SPINE_W,
        y: dmTop,
        w: SPINE_W,
        h: E_HEIGHT,
      });

      // Untere 5 cm: nur die Vierecke, ohne Steg.
      this.buildBars(dmTop + E_HEIGHT, patternX);

      // Dezimeterwert auf der Gegenseite, direkt ueber seiner Dezimeterlinie.
      const value = dmCount - 1 - dm;
      this.rodLabels.push({
        x: (patternLeft ? HALF_W : 0) + HALF_W / 2,
        y: dmTop + UNITS_PER_DM * 0.75 + 12,
        text: String(value).padStart(2, '0'),
      });
    }
    this.rodFieldLines.push(dmCount * UNITS_PER_DM);
  }

  /** Drei rote 1-cm-Balken bei 0, 2 und 4 cm — die Basis von E und Vierecken. */
  private buildBars(y0: number, x: number): void {
    for (let i = 0; i < 3; i++) {
      this.rodRedCells.push({
        x,
        y: y0 + i * 2 * UNITS_PER_CM,
        w: HALF_W,
        h: BAR_HEIGHT,
      });
    }
  }
}
