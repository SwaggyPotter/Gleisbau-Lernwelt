export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  /** crypto.subtle SHA-256 Hash. Kein echter Schutz, da ohne Server jeder
   * localStorage lesen/faelschen kann -- nur zur Vermeidung von Klartext. */
  passwordDigest: string;
  /** Platzhalter fuer ein spaeteres Key-basiertes Registrierungssystem
   * (analog backend/db registration_keys) -- aktuell immer 'direct'. */
  registeredVia: 'direct' | 'key';
  keyUsed?: string;
  /** Platzhalter fuer eine spaetere Admin-Sicht auf Fortschritte/Defizite --
   * aktuell nirgends in der UI ausgewertet. */
  role: 'user' | 'admin';
  createdAt: string;
}

export const RUNDEN_PRO_MATCH = 6;
export const FRAGEN_PRO_RUNDE = 3;
export const ZEITLIMIT_SEK = 20;
/** Anzahl Themen, aus denen bei der Kategoriewahl pro Runde ausgewaehlt werden kann. */
export const KATEGORIE_OPTIONEN_ANZAHL = 4;
/** Simulierte Trefferquote des Gegners -- siehe Klassendoku QuizduellDataService. */
export const GEGNER_TREFFERQUOTE = 0.65;

export const BOT_NAMEN = [
  'Schwellen-Klaus',
  'Weichen-Steller-Bot',
  'Gleisbau-Trainer',
  'Prellbock-Peter',
  'Signal-Susi',
];

/** Rein dekorativ (Kategorie-Icon in der Kategoriewahl). Fallback fuer nicht gelistete Themen. */
export const KATEGORIE_EMOJI: Record<string, string> = {
  grundlagen: '📐',
  spurweite: '📏',
  schiene: '🛤️',
  schwellen: '🪵',
  bettung: '⛰️',
  kleineisen: '🔩',
  handwerkzeuge: '🛠️',
  kleingeraete: '⚙️',
  messmittel: '📊',
  trassenplan: '🗺️',
  lf10: '🛤️',
  lf11: '🌀',
  lf12: '🔀',
  lf13: '🔧',
  lf14: '🚉',
};
export const KATEGORIE_EMOJI_FALLBACK = '📚';

export interface RundenAntwort {
  frageId: string;
  /** null = Zeit abgelaufen, keine Antwort gegeben. */
  gewaehlterIndex: number | null;
  richtig: boolean;
  zeitMs: number;
}

/**
 * Eine Runde: abwechselnd waehlt Spieler oder Gegner die Kategorie aus drei
 * angebotenen Themen (Wiederholungen innerhalb desselben Matches werden
 * vermieden). Danach beantwortet NUR der Spieler die drei Fragen wirklich --
 * der Gegner (immer ein simulierter Bot, siehe QuizduellDataService) bekommt
 * keine echten Einzelfragen angezeigt, nur eine plausibel gewuerfelte
 * Trefferzahl.
 */
export interface QuizduellRunde {
  nummer: number;
  /** true = Spieler waehlt die Kategorie dieser Runde, false = Gegner. */
  spielerWaehlt: boolean;
  kategorieOptionen: { topicId: string; title: string }[];
  gewaehlteKategorie: { topicId: string; title: string } | null;
  frageIds: string[];
  spielerAntworten: RundenAntwort[];
  gegnerRichtigeAnzahl: number | null;
}

export type MatchPhase =
  | 'lobby'
  | 'vs'
  | 'kategorie'
  | 'fragen'
  | 'gegner-antwortet'
  | 'rundenwechsel'
  | 'abgeschlossen';

/**
 * Ein Quiz-Duell nach dem Vorbild des echten "Quizduell": 6 Runden mit je
 * 3 Fragen, Kategorie pro Runde wechselt abwechselnd. Ohne echtes Backend
 * gibt es keine echten Mitspieler -- der Gegner ist deshalb IMMER ein
 * simulierter Bot (Matchmaking-Screen "sucht" kurz, findet nie einen
 * Mitspieler, faellt dann auf einen Bot zurueck). Das macht das Duell auch
 * allein spielbar, ohne ein Geraet zwischen zwei Personen hin- und
 * herzureichen.
 */
export interface QuizduellMatch {
  id: string;
  spielerName: string;
  /** AuthUser.id, falls eingeloggt gespielt, sonst null (Gast). */
  spielerUserId: string | null;
  gegnerName: string;
  runden: QuizduellRunde[];
  aktuelleRundeIndex: number;
  phase: MatchPhase;
  gewinner: 'spieler' | 'gegner' | 'unentschieden' | null;
  erstelltAm: string;
  abgeschlossenAm: string | null;
}

export interface QuizduellStats {
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  longestStreak: number;
  questionsCorrect: number;
  questionsTotal: number;
  achievements: string[];
}

export interface AchievementDef {
  id: string;
  emoji: string;
  titel: string;
  beschreibung: string;
}

/** Errungenschaften-Katalog. Emojis statt Bilddateien -- kein Hosting/Lizenz-Aufwand noetig. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'erstes-duell', emoji: '🎉', titel: 'Erstes Duell', beschreibung: 'Dein erstes Quiz-Duell gespielt.' },
  { id: 'fuenf-siege', emoji: '🥉', titel: '5 Siege', beschreibung: '5 Duelle gewonnen.' },
  { id: 'zwanzig-siege', emoji: '🥇', titel: '20 Siege', beschreibung: '20 Duelle gewonnen.' },
  { id: 'serie-drei', emoji: '🔥', titel: 'Dreier-Serie', beschreibung: '3 Duelle in Folge gewonnen.' },
  { id: 'serie-zehn', emoji: '🚀', titel: 'Zehner-Serie', beschreibung: '10 Duelle in Folge gewonnen.' },
  { id: 'perfekte-runde', emoji: '🎯', titel: 'Volltreffer', beschreibung: 'Eine Runde mit 3 von 3 richtigen Antworten.' },
  { id: 'perfektes-duell', emoji: '🏆', titel: 'Perfektes Duell', beschreibung: 'Ein komplettes Duell mit 18 von 18 richtigen Antworten.' },
  { id: 'vielspieler', emoji: '📚', titel: 'Vielspieler', beschreibung: '50 Duelle gespielt.' },
  { id: 'blitzantwort', emoji: '⚡', titel: 'Blitzschnell', beschreibung: 'Eine Frage in unter 3 Sekunden richtig beantwortet.' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/**
 * Strukturskelett fuer ein spaeteres Key-basiertes Registrierungssystem
 * (analog backend/db registration_keys), das ein Admin verwaltet. Tim
 * moechte damit spaeter sehen koennen, wer welche Fortschritte/Defizite hat
 * -- haengt an der echten Backend-Anbindung (siehe Offene-Punkte.md) und ist
 * aktuell nirgends in der UI erzeugt oder eingeloest, nur das Datenmodell ist
 * vorbereitet.
 */
export interface RegistrationKey {
  key: string;
  fullName: string;
  year: number;
  maxUses: number;
  uses: number;
}
