import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ThemenquizDataService } from '../../../../themenquiz/services/themenquiz-data.service';
import { ThemenquizQuestion, ThemenquizTopic } from '../../../../themenquiz/models/themenquiz.models';
import { AuthService } from '../../services/auth.service';
import { QuizduellDataService, MatchAuswertung } from '../../services/quizduell-data.service';
import {
  FRAGEN_PRO_RUNDE,
  KATEGORIE_EMOJI,
  KATEGORIE_EMOJI_FALLBACK,
  QuizduellMatch,
  QuizduellRunde,
  RUNDEN_PRO_MATCH,
} from '../../models/quizduell.models';
import { DuellAntwortEvent } from '../../components/duell-frage/duell-frage.component';

type PageState = 'setup' | 'match';

/**
 * Quiz-Duell nach dem Vorbild des echten "Quizduell" (siehe
 * Ki Datenspeicher/14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau): 6
 * Runden a 3 Fragen, Kategorie pro Runde wechselt abwechselnd, 20 Sekunden
 * pro Frage. Der Gegner ist immer ein simulierter Bot -- ohne Backend gibt
 * es keine echten Mitspieler, das Matchmaking "sucht" deshalb kurz und
 * faellt dann zuverlaessig auf einen Bot zurueck (macht das Duell auch
 * allein spielbar). Angefangene Matches werden lokal gespeichert
 * (QuizduellDataService.speichereMatch) und koennen als "laufende Spiele"
 * fortgesetzt werden, siehe weiterspielen().
 */
@Component({
  selector: 'app-quizduell-duell',
  standalone: false,
  templateUrl: './duell.page.html',
  styleUrls: ['./duell.page.scss'],
})
export class DuellPage {
  state: PageState = 'setup';

  // --- Setup ---
  gastName = '';
  offeneMatches: QuizduellMatch[] = [];

  // --- Match ---
  match: QuizduellMatch | null = null;
  topics: ThemenquizTopic[] = [];
  aktuelleKategorieOptionen: ThemenquizTopic[] = [];
  aktuelleRundenFragen: ThemenquizQuestion[] = [];
  aktuelleFrageIndexInRunde = 0;
  gewaehlterIndex: number | null = null;
  beantwortet = false;
  matchAuswertung: MatchAuswertung | null = null;

  readonly rundenGesamt = RUNDEN_PRO_MATCH;
  readonly fragenProRunde = FRAGEN_PRO_RUNDE;

  constructor(
    private readonly themenquiz: ThemenquizDataService,
    private readonly auth: AuthService,
    private readonly quizduellData: QuizduellDataService,
  ) {
    this.themenquiz.getTopics().subscribe((topics) => (this.topics = topics));
    this.gastName = this.quizduellData.ladeGespeichertenGastNamen();
  }

  /**
   * Ionic haelt Seiten im DOM am Leben (Navigations-Cache) -- ohne diesen
   * Reset wuerde ein erneuter Besuch der Duell-Seite mitten im zuletzt
   * gespielten Match wieder aufmachen, ohne Moeglichkeit, stattdessen ein
   * neues zu starten. Der laufende Stand ist laengst in localStorage
   * gesichert (persistiere() nach jedem Schritt), geht also nichts verloren
   * -- beim Wiedereinstieg landet man immer auf der Auswahl (neues Duell
   * ODER eines der "laufenden Spiele" fortsetzen), nie automatisch mitten
   * im Spiel.
   */
  ionViewWillEnter(): void {
    this.state = 'setup';
    this.match = null;
    this.matchAuswertung = null;
    this.aktualisiereOffeneMatches();
  }

  get istEingeloggt(): boolean {
    return this.auth.isLoggedIn();
  }

  get angezeigterSpielerName(): string {
    return this.auth.currentUser()?.displayName ?? this.gastName;
  }

  get aktuelleRunde(): QuizduellRunde | null {
    return this.match?.runden[this.match.aktuelleRundeIndex] ?? null;
  }

  get aktuelleFrage(): ThemenquizQuestion | null {
    return this.aktuelleRundenFragen[this.aktuelleFrageIndexInRunde] ?? null;
  }

