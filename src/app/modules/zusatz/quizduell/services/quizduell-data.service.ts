import { Injectable } from '@angular/core';
import { ThemenquizQuestion, ThemenquizTopic } from '../../../themenquiz/models/themenquiz.models';
import {
  ACHIEVEMENTS,
  BOT_NAMEN,
  FRAGEN_PRO_RUNDE,
  GEGNER_TREFFERQUOTE,
  KATEGORIE_OPTIONEN_ANZAHL,
  QuizduellMatch,
  QuizduellRunde,
  QuizduellStats,
  RUNDEN_PRO_MATCH,
} from '../models/quizduell.models';

const STATS_PREFIX = 'quizduell-stats-';
const GAST_NAME_KEY = 'quizduell-gast-name';
const OFFENE_MATCHES_KEY = 'quizduell-offene-matches';
const START_RATING = 1000;
const K_FAKTOR = 32;

const LEERE_STATS: QuizduellStats = {
  rating: START_RATING,
  matches: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  longestStreak: 0,
  questionsCorrect: 0,
  questionsTotal: 0,
  achievements: [],
};

export interface MatchAuswertung {
  spielerRichtig: number;
  gegnerRichtig: number;
  gewinner: 'spieler' | 'gegner' | 'unentschieden';
}

/**
 * Datenservice fuer das Quiz-Duell: reine Berechnungen (Kategorie-/Fragen-
 * Auswahl, simulierter Gegner, Auswertung, Rating, Statistik/
 * Errungenschaften). Der Gegner ist immer ein Bot (kein echtes Backend fuer
 * echte Mitspieler) -- seine Trefferquote ist bewusst simpel simuliert
 * (feste Wahrscheinlichkeit pro Frage), keine echte KI. Statistiken werden
 * -- wie schon bei question-report.service.ts -- ueber eine einzige
 * Schreibstelle (aktualisiereStatistikNachMatch) persistiert, damit das
 * spaeter ohne Aenderung der Aufrufer durch einen echten HTTP-Aufruf ans
 * Backend ersetzt werden kann.
 */
@Injectable({ providedIn: 'root' })
export class QuizduellDataService {
  erstelleMatch(spielerName: string, spielerUserId: string | null): QuizduellMatch {
    const runden: QuizduellRunde[] = [];
    for (let i = 0; i < RUNDEN_PRO_MATCH; i++) {
      runden.push({
        nummer: i + 1,
        spielerWaehlt: i % 2 === 0,
        kategorieOptionen: [],
        gewaehlteKategorie: null,
        frageIds: [],
        spielerAntworten: [],
        gegnerRichtigeAnzahl: null,
      });
    }
    return {
      id: crypto.randomUUID(),
      spielerName,
      spielerUserId,
      gegnerName: this.zufaelligerBotName(),
      runden,
      aktuelleRundeIndex: 0,
      phase: 'lobby',
      gewinner: null,
      erstelltAm: new Date().toISOString(),
      abgeschlossenAm: null,
    };
  }

  zufaelligerBotName(): string {
    return BOT_NAMEN[Math.floor(Math.random() * BOT_NAMEN.length)];
  }

  /** Fallback-Name, falls beim Duell-Start kein Name eingetragen wurde (analog zu den Bot-Namen). */
  zufaelligerGastName(): string {
    return 'Gast_' + Math.floor(1000 + Math.random() * 9000);
  }

  ladeGespeichertenGastNamen(): string {
    return localStorage.getItem(GAST_NAME_KEY) ?? '';
  }

  speichereGastNamen(name: string): void {
    if (!name.trim()) return;
    localStorage.setItem(GAST_NAME_KEY, name.trim());
  }

  /** Bis zu `anzahl` zufaellige Themen mit genug Fragen, die in diesem Match noch nicht dran waren. */
  waehleKategorieOptionen(alleThemen: ThemenquizTopic[], bereitsGenutzt: string[], anzahl = KATEGORIE_OPTIONEN_ANZAHL): ThemenquizTopic[] {
    const genugFragen = alleThemen.filter((t) => t.questionCount >= FRAGEN_PRO_RUNDE);
    const nochNichtGenutzt = genugFragen.filter((t) => !bereitsGenutzt.includes(t.topicId));
    const pool = nochNichtGenutzt.length >= anzahl ? nochNichtGenutzt : genugFragen;
    return this.mischen(pool).slice(0, Math.min(anzahl, pool.length));
  }

  waehleZufaelligeFragen(fragen: ThemenquizQuestion[], anzahl = FRAGEN_PRO_RUNDE): ThemenquizQuestion[] {
    return this.mischen(fragen).slice(0, Math.min(anzahl, fragen.length));
  }

  /** Wuerfelt die Trefferzahl des Bots fuer eine Runde -- keine Einzelfragen, nur eine plausible Gesamtzahl. */
  simuliereGegnerRunde(): number {
    let richtig = 0;
    for (let i = 0; i < FRAGEN_PRO_RUNDE; i++) {
      if (Math.random() < GEGNER_TREFFERQUOTE) richtig += 1;
    }
    return richtig;
  }

  wertMatchAus(match: QuizduellMatch): MatchAuswertung {
    let spielerRichtig = 0;
    let gegnerRichtig = 0;
    for (const runde of match.runden) {
      spielerRichtig += runde.spielerAntworten.filter((a) => a.richtig).length;
      gegnerRichtig += runde.gegnerRichtigeAnzahl ?? 0;
    }
    const gewinner = spielerRichtig === gegnerRichtig ? 'unentschieden' : spielerRichtig > gegnerRichtig ? 'spieler' : 'gegner';
    return { spielerRichtig, gegnerRichtig, gewinner };
  }

