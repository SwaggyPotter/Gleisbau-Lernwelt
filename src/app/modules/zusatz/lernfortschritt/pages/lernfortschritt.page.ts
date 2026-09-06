import { Component, OnInit } from '@angular/core';
import { GesamtFortschritt } from '../models/lernfortschritt.models';
import { LernfortschrittDataService } from '../services/lernfortschritt-data.service';

@Component({
  selector: 'app-lernfortschritt',
  templateUrl: './lernfortschritt.page.html',
  styleUrls: ['./lernfortschritt.page.scss'],
  standalone: false,
})
export class LernfortschrittPage implements OnInit {
  fortschritt: GesamtFortschritt | null = null;
  ladefehler = false;
  nurBegonnen = true;

  constructor(private readonly data: LernfortschrittDataService) {}

  ngOnInit(): void {
    this.data.laden().subscribe({
      next: f => { this.fortschritt = f; },
      error: () => { this.ladefehler = true; },
    });
  }

  quote(richtig: number, versuche: number): number {
    return versuche === 0 ? 0 : Math.round((richtig / versuche) * 100);
  }

  get sichtbareThemen() {
    if (!this.fortschritt) return [];
    return this.nurBegonnen ? this.fortschritt.themen.filter(t => t.beantwortet > 0) : this.fortschritt.themen;
  }

  get sichtbareRechentrainer() {
    if (!this.fortschritt) return [];
    return this.nurBegonnen ? this.fortschritt.rechentrainer.filter(r => r.versuche > 0 || (r.bestStreak ?? 0) > 0) : this.fortschritt.rechentrainer;
  }
}
