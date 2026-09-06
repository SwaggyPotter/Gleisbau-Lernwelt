import { Component, OnDestroy, OnInit } from '@angular/core';
import { QuizQuestion } from '../../gesamtquiz/models/gesamtquiz.models';
import { GesamtquizDataService } from '../../gesamtquiz/services/gesamtquiz-data.service';
import { PruefungssimulationDataService } from '../services/pruefungssimulation-data.service';
import { Phase, PruefungsErgebnis, PruefungssimulationHistorie } from '../models/pruefungssimulation.models';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';

const SEKUNDEN_PRO_FRAGE = 75;
const BESTEHENSGRENZE_PROZENT = 50;

@Component({
  selector: 'app-pruefungssimulation',
  templateUrl: './pruefungssimulation.page.html',
  styleUrls: ['./pruefungssimulation.page.scss'],
  standalone: false,
})
export class PruefungssimulationPage implements OnInit, OnDestroy {
  readonly fragenzahlOptionen = [15, 25, 40];
  readonly bestehensgrenze = BESTEHENSGRENZE_PROZENT;

  phase: Phase = 'setup';
  ladefehler = false;
  gewaehlteFragenzahl = 25;

  private alleFragen: QuizQuestion[] = [];
  aktiveFragen: QuizQuestion[] = [];
  antworten: Record<string, string | null> = {};
  currentIndex = 0;

  restSekunden = 0;
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  ergebnis: PruefungsErgebnis | null = null;
  historie!: PruefungssimulationHistorie;

  constructor(
    private readonly gesamtquiz: GesamtquizDataService,
    private readonly data: PruefungssimulationDataService,
    private readonly profilSync: ProfilSyncService,
  ) {}

  ngOnInit(): void {
    this.historie = this.data.laden();
    this.gesamtquiz.getQuiz().subscribe({
      next: quiz => { this.alleFragen = quiz.questions; },
      error: () => { this.ladefehler = true; },
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get aktuelleFrage(): QuizQuestion | undefined {
    return this.aktiveFragen[this.currentIndex];
  }

  get beantworteteAnzahl(): number {
    return Object.values(this.antworten).filter(v => v !== null).length;
  }

  get restzeitFormatiert(): string {
    const m = Math.floor(this.restSekunden / 60);
    const s = this.restSekunden % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  starten(): void {
    if (this.alleFragen.length === 0) return;
    this.aktiveFragen = this.mische(this.alleFragen).slice(0, Math.min(this.gewaehlteFragenzahl, this.alleFragen.length));
    this.antworten = {};
    for (const f of this.aktiveFragen) this.antworten[f.id] = null;
    this.currentIndex = 0;
    this.restSekunden = this.aktiveFragen.length * SEKUNDEN_PRO_FRAGE;
    this.ergebnis = null;
    this.phase = 'running';

    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.restSekunden--;
      if (this.restSekunden <= 0) this.beenden(true);
    }, 1000);
  }

  waehle(choiceId: string): void {
    const f = this.aktuelleFrage;
    if (!f) return;
    this.antworten[f.id] = choiceId;
  }

  zurueck(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  weiter(): void {
    if (this.currentIndex < this.aktiveFragen.length - 1) this.currentIndex++;
  }

  springeZu(index: number): void {
    this.currentIndex = index;
  }

  beenden(durchZeit = false): void {
    this.stopTimer();
    const gesamt = this.aktiveFragen.length;
    const richtig = this.aktiveFragen.filter(f => this.antworten[f.id] === f.answer).length;
    const prozent = gesamt === 0 ? 0 : Math.round((richtig / gesamt) * 100);

    this.ergebnis = {
      datum: new Date().toISOString(),
      anzahlFragen: gesamt,
      richtig,
      prozent,
      bestanden: prozent >= BESTEHENSGRENZE_PROZENT,
      abgebrochenDurchZeit: durchZeit,
    };
    this.historie = this.data.speichern(this.ergebnis);
    for (const f of this.aktiveFragen) {
      this.profilSync.melde('zusatz:pruefungssimulation', this.antworten[f.id] === f.answer);
    }
    this.phase = 'finished';
  }

  neuerVersuch(): void {
    this.phase = 'setup';
  }

  antwortKlasse(frage: QuizQuestion, choiceId: string): string {
    if (this.phase !== 'finished') {
      return this.antworten[frage.id] === choiceId ? 'selected' : '';
    }
    if (choiceId === frage.answer) return 'correct';
    if (this.antworten[frage.id] === choiceId) return 'wrong';
    return '';
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
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