  /** Statistik nach einem abgeschlossenen Match fortschreiben -- nur wenn eingeloggt gespielt. */
  aktualisiereStatistikNachMatch(match: QuizduellMatch, auswertung: MatchAuswertung): void {
    if (!match.spielerUserId) return;

    const gesamtFragen = match.runden.length * FRAGEN_PRO_RUNDE;
    const ergebnis: 1 | 0.5 | 0 = auswertung.gewinner === 'unentschieden' ? 0.5 : auswertung.gewinner === 'spieler' ? 1 : 0;

    const stats = this.loadStats(match.spielerUserId);
    stats.rating = Math.round(stats.rating + this.ratingAenderung(stats.rating, START_RATING, ergebnis));
    stats.matches += 1;
    stats.questionsCorrect += auswertung.spielerRichtig;
    stats.questionsTotal += gesamtFragen;

    if (ergebnis === 0.5) {
      stats.draws += 1;
      stats.currentStreak = 0;
    } else if (ergebnis === 1) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    } else {
      stats.losses += 1;
      stats.currentStreak = 0;
    }

    const perfektesDuell = auswertung.spielerRichtig === gesamtFragen;
    const perfekteRunde = match.runden.some((r) => r.spielerAntworten.filter((a) => a.richtig).length === FRAGEN_PRO_RUNDE);
    const schnellsteRichtigeMs = Math.min(
      ...match.runden.flatMap((r) => r.spielerAntworten.filter((a) => a.richtig).map((a) => a.zeitMs)),
      Infinity,
    );

    this.aktualisiereAchievements(stats, { perfekteRunde, perfektesDuell, schnellsteRichtigeMs });
    this.saveStats(match.spielerUserId, stats);
  }

  /**
   * Speichert den aktuellen Match-Stand lokal, damit ein angefangenes Duell
   * spaeter fortgesetzt werden kann ("laufende Spiele"). Ein abgeschlossenes
   * Match wird aus der Liste entfernt (der Verlauf steckt danach in der
   * Statistik, nicht mehr im Match-Objekt selbst).
   */
  speichereMatch(match: QuizduellMatch): void {
    const alle = this.ladeOffeneMatches();
    const index = alle.findIndex((m) => m.id === match.id);
    if (match.phase === 'abgeschlossen') {
      if (index >= 0) alle.splice(index, 1);
    } else if (index >= 0) {
      alle[index] = match;
    } else {
      alle.push(match);
    }
    localStorage.setItem(OFFENE_MATCHES_KEY, JSON.stringify(alle));
  }

  ladeOffeneMatches(): QuizduellMatch[] {
    const raw = localStorage.getItem(OFFENE_MATCHES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QuizduellMatch[];
    } catch {
      return [];
    }
  }

  entferneMatch(matchId: string): void {
    const alle = this.ladeOffeneMatches().filter((m) => m.id !== matchId);
    localStorage.setItem(OFFENE_MATCHES_KEY, JSON.stringify(alle));
  }

  loadStats(userId: string): QuizduellStats {
    const raw = localStorage.getItem(STATS_PREFIX + userId);
    if (!raw) return { ...LEERE_STATS, achievements: [] };
    try {
      return { ...LEERE_STATS, ...(JSON.parse(raw) as QuizduellStats) };
    } catch {
      return { ...LEERE_STATS, achievements: [] };
    }
  }

  private saveStats(userId: string, stats: QuizduellStats): void {
    localStorage.setItem(STATS_PREFIX + userId, JSON.stringify(stats));
  }

  /** Vereinfachtes Elo-Rating (K=32). Realer Quizduell-Algorithmus ist nicht offengelegt, siehe Vault-Notiz. */
  private ratingAenderung(meinRating: number, gegnerRating: number, ergebnis: 1 | 0.5 | 0): number {
    const erwartet = 1 / (1 + 10 ** ((gegnerRating - meinRating) / 400));
    return K_FAKTOR * (ergebnis - erwartet);
  }

  private aktualisiereAchievements(
    stats: QuizduellStats,
    kontext: { perfekteRunde: boolean; perfektesDuell: boolean; schnellsteRichtigeMs: number },
  ): void {
    const unlocked = new Set(stats.achievements);
    if (stats.matches >= 1) unlocked.add('erstes-duell');
    if (stats.wins >= 5) unlocked.add('fuenf-siege');
    if (stats.wins >= 20) unlocked.add('zwanzig-siege');
    if (stats.currentStreak >= 3) unlocked.add('serie-drei');
    if (stats.currentStreak >= 10) unlocked.add('serie-zehn');
    if (stats.matches >= 50) unlocked.add('vielspieler');
    if (kontext.perfekteRunde) unlocked.add('perfekte-runde');
    if (kontext.perfektesDuell) unlocked.add('perfektes-duell');
    if (kontext.schnellsteRichtigeMs < 3000) unlocked.add('blitzantwort');
    stats.achievements = ACHIEVEMENTS.map((a) => a.id).filter((id) => unlocked.has(id));
  }

  private mischen<T>(liste: T[]): T[] {
    const kopie = [...liste];
    for (let i = kopie.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    }
    return kopie;
  }
}
