import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ThemenquizQuestion, ThemenquizTopic } from '../modules/themenquiz/models/themenquiz.models';
import { ThemenquizDataService } from '../modules/themenquiz/services/themenquiz-data.service';

interface ThemenGruppe {
  topic: ThemenquizTopic;
  questions: ThemenquizQuestion[];
  offen: boolean;
  mitQuelle: number;
}

@Component({
  selector: 'app-quellenverzeichnis',
  templateUrl: './quellenverzeichnis.page.html',
  styleUrls: ['./quellenverzeichnis.page.scss'],
  standalone: false,
})
export class QuellenverzeichnisPage implements OnInit {
  loading = true;
  error = '';
  gruppen: ThemenGruppe[] = [];
  suchbegriff = '';

  gesamtFragen = 0;
  gesamtMitQuelle = 0;

  constructor(private readonly data: ThemenquizDataService) {}

  ngOnInit(): void {
    this.data.getTopics().subscribe({
      next: (topics) => {
        forkJoin(topics.map((t) => this.data.getQuiz(t.topicId))).subscribe({
          next: (files) => {
            this.gruppen = topics.map((topic, i) => {
              const questions = files[i].questions;
              const mitQuelle = questions.filter((q) => q.source && q.sourceUrl).length;
              this.gesamtFragen += questions.length;
              this.gesamtMitQuelle += mitQuelle;
              return { topic, questions, offen: false, mitQuelle };
            });
            this.loading = false;
          },
          error: () => {
            this.error = 'Die Fragen konnten nicht geladen werden.';
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Die Themenliste konnte nicht geladen werden.';
        this.loading = false;
      },
    });
  }

  toggle(gruppe: ThemenGruppe): void {
    gruppe.offen = !gruppe.offen;
  }

  /** Fragen einer Gruppe, gefiltert nach Suchbegriff (Frage, Antworten, Quelle). */
  gefilterteFragen(gruppe: ThemenGruppe): ThemenquizQuestion[] {
    const begriff = this.suchbegriff.trim().toLowerCase();
    if (!begriff) return gruppe.questions;
    return gruppe.questions.filter((q) => {
      const heuhaufen = [q.question, ...q.choices, q.source ?? ''].join(' ').toLowerCase();
      return heuhaufen.includes(begriff);
    });
  }

  /** Ob eine Gruppe beim aktiven Suchbegriff ueberhaupt Treffer hat. */
  hatTreffer(gruppe: ThemenGruppe): boolean {
    return this.gefilterteFragen(gruppe).length > 0;
  }

  istOffen(gruppe: ThemenGruppe): boolean {
    return gruppe.offen || (this.suchbegriff.trim().length > 0 && this.hatTreffer(gruppe));
  }

  richtigeAntwort(q: ThemenquizQuestion): string {
    return q.choices[q.correctIndex] ?? '';
  }

  trackByTopic(_: number, g: ThemenGruppe): string {
    return g.topic.topicId;
  }

  trackByQuestion(_: number, q: ThemenquizQuestion): string {
    return q.id;
  }
}
