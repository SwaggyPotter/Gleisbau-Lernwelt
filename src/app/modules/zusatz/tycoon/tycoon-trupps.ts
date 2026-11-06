/**
 * Gleisbau Tycoon -- Streckentrupps: per Drag & Drop (oder im Strecken-Panel) auf eine Strecke gesetzt.
 * Ein Trupp faengt Stoerungen ab, bevor sie den Betrieb stoeren, und will dafuer einen Anteil der Einnahmen dieser
 * Strecke als Lohn. Je teurer, desto mehr wird abgefangen -- aber nie alles: ein Rest bleibt immer fuer den Spieler,
 * damit Selbermachen (und Lernen) der Hauptweg bleibt. Hauptstrecken mit viel Verkehr sind so am teuersten abzusichern.
 */

export interface TruppArt {
  id: string; n: string; icon: string;
  /** Anteil der Einnahmen der Strecke als Lohn (Trassenentgelt und Miete). */
  lohn: number;
  /** Anteil der Stoerungen, die der Trupp abfaengt. */
  schutz: number;
  /** Einmalig beim Einsetzen. */
  einsatz: number;
  text: string;
}

export const TRUPPS: TruppArt[] = [
  { id: 'laeufer', n: 'Streckenläufer', icon: '🚶', lohn: 0.08, schutz: 0.5, einsatz: 500,
    text: 'Geht die Strecke regelmäßig ab und meldet Schäden, bevor sie zur Störung werden.' },
  { id: 'rotte', n: 'Instandhaltungsrotte', icon: '👷', lohn: 0.15, schutz: 0.75, einsatz: 1500,
    text: 'Behebt kleine Schäden gleich vor Ort: Kleineisen nachziehen, Schotter ergänzen, Schwellen tauschen.' },
  { id: 'fachtrupp', n: 'Fachtrupp mit Gerät', icon: '🛠', lohn: 0.25, schutz: 0.9, einsatz: 3500,
    text: 'Mit Messgerät, Schweißausrüstung und Kleinmaschinen: findet auch versteckte Fehler.' },
  { id: 'bereitschaft', n: 'Bereitschaft rund um die Uhr', icon: '🚨', lohn: 0.38, schutz: 0.95, einsatz: 6000,
    text: 'Rund um die Uhr im Dienst, Tag und Nacht. Fängt fast alles ab – ein Rest bleibt trotzdem.' },
];
export const truppMit = (id: string | null | undefined): TruppArt | undefined => TRUPPS.find((t) => t.id === id);
