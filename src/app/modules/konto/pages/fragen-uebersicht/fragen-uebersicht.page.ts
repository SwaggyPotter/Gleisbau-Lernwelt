import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ThemenquizDataService } from '../../../themenquiz/services/themenquiz-data.service';

interface BildEintrag {
  key: string;
  file: string;
  credit: string;
}

interface FrageMitBild {
  id: string;
  question: string;
  imageKey?: string;
  bildUrl?: string;
  bildCredit?: string;
}

interface ThemaGruppe {
  topicId: string;
  title: string;
  fragen: FrageMitBild[];
  mitBild: number;
  ohneBild: number;
}

@Component({
  selector: 'app-fragen-uebersicht',
  templateUrl: './fragen-uebersicht.page.html',
  styleUrls: ['./fragen-uebersicht.page.scss'],
  standalone: false,
})
export class FragenUebersichtPage implements OnInit {
  gruppen: ThemaGruppe[] = [];
  geladen = false;
  ladefehler = false;
  nurOhneBild = false;

  constructor(
    private readonly http: HttpClient,
    private readonly themenquiz: ThemenquizDataService,
  ) {}

  ngOnInit(): void {
    this.themenquiz.getTopics().subscribe({
      next: topics => {
        forkJoin({
          bildnachweise: this.http.get<BildEintrag[]>('assets/bilder/bildnachweise.json'),
          quizzes: forkJoin(topics.map(t => this.themenquiz.getQuiz(t.topicId))),
        }).subscribe({
          next: ({ bildnachweise, quizzes }) => {
            const bildMap = new Map(bildnachweise.map(b => [b.key, b]));
            this.gruppen = quizzes.map(q => {
              const fragen: FrageMitBild[] = q.questions.map(f => {
                const bild = f.imageKey ? bildMap.get(f.imageKey) : undefined;
                return { id: f.id, question: f.question, imageKey: f.imageKey, bildUrl: bild?.file, bildCredit: bild?.credit };
              });
              return {
                topicId: q.topicId,
                title: q.title,
                fragen,
                mitBild: fragen.filter(f => f.bildUrl).length,
                ohneBild: fragen.filter(f => !f.bildUrl).length,
              };
            });
            this.geladen = true;
          },
          error: () => { this.ladefehler = true; this.geladen = true; },
        });
      },
      error: () => { this.ladefehler = true; this.geladen = true; },
    });
  }

  sichtbareFragen(g: ThemaGruppe): FrageMitBild[] {
    return this.nurOhneBild ? g.fragen.filter(f => !f.bildUrl) : g.fragen;
  }

  sichtbareGruppen(): ThemaGruppe[] {
    return this.nurOhneBild ? this.gruppen.filter(g => g.ohneBild > 0) : this.gruppen;
  }

  get gesamtFragen(): number {
    return this.gruppen.reduce((s, g) => s + g.fragen.length, 0);
  }

  get gesamtMitBild(): number {
    return this.gruppen.reduce((s, g) => s + g.mitBild, 0);
  }

  get gesamtOhneBild(): number {
    return this.gruppen.reduce((s, g) => s + g.ohneBild, 0);
  }
}
