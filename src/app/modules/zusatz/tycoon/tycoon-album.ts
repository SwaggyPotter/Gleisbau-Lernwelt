/**
 * Gleisbau Tycoon -- Sammelalbum: jeden Zugtyp einmal besitzen, Abzeichen fuer Meilensteine. Jedes Abzeichen gibt
 * einmal Geld und Erfahrung. Die Bedingungen prueft die Engine (tycoon-engine.ts, abzeichenErfuellt).
 */
export interface Abzeichen { id: string; n: string; icon: string; text: string; lohn: number }
export const ABZEICHEN: Abzeichen[] = [
  { id: 'strecke1', n: 'Erster Spatenstich', icon: '🛤', text: 'Die erste eigene Strecke gebaut.', lohn: 300 },
  { id: 'strecke10', n: 'Netzbauer', icon: '🗺', text: '10 eigene Strecken.', lohn: 2000 },
  { id: 'zuege5', n: 'Fuhrpark', icon: '🚆', text: '5 verschiedene Zugtypen besessen.', lohn: 1500 },
  { id: 'zuegeAlle', n: 'Zugsammler', icon: '🏆', text: 'Jeden Zugtyp einmal besessen.', lohn: 10000 },
  { id: 'stoerung25', n: 'Störungsprofi', icon: '🔧', text: '25 Störungen behoben.', lohn: 3000 },
  { id: 'perfekt', n: 'Adlerauge', icon: '🦅', text: 'Eine Inspektionsfahrt ohne übersehenen Fehler und ohne Fehlalarm.', lohn: 800 },
  { id: 'jahr', n: 'Ein ganzes Jahr', icon: '📅', text: 'Alle vier Jahreszeiten erlebt.', lohn: 1000 },
  { id: 'wetterfest', n: 'Wetterfest', icon: '🛡', text: 'Eine Strecke mit allen vier Wetterschutz-Maßnahmen.', lohn: 1500 },
  { id: 'baustelle5', n: 'Baumeister', icon: '🚧', text: '5 Baustellen abgeschlossen.', lohn: 2000 },
  { id: 'ausbilder', n: 'Ausbilder', icon: '🎓', text: 'Eine Rolle im Personal auf Stufe 5.', lohn: 3000 },
  { id: 'gueter10', n: 'Güterkönig', icon: '📦', text: '10 Güteraufträge erfüllt.', lohn: 3000 },
  { id: 'zweigleisig', n: 'Doppelspur', icon: '🛤🛤', text: 'Eine Strecke zweigleisig ausgebaut.', lohn: 1000 },
  { id: 'etcs', n: 'ETCS-Pionier', icon: '📡', text: 'Eine Strecke mit ETCS Level 2.', lohn: 2000 },
  { id: 'netz', n: 'Netzwerker', icon: '🔀', text: 'Ein Zug fährt einen Zuglauf über mindestens 3 Strecken.', lohn: 2000 },
  { id: 'vertrag', n: 'Vertragspartner', icon: '📜', text: 'Eine Ausschreibung gewonnen.', lohn: 1500 },
  { id: 'clan', n: 'Teamplayer', icon: '🤝', text: 'Zu einem Clan-Großprojekt beigetragen.', lohn: 800 },
];
