import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ThemenquizQuestion } from '../../../../themenquiz/models/themenquiz.models';
import { ZEITLIMIT_SEK } from '../../models/quizduell.models';

export interface DuellAntwortEvent {
  index: number | null;
  zeitMs: number;
}

/**
 * Reine Anzeige-/Timer-Komponente fuer eine Duell-Frage: bekommt die Frage
 * von aussen, zaehlt selbst das Zeitlimit herunter (wie beim Vorbild
 * "Quizduell": 20 Sekunden pro Frage) und meldet Auswahl ODER Zeitablauf per
 * Output. Kennt weder Rundenzaehler noch Spielername -- das steht in der
 * Runden-Kopfzeile der DuellPage, nicht hier.
 */
@Component({
  selector: 'app-duell-frage',
  standalone: false,
  templateUrl: './duell-frage.component.html',
  styleUrls: ['./duell-frage.component.scss'],
})
export class DuellFrageComponent implements OnChanges, OnDestroy {
  @Input() frage!: ThemenquizQuestion;
  @Input() zeitlimitSek = ZEITLIMIT_SEK;
  /** Von aussen gesetzt, sobald eine Antwort feststeht (Auswahl ODER Zeitablauf) -- steuert die Aufdeckung. */
  @Input() beantwortet = false;
  @Input() gewaehlterIndex: number | null = null;

  @Output() antwortGewaehlt = new EventEmitter<DuellAntwortEvent>();

  restSek = this.zeitlimitSek;

  private startZeit = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['frage']) {
      this.starteTimer();
    }
  }

  ngOnDestroy(): void {
    this.stoppeTimer();
  }

  waehle(index: number): void {
    if (this.beantwortet) return;
    const zeitMs = Date.now() - this.startZeit;
    this.stoppeTimer();
    this.antwortGewaehlt.emit({ index, zeitMs });
  }

  istKorrekt(index: number): boolean {
    return index === this.frage.correctIndex;
  }

  istAusgewaehlt(index: number): boolean {
    return this.gewaehlterIndex === index;
  }

  private starteTimer(): void {
    this.stoppeTimer();
    this.startZeit = Date.now();
    this.restSek = this.zeitlimitSek;
    this.intervalId = setInterval(() => {
      const vergangenSek = (Date.now() - this.startZeit) / 1000;
      this.restSek = Math.max(0, Math.ceil(this.zeitlimitSek - vergangenSek));
      if (vergangenSek >= this.zeitlimitSek) {
        this.stoppeTimer();
        this.antwortGewaehlt.emit({ index: null, zeitMs: this.zeitlimitSek * 1000 });
      }
    }, 200);
  }

  private stoppeTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