  get zwischenstand(): { spieler: number; gegner: number } {
    return this.zwischenstandFuer(this.match);
  }

  zwischenstandFuer(match: QuizduellMatch | null): { spieler: number; gegner: number } {
    if (!match) return { spieler: 0, gegner: 0 };
    const a = this.quizduellData.wertMatchAus(match);
    return { spieler: a.spielerRichtig, gegner: a.gegnerRichtig };
  }

  kategorieEmoji(topicId: string): string {
    return KATEGORIE_EMOJI[topicId] ?? KATEGORIE_EMOJI_FALLBACK;
  }

  initialen(name: string): string {
    return (name || '?').trim().slice(0, 2).toUpperCase();
  }

  starteSuche(): void {
    const user = this.auth.currentUser();
    let name = user?.displayName ?? this.gastName.trim();
    if (!name) {
      name = this.quizduellData.zufaelligerGastName();
      this.gastName = name;
    }
    if (!user) this.quizduellData.speichereGastNamen(name);

    this.match = this.quizduellData.erstelleMatch(name, user?.id ?? null);
    this.matchAuswertung = null;
    this.state = 'match';
    this.persistiere();

    // Simuliertes Matchmaking: es gibt keinen echten Mitspieler-Pool (kein
    // Backend) -- die Suche "laeuft" kurz an und faellt danach immer auf
    // einen Bot zurueck.
    window.setTimeout(() => {
      if (!this.match) return;
      this.match.phase = 'vs';
      this.persistiere();
      window.setTimeout(() => this.starteKategoriewahl(), 1400);
    }, 2200);
  }

  private starteKategoriewahl(): void {
    if (!this.match || !this.aktuelleRunde) return;
    const bereitsGenutzt = this.match.runden.filter((r) => r.gewaehlteKategorie).map((r) => r.gewaehlteKategorie!.topicId);
    this.aktuelleKategorieOptionen = this.quizduellData.waehleKategorieOptionen(this.topics, bereitsGenutzt);
    this.aktuelleRunde.kategorieOptionen = this.aktuelleKategorieOptionen.map((t) => ({ topicId: t.topicId, title: t.title }));
    this.match.phase = 'kategorie';
    this.persistiere();

    if (!this.aktuelleRunde.spielerWaehlt) {
      window.setTimeout(() => {
        if (!this.aktuelleKategorieOptionen.length) return;
        const zufaellig = this.aktuelleKategorieOptionen[Math.floor(Math.random() * this.aktuelleKategorieOptionen.length)];
        void this.waehleKategorie(zufaellig);
      }, 1200 + Math.random() * 900);
    }
  }

  async waehleKategorie(topic: ThemenquizTopic): Promise<void> {
    if (!this.match || !this.aktuelleRunde || this.match.phase !== 'kategorie') return;

    const quiz = await firstValueFrom(this.themenquiz.getQuiz(topic.topicId));
    this.aktuelleRundenFragen = this.quizduellData.waehleZufaelligeFragen(quiz.questions, FRAGEN_PRO_RUNDE);
    this.aktuelleRunde.gewaehlteKategorie = { topicId: topic.topicId, title: topic.title };
    this.aktuelleRunde.frageIds = this.aktuelleRundenFragen.map((f) => f.id);

    this.aktuelleFrageIndexInRunde = 0;
    this.gewaehlterIndex = null;
    this.beantwortet = false;
    this.match.phase = 'fragen';
    this.persistiere();
  }

  onAntwort(event: DuellAntwortEvent): void {
    if (!this.match || !this.aktuelleRunde || !this.aktuelleFrage) return;
    const richtig = event.index !== null && event.index === this.aktuelleFrage.correctIndex;
    this.aktuelleRunde.spielerAntworten.push({
      frageId: this.aktuelleFrage.id,
      gewaehlterIndex: event.index,
      richtig,
      zeitMs: event.zeitMs,
    });
    this.gewaehlterIndex = event.index;
    this.beantwortet = true;
    this.persistiere();

    window.setTimeout(() => this.naechsterSchritt(), 900);
  }

