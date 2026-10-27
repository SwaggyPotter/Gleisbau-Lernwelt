/**
 * Gleisbau Tycoon -- Baustellen mit Sperrpausen. Eine Massnahme braucht eine Maschine (eigene Ausruestung oder gemietet)
 * und eine Sperrung der Strecke. Vorher kann man die Arbeit mit Fachfragen vorbereiten: jede richtige Antwort verkuerzt
 * die Bauzeit. Indizes werden im Spielstand gespeichert -- neue Eintraege nur hinten anhaengen.
 */

export interface Massnahme {
  id: string; n: string; text: string;
  /** Bauzeit (Spielsekunden, Totalsperrung ohne Vorbereitung) und Kosten je Laengeneinheit. */
  dauer: number; jeEinheit: number;
  /** Ausruestungs-Id der Maschine (eigene = keine Miete), Name und Miete. */
  maschine: string; maschineN: string; miete: number;
  /** Themenquiz fuer die Arbeitsvorbereitung. */
  thema: string; themaN: string;
  /** Wirkung: Zustand +cond, Risiko uebersehener Fehler auf 0, neues Gleis (halber Verschleiss) fuer neu Sekunden. */
  cond: number; risiko0?: boolean; neu?: number;
}
export const MASSNAHMEN: Massnahme[] = [
  { id: 'stopfen', n: 'Stopfen und Richten', text: 'Die Stopfmaschine hebt das Gleis an, richtet es aus und verdichtet den Schotter unter den Schwellen.',
    dauer: 45, jeEinheit: 1, maschine: 'stopfmaschine', maschineN: 'Stopfmaschine', miete: 600, thema: 'bettung', themaN: 'Bettung', cond: 30 },
  { id: 'schleifen', n: 'Schienenschleifen', text: 'Der Schleifzug entfernt Riffeln und Head Checks und stellt das Schienenprofil wieder her.',
    dauer: 40, jeEinheit: 1, maschine: 'schleifzug', maschineN: 'Schienenschleifzug', miete: 900, thema: 'schiene', themaN: 'Schiene', cond: 15, risiko0: true },
  { id: 'reinigung', n: 'Bettungsreinigung', text: 'Die Reinigungsmaschine holt den Schotter heraus, siebt die Feinteile ab und baut ihn sauber wieder ein.',
    dauer: 90, jeEinheit: 2.5, maschine: 'reinigung', maschineN: 'Bettungsreinigungsmaschine', miete: 1200, thema: 'bettung', themaN: 'Bettung', cond: 45, risiko0: true },
  { id: 'erneuerung', n: 'Gleiserneuerung', text: 'Schienen und Schwellen werden komplett getauscht – danach verschleißt das Gleis eine Weile nur halb so schnell.',
    dauer: 120, jeEinheit: 4, maschine: 'umbauzug', maschineN: 'Umbauzug', miete: 2000, thema: 'lf10', themaN: 'Gleisanlagen neu bauen', cond: 100, neu: 600 },
];

export interface Sperrung { id: string; n: string; text: string; dauerF: number; tempo: number; einnahmen: number; sevJeEinheit: number }
export const SPERRUNGEN: Sperrung[] = [
  { id: 'total', n: 'Totalsperrung', text: 'Schnell fertig, aber auf der Strecke fährt nichts. Der Schienenersatzverkehr mit Bussen kostet einmalig.',
    dauerF: 1, tempo: 0, einnahmen: 0, sevJeEinheit: 1 },
  { id: 'nacht', n: 'Nachtsperrpausen', text: 'Gearbeitet wird nur nachts – tagsüber fahren die Züge, aber langsamer. Dauert länger, kein Ersatzverkehr nötig.',
    dauerF: 2.5, tempo: 0.7, einnahmen: 0.7, sevJeEinheit: 0 },
];

/** Fachfragen der Arbeitsvorbereitung und Zeitersparnis je richtiger Antwort. */
export const VORBEREITUNG_FRAGEN = 3, VORBEREITUNG_SPAREN = 0.15;
