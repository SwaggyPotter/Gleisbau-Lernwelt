import { QuizTile } from './katalog';

/**
 * Sterne je App auf der Startseite (Tim 2026-11-11, neu 2026-11-12):
 * ★ ab 1 richtigen Antwort · ★★ ab 10 · ★★★ ab 50 · ★★★★ ab 150 · ★★★★★ ab 250.
 * Tims Vorschlag war 1/10/100/200/250; gleichmaessiger gestaffelt, damit man nicht
 * ewig bei 2 Sternen haengt und der 5. Stern nicht nur 50 Fragen nach dem 4. kommt.
 *
 * Gezählt wird lokal auf dem Gerät: zentrale Modul-Statistik „glw-modul-statistik“
 * (ProfilSyncService.melde/lokalZaehlen) – dazu ältere Speicher der einzelnen Apps,
 * damit bisheriger Fortschritt nicht verloren geht (es zählt jeweils der größere Wert).
 */
export const STERN_STUFEN = [1, 10, 50, 150, 250];
export const MAX_STERNE = STERN_STUFEN.length;

export function sterneFuer(richtig: number): number {
  return STERN_STUFEN.filter(s => richtig >= s).length;
}

/** Nächste Schwelle (für den Tooltip), null wenn alle Sterne erreicht sind. */
export function naechsteStufe(richtig: number): number | null {
  return STERN_STUFEN.find(s => richtig < s) ?? null;
}

/** Kacheln ohne Fragen bekommen keine Sterne. */
const OHNE_STERNE = new Set([
  'quiz-lernfortschritt', 'quiz-glossar', 'quiz-offline', 'formelsammlung-nachschlagen',
  'app-modelle', 'app-offline', 'app-forum', 'spiel-quizshow',
]);

/** Ältere, app-eigene Speicher (vor der zentralen Statistik). */
const ALT_QUIZSTATS: Record<string, string> = {
  'zusatz:gesamtquiz': 'zusatz-gesamtquiz-progress',
  'zusatz:volumen': 'volumen-progress',
  'zusatz:prozentrechnung': 'prozentrechnung-progress',
  'zusatz:nivellieren': 'nivellieren-progress',
};
const ALT_STREAK: Record<string, string> = {
  'zusatz:weichenrechner': 'weichenrechner-progress',
  'zusatz:schienendehnung': 'schienendehnung-progress',
};

function lese<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function summeQuizStats(key: string): number {
  const p = lese<{ quizStats?: Record<string, { correct?: number }> }>(key);
  return Object.values(p?.quizStats ?? {}).reduce((s, e) => s + (e?.correct ?? 0), 0);
}

function altWert(modulKey: string): number {
  if (modulKey.startsWith('themenquiz:')) return summeQuizStats(`themenquiz-progress-${modulKey.slice(11)}`);
  if (ALT_QUIZSTATS[modulKey]) return summeQuizStats(ALT_QUIZSTATS[modulKey]);
  if (ALT_STREAK[modulKey]) return lese<{ correct?: number }>(ALT_STREAK[modulKey])?.correct ?? 0;
  if (modulKey === 'zusatz:materialrechner') {
    const p = lese<{ stats?: Record<string, { correct?: number }> }>('materialrechner-progress');
    return Object.values(p?.stats ?? {}).reduce((s, e) => s + (e?.correct ?? 0), 0);
  }
  if (modulKey.startsWith('formelsammlung:')) {
    const fs = lese<{ apps?: Record<string, { modi?: Record<string, { richtig?: number }> }>; finder?: { richtig?: number } }>('glw-formelsammlung-v1');
    const id = modulKey.slice(15);
    if (id === 'finder') return fs?.finder?.richtig ?? 0;
    return Object.values(fs?.apps?.[id]?.modi ?? {}).reduce((s, m) => s + (m?.richtig ?? 0), 0);
  }
  return 0;
}

/** Statistik-Schlüssel, unter denen eine Kachel ihre Antworten zählt (leer = keine Sterne). */
export function modulSchluessel(t: QuizTile): string[] {
  if (OHNE_STERNE.has(t.id)) return [];
  if (t.id === 'formelsammlung-formelfinder') return ['formelsammlung:finder'];
  if (t.id === 'formelsammlung-pruefung') return ['formelsammlung:gemischt'];
  if (t.id.startsWith('formelsammlung-')) return ['formelsammlung:' + t.id.slice(15)];
  const keys: string[] = [];
  if (t.topicId) keys.push(`themenquiz:${t.topicId}`);
  const zusatz = /^\/zusatz\/([a-z0-9-]+)/.exec(t.link);
  if (zusatz) keys.push(`zusatz:${zusatz[1]}`);
  return keys;
}

/** Richtige Antworten einer Kachel; null = Kachel hat keine Sterne. */
export function richtigeAntworten(t: QuizTile): number | null {
  const keys = modulSchluessel(t);
  if (!keys.length) return null;
  const zentral = lese<Record<string, { correct?: number }>>('glw-modul-statistik') ?? {};
  return keys.reduce((summe, k) => summe + Math.max(zentral[k]?.correct ?? 0, altWert(k)), 0);
}