  private naechsterSchritt(): void {
    if (!this.match || !this.aktuelleRunde) return;

    if (this.aktuelleFrageIndexInRunde < this.fragenProRunde - 1) {
      this.aktuelleFrageIndexInRunde += 1;
      this.gewaehlterIndex = null;
      this.beantwortet = false;
      return;
    }

    this.match.phase = 'gegner-antwortet';
    this.persistiere();
    window.setTimeout(() => {
      if (!this.match || !this.aktuelleRunde) return;
      this.aktuelleRunde.gegnerRichtigeAnzahl = this.quizduellData.simuliereGegnerRunde();

      if (this.match.aktuelleRundeIndex < RUNDEN_PRO_MATCH - 1) {
        this.match.phase = 'rundenwechsel';
        this.persistiere();
      } else {
        this.schliesseMatchAb();
      }
    }, 1500);
  }

  weiterZurNaechstenRunde(): void {
    if (!this.match) return;
    this.match.aktuelleRundeIndex += 1;
    this.starteKategoriewahl();
  }

  private schliesseMatchAb(): void {
    if (!this.match) return;
    const auswertung = this.quizduellData.wertMatchAus(this.match);
    this.match.gewinner = auswertung.gewinner;
    this.match.abgeschlossenAm = new Date().toISOString();
    this.match.phase = 'abgeschlossen';
    this.quizduellData.aktualisiereStatistikNachMatch(this.match, auswertung);
    this.matchAuswertung = auswertung;
    this.persistiere();
  }

  neuesDuell(): void {
    this.starteSuche();
  }

  zurueckZumStart(): void {
    this.match = null;
    this.matchAuswertung = null;
    this.state = 'setup';
    this.aktualisiereOffeneMatches();
  }

  /** Ein zuvor angefangenes, noch offenes Match wieder aufnehmen. */
  async weiterspielen(match: QuizduellMatch): Promise<void> {
    this.match = match;
    this.matchAuswertung = null;
    this.state = 'match';

    const runde = match.runden[match.aktuelleRundeIndex];
    if (!runde) return;

    this.aktuelleKategorieOptionen = runde.kategorieOptionen
      .map((opt) => this.topics.find((t) => t.topicId === opt.topicId))
      .filter((t): t is ThemenquizTopic => !!t);

    switch (match.phase) {
      case 'lobby':
      case 'vs':
        this.starteKategoriewahl();
        break;

      case 'kategorie':
        if (!runde.spielerWaehlt && this.aktuelleKategorieOptionen.length) {
          window.setTimeout(() => {
            const zufaellig = this.aktuelleKategorieOptionen[Math.floor(Math.random() * this.aktuelleKategorieOptionen.length)];
            void this.waehleKategorie(zufaellig);
          }, 1000);
        }
        break;

      case 'fragen':
        if (runde.gewaehlteKategorie) {
          const quiz = await firstValueFrom(this.themenquiz.getQuiz(runde.gewaehlteKategorie.topicId));
          this.aktuelleRundenFragen = runde.frageIds
            .map((id) => quiz.questions.find((q) => q.id === id))
            .filter((f): f is ThemenquizQuestion => !!f);
        }
        this.aktuelleFrageIndexInRunde = runde.spielerAntworten.length;
        this.gewaehlterIndex = null;
        this.beantwortet = false;
        break;

      case 'gegner-antwortet':
      case 'rundenwechsel':
        if (runde.gegnerRichtigeAnzahl === null) {
          runde.gegnerRichtigeAnzahl = this.quizduellData.simuliereGegnerRunde();
        }
        if (match.aktuelleRundeIndex < RUNDEN_PRO_MATCH - 1) {
          this.match.phase = 'rundenwechsel';
        } else {
          this.schliesseMatchAb();
        }
        break;

      default:
        break;
    }

    this.persistiere();
  }

  matchVerwerfen(match: QuizduellMatch): void {
    this.quizduellData.entferneMatch(match.id);
    this.aktualisiereOffeneMatches();
  }

  private aktualisiereOffeneMatches(): void {
    this.offeneMatches = this.quizduellData.ladeOffeneMatches();
  }

  private persistiere(): void {
    if (this.match) this.quizduellData.speichereMatch(this.match);
  }
}
