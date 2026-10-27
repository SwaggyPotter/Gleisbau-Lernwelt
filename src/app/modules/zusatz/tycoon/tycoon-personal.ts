/**
 * Gleisbau Tycoon -- Personal und Ausbildung. Jede Rolle wird einmal eingestellt (keine laufenden Kosten) und steigt
 * ueber Lehrgaenge (Fachfragen im Spiel) auf. Hoehere Stufen verlangen zusaetzlich Lernstand in der Lernwelt:
 * Anteil der Fragen der passenden Themenquiz-Themen, die schon einmal richtig beantwortet wurden.
 */

export interface Rolle {
  id: string; n: string; icon: string;
  /** Themenquiz-Themen (Lernwelt) fuer Lehrgang und Lernstand. */
  themen: string[];
  /** Wirkung je Stufe (Text mit {p} = Prozent je Stufe) und Prozent je Stufe. */
  wirkung: string; proStufe: number;
  einstellen: number;
}
export const ROLLEN: Rolle[] = [
  { id: 'gleisbauer', n: 'Gleisbau-Rotte', icon: '👷', themen: ['grundlagen', 'schwellen', 'kleineisen', 'bettung', 'lf10'],
    wirkung: 'Baustellen {p} schneller, Bonus für selbst behobene Störungen +{p}', proStufe: 6, einstellen: 3000 },
  { id: 'lokfuehrer', n: 'Triebfahrzeugführer', icon: '🧑‍✈️', themen: ['schiene', 'spurweite', 'arbeitssicherheit'],
    wirkung: 'Miete eigener Züge +{p}', proStufe: 4, einstellen: 4000 },
  { id: 'fdl', n: 'Fahrdienstleiter', icon: '🚦', themen: ['lf12', 'lf13', 'trassenplan'],
    wirkung: 'Trassenentgelt der Fremdzüge +{p}', proStufe: 5, einstellen: 5000 },
  { id: 'vermesser', n: 'Vermesser', icon: '📐', themen: ['messmittel', 'lf11', 'spurweite'],
    wirkung: 'Inspektionsfahrt {p} langsamer (mehr Zeit) und Prämie +{p}', proStufe: 6, einstellen: 4000 },
];
export const MAX_STUFE = 5;
/** Lernstand (0..1), den die Lernwelt fuer Stufe s mindestens verlangt (Stufe 1 und 2 gehen ohne). */
export const lernstandFuer = (s: number): number => Math.max(0, (s - 2) * 0.15);
/** Lehrgang: Fragen, davon richtig. */
export const LEHRGANG_N = 5, LEHRGANG_NEED = 4;
export const lehrgangPreis = (zielStufe: number): number => zielStufe * 1000;

/** Anteil beherrschter Fragen (mind. einmal richtig) ueber die Themen; liest den Lernwelt-Fortschritt im Browser. */
export function lernstand(themen: string[], anzahl: Record<string, number>): number {
  let gut = 0, alle = 0;
  for (const t of themen) {
    alle += anzahl[t] || 0;
    try {
      const p = JSON.parse(localStorage.getItem('themenquiz-progress-' + t) || '{}');
      gut += Object.values(p.quizStats || {}).filter((x: any) => x && x.correct > 0).length;
    } catch { /* kein Fortschritt */ }
  }
  return alle ? Math.min(1, gut / alle) : 0;
}
