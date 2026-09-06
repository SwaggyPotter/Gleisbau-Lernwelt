import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GesamtFortschritt, PruefungsKurz, RechentrainerFortschritt, ThemaFortschritt } from '../models/lernfortschritt.models';

interface TopicMeta {
  topicId: string;
  title: string;
  questionCount: number;
}

function leseQuizStats(key: string): { beantwortet: number; correct: number; wrong: number } {
  const raw = localStorage.getItem(key);
  if (!raw) return { beantwortet: 0, correct: 0, wrong: 0 };
  try {
    const parsed = JSON.parse(raw) as { quizStats?: Record<string, { correct: number; wrong: number }> };
    const eintraege = Object.values(parsed.quizStats ?? {});
    return eintraege.reduce<{ beantwortet: number; correct: number; wrong: number }>(
      (acc, e) => ({ beantwortet: acc.beantwortet + 1, correct: acc.correct + e.correct, wrong: acc.wrong + e.wrong }),
      { beantwortet: 0, correct: 0, wrong: 0 },
    );
  } catch {
    return { beantwortet: 0, correct: 0, wrong: 0 };
  }
}

function leseStreakProgress(key: string): { correct: number; total: number; streak: number; bestStreak: number } {
  const raw = localStorage.getItem(key);
  if (!raw) return { correct: 0, total: 0, streak: 0, bestStreak: 0 };
  try {
    const p = JSON.parse(raw) as { correct?: number; total?: number; streak?: number; bestStreak?: number };
    return { correct: p.correct ?? 0, total: p.total ?? 0, streak: p.streak ?? 0, bestStreak: p.bestStreak ?? 0 };
  } catch {
    return { correct: 0, total: 0, streak: 0, bestStreak: 0 };
  }
}

@Injectable({ providedIn: 'root' })
export class LernfortschrittDataService {
  constructor(private readonly http: HttpClient) {}

  laden(): Observable<GesamtFortschritt> {
    return this.http.get<TopicMeta[]>('assets/themenquiz/topics.json').pipe(
      map(topics => this.zusammenstellen(topics)),
    );
  }

  private zusammenstellen(topics: TopicMeta[]): GesamtFortschritt {
    const themen: ThemaFortschritt[] = topics.map(t => {
      const s = leseQuizStats(`themenquiz-progress-${t.topicId}`);
      return { topicId: t.topicId, title: t.title, beantwortet: s.beantwortet, gesamt: t.questionCount, richtig: s.correct, falsch: s.wrong };
    });

    const gesamtquiz = leseQuizStats('zusatz-gesamtquiz-progress');
    const volumen = leseQuizStats('volumen-progress');
    const prozent = leseQuizStats('prozentrechnung-progress');
    const nivellieren = leseQuizStats('nivellieren-progress');

    const materialrechner = this.leseMaterialrechner();
    const trassierung = leseStreakProgress('trassierung-progress');
    const weichenrechner = leseStreakProgress('weichenrechner-progress');
    const schienendehnung = leseStreakProgress('schienendehnung-progress');
    const nivellierlatteBest = Number(localStorage.getItem('nivellierlatte-highscore') ?? 0);

    const rechentrainer: RechentrainerFortschritt[] = [
      { id: 'gesamtquiz', label: 'Gesamtquiz alle Module', link: '/zusatz/gesamtquiz', richtig: gesamtquiz.correct, versuche: gesamtquiz.correct + gesamtquiz.wrong },
      { id: 'volumen', label: 'Volumen berechnen', link: '/zusatz/volumen', richtig: volumen.correct, versuche: volumen.correct + volumen.wrong },
      { id: 'prozentrechnung', label: 'Prozentrechnung', link: '/zusatz/prozentrechnung', richtig: prozent.correct, versuche: prozent.correct + prozent.wrong },
      { id: 'nivellieren', label: 'Nivellieren im Gleisbau', link: '/zusatz/nivellieren', richtig: nivellieren.correct, versuche: nivellieren.correct + nivellieren.wrong },
      { id: 'materialrechner', label: 'Materialrechner', link: '/zusatz/materialrechner', richtig: materialrechner.correct, versuche: materialrechner.total },
      { id: 'trassierung', label: 'Trassierungsrechner', link: '/zusatz/trassierung', richtig: trassierung.correct, versuche: trassierung.total, streak: trassierung.streak, bestStreak: trassierung.bestStreak },
      { id: 'weichenrechner', label: 'Weichengeometrie-Rechner', link: '/zusatz/weichenrechner', richtig: weichenrechner.correct, versuche: weichenrechner.total, streak: weichenrechner.streak, bestStreak: weichenrechner.bestStreak },
      { id: 'schienendehnung', label: 'Schienenausdehnungs-Rechner', link: '/zusatz/schienendehnung', richtig: schienendehnung.correct, versuche: schienendehnung.total, streak: schienendehnung.streak, bestStreak: schienendehnung.bestStreak },
      { id: 'nivellierlatte', label: 'Nivellierlatte ablesen', link: '/zusatz/nivellierlatte', richtig: 0, versuche: 0, bestStreak: nivellierlatteBest },
    ];

    const pruefung = this.lesePruefungshistorie();

    let summeBeantwortetGesamt = 0;
    let summeRichtigGesamt = 0;
    let summeVersucheGesamt = 0;
    for (const t of themen) { summeVersucheGesamt += t.richtig + t.falsch; summeRichtigGesamt += t.richtig; }
    for (const r of rechentrainer) { summeVersucheGesamt += r.versuche; summeRichtigGesamt += r.richtig; }
    summeBeantwortetGesamt = summeVersucheGesamt;

    return {
      themen,
      rechentrainer,
      pruefung,
      summeBeantwortet: summeBeantwortetGesamt,
      summeRichtig: summeRichtigGesamt,
      summeQuote: summeVersucheGesamt === 0 ? 0 : Math.round((summeRichtigGesamt / summeVersucheGesamt) * 100),
    };
  }

  private leseMaterialrechner(): { correct: number; total: number } {
    const raw = localStorage.getItem('materialrechner-progress');
    if (!raw) return { correct: 0, total: 0 };
    try {
      const p = JSON.parse(raw) as { stats?: Record<string, { correct: number; wrong: number }> };
      const eintraege = Object.values(p.stats ?? {});
      return eintraege.reduce<{ correct: number; total: number }>((acc, e) => ({ correct: acc.correct + e.correct, total: acc.total + e.correct + e.wrong }), { correct: 0, total: 0 });
    } catch {
      return { correct: 0, total: 0 };
    }
  }

  private lesePruefungshistorie(): { bestesProzent: number; anzahlVersuche: number; letzte: PruefungsKurz[] } {
    const raw = localStorage.getItem('pruefungssimulation-historie');
    if (!raw) return { bestesProzent: 0, anzahlVersuche: 0, letzte: [] };
    try {
      const p = JSON.parse(raw) as { versuche?: Array<{ datum: string; prozent: number; bestanden: boolean }>; bestesProzent?: number };
      const versuche = p.versuche ?? [];
      return {
        bestesProzent: p.bestesProzent ?? 0,
        anzahlVersuche: versuche.length,
        letzte: versuche.slice(0, 5).map(v => ({ datum: v.datum, prozent: v.prozent, bestanden: v.bestanden })),
      };
    } catch {
      return { bestesProzent: 0, anzahlVersuche: 0, letzte: [] };
    }
  }
}
