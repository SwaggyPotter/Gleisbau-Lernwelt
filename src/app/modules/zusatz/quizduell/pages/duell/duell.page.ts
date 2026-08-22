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
 * allein spielbar).
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
  setupError: string | null = null;

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
    if (!this.match) return { spieler: 0, gegner: 0 };
    const a = this.quizduellData.wertMatchAus(this.match);
    return { spieler: a.spielerRichtig, gegner: a.gegnerRichtig };
  }

  kategorieEmoji(topicId: string): string {
    return KATEGORIE_EMOJI[topicId] ?? KATEGORIE_EMOJI_FALLBACK;
  }

  initialen(name: string): string {
    return (name || '?').trim().slice(0, 2).toUpperCase();
  }

  starteSuche(): void {
    this.setupError = null;
    const user = this.auth.currentUser();
    const name = user?.displayName ?? this.gastName.trim();
    if (!name) {
      this.setupError = 'Bitte einen Namen eintragen oder anmelden.';
      return;
    }

    this.match = this.quizduellData.erstelleMatch(name, user?.id ?? null);
    this.matchAuswertung = null;
    this.state = 'match';

    // Simuliertes Matchmaking: es gibt keinen echten Mitspieler-Pool (kein
    // Backend) -- die Suche "laeuft" kurz an und faellt danach immer auf
    // einen Bot zurueck.
    window.setTimeout(() => {
      if (!this.match) return;
      this.match.phase = 'vs';
      window.setTimeout(() => this.starteKategoriewahl(), 1400);
    }, 2200);
  }

  private starteKategoriewahl(): void {
    if (!this.match || !this.aktuelleRunde) return;
    const bereitsGenutzt = this.match.runden.filter((r) => r.gewaehlteKategorie).map((r) => r.gewaehlteKategorie!.topicId);
    this.aktuelleKategorieOptionen = this.quizduellData.waehleKategorieOptionen(this.topics, bereitsGenutzt);
    this.match.phase = 'kategorie';

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
    window.setTimeout(() => {
      if (!this.match || !this.aktuelleRunde) return;
      this.aktuelleRunde.gegnerRichtigeAnzahl = this.quizduellData.simuliereGegnerRunde();

      if (this.match.aktuelleRundeIndex < RUNDEN_PRO_MATCH - 1) {
        this.match.phase = 'rundenwechsel';
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
  }

  neuesDuell(): void {
    this.starteSuche();
  }

  zurueckZumStart(): void {
    this.match = null;
    this.matchAuswertung = null;
    this.state = 'setup';
  }
}
