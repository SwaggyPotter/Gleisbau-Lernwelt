import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../core/api-config';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LokaleModulStat, ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';
import { MODUL_LABELS, modulLabel } from '../../../konto/module-labels';
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

/** Module, die es nicht mehr gibt – nicht mehr im Lernfortschritt zeigen */
const ENTFERNT = new Set(['zusatz:trassierung']);

interface ServerModulStat {
  moduleKey: string;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

@Injectable({ providedIn: 'root' })
export class LernfortschrittDataService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  laden(): Observable<GesamtFortschritt> {
    // Server-Statistik (Konto oder Gastzugang) – fehlt sie, zählen nur die Browser-Daten.
    const server$ = this.auth.isLoggedIn
      ? this.http.get<{ module: ServerModulStat[] }>(`${API_BASE_URL}/stats/me`).pipe(
          map(r => r.module ?? []),
          catchError(() => of([] as ServerModulStat[])),
        )
      : of([] as ServerModulStat[]);
    return forkJoin([this.http.get<TopicMeta[]>('assets/themenquiz/topics.json'), server$]).pipe(
      map(([topics, server]) => this.zusammenstellen(topics, server)),
    );
  }

  private zusammenstellen(topics: TopicMeta[], server: ServerModulStat[]): GesamtFortschritt {
    // Pro Modul-Schlüssel die Quelle mit den meisten Versuchen nehmen (Server, lokale Sync-Statistik)
    const lokal = ProfilSyncService.lokaleStatistik();
    const zentral: Record<string, LokaleModulStat> = {};
    const nimm = (key: string, s: LokaleModulStat) => {
      const alt = zentral[key];
      if (!alt || s.correct + s.wrong > alt.correct + alt.wrong) zentral[key] = { ...s, bestStreak: Math.max(s.bestStreak, alt?.bestStreak ?? 0) };
      else alt.bestStreak = Math.max(alt.bestStreak, s.bestStreak);
    };
    for (const [k, s] of Object.entries(lokal)) nimm(k, s);
    for (const s of server) nimm(s.moduleKey, { correct: s.correct, wrong: s.wrong, streak: s.streak, bestStreak: s.bestStreak });

    const themen: ThemaFortschritt[] = topics.map(t => {
      const s = leseQuizStats(`themenquiz-progress-${t.topicId}`);
      const z = zentral[`themenquiz:${t.topicId}`];
      const zentralBesser = !!z && z.correct + z.wrong > s.correct + s.wrong;
      return {
        topicId: t.topicId, title: t.title,
        beantwortet: Math.min(t.questionCount, Math.max(s.beantwortet, zentralBesser ? Math.min(t.questionCount, z.correct + z.wrong) : 0)),
        gesamt: t.questionCount,
        richtig: zentralBesser ? z.correct : s.correct,
        falsch: zentralBesser ? z.wrong : s.wrong,
      };
    });

    const gesamtquiz = leseQuizStats('zusatz-gesamtquiz-progress');
    const volumen = leseQuizStats('volumen-progress');
    const prozent = leseQuizStats('prozentrechnung-progress');
    const nivellieren = leseQuizStats('nivellieren-progress');

    const materialrechner = this.leseMaterialrechner();
    const weichenrechner = leseStreakProgress('weichenrechner-progress');
    const schienendehnung = leseStreakProgress('schienendehnung-progress');
    const nivellierlatteBest = Number(localStorage.getItem('nivellierlatte-highscore') ?? 0);

    const rechentrainer: RechentrainerFortschritt[] = [
      { id: 'gesamtquiz', label: 'Gesamtquiz alle Module', link: '/zusatz/gesamtquiz', richtig: gesamtquiz.correct, versuche: gesamtquiz.correct + gesamtquiz.wrong },
      { id: 'volumen', label: 'Volumen berechnen', link: '/zusatz/volumen', richtig: volumen.correct, versuche: volumen.correct + volumen.wrong },
      { id: 'prozentrechnung', label: 'Prozentrechnung', link: '/zusatz/prozentrechnung', richtig: prozent.correct, versuche: prozent.correct + prozent.wrong },
      { id: 'nivellieren', label: 'Nivellieren im Gleisbau', link: '/zusatz/nivellieren', richtig: nivellieren.correct, versuche: nivellieren.correct + nivellieren.wrong },
      { id: 'materialrechner', label: 'Materialrechner', link: '/zusatz/materialrechner', richtig: materialrechner.correct, versuche: materialrechner.total },
      { id: 'weichenrechner', label: 'Weichengeometrie-Rechner', link: '/zusatz/weichenrechner', richtig: weichenrechner.correct, versuche: weichenrechner.total, streak: weichenrechner.streak, bestStreak: weichenrechner.bestStreak },
      { id: 'schienendehnung', label: 'Schienenausdehnungs-Rechner', link: '/zusatz/schienendehnung', richtig: schienendehnung.correct, versuche: schienendehnung.total, streak: schienendehnung.streak, bestStreak: schienendehnung.bestStreak },
      { id: 'nivellierlatte', label: 'Nivellierlatte ablesen', link: '/zusatz/nivellierlatte', richtig: 0, versuche: 0, bestStreak: nivellierlatteBest },
    ];

    // Gegen die zentrale Statistik abgleichen und alle übrigen Module (Schotterbett, Trassenplan,
    // Baumaschinen, Prüfungssimulation, künftige …) ergänzen – auch wenn noch nichts begonnen wurde.
    for (const r of rechentrainer) {
      const z = zentral[`zusatz:${r.id}`];
      if (!z) continue;
      if (z.correct + z.wrong > r.versuche) { r.richtig = z.correct; r.versuche = z.correct + z.wrong; }
      if (z.bestStreak > 0) r.bestStreak = Math.max(r.bestStreak ?? 0, z.bestStreak);
    }
    const bekannt = new Set(rechentrainer.map(r => `zusatz:${r.id}`));
    const weitere = new Set([...Object.keys(MODUL_LABELS), ...Object.keys(zentral)]);
    for (const key of weitere) {
      if (bekannt.has(key) || key.startsWith('themenquiz:') || ENTFERNT.has(key)) continue;
      const z = zentral[key];
      const name = key.includes(':') ? key.split(':')[1] : key;
      rechentrainer.push({
        id: name, label: modulLabel(key),
        link: key.startsWith('zusatz:') ? `/zusatz/${name}`
          : key.startsWith('formelsammlung:') ? (name === 'finder' ? '/berufsschule/formelsammlung/formelquiz' : name === 'gemischt' ? '/berufsschule/formelsammlung/pruefung' : `/berufsschule/formelsammlung/${name}`)
          : '/dashboard',
        richtig: z?.correct ?? 0, versuche: z ? z.correct + z.wrong : 0,
        bestStreak: z && z.bestStreak > 0 ? z.bestStreak : undefined,
      });
    }

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
