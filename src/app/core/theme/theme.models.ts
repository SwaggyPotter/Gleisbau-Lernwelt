export type SkinId = 'standard' | 'playful' | 'season' | 'neon' | 'gold' | 'wald' | 'ozean';

export interface SkinInfo {
  id: SkinId;
  label: string;
  beschreibung: string;
  /** Fuer die Vorschau-Kachel im Auswahl-UI -- bei "season" die Farbe der GERADE aktuellen Saison. */
  vorschauAccent: string;
  vorschauAccent2: string;
  vorschauBg: string;
  /** Achievement-Key aus dem Backend-Katalog. Gesetzt = Skin muss erst freigeschaltet werden. */
  freischaltungAchievement?: string;
  freischaltungLabel?: string;
}
