/**
 * Gleisbau Tycoon -- Clan-Grossprojekte. Der Clan baut gemeinsam (Geld oder Arbeitsschichten mit Fachfragen);
 * ist das Ziel erreicht, gilt der Bonus dauerhaft fuer alle Mitglieder. Ziele stehen auch im Backend (routes/tycoon.ts).
 */
export const CLAN_PROJEKTE = [
  { id: 'nbs', n: 'Neubaustrecke', icon: '🚄', ziel: 150_000, bonus: 'Miete aller eigenen Züge +5 %',
    text: 'Eine gemeinsame Schnellfahrstrecke quer durchs Land: Trasse, Erdbau, Feste Fahrbahn.' },
  { id: 'bruecke', n: 'Talbrücke', icon: '🌉', ziel: 100_000, bonus: 'Neue Strecken bauen 10 % günstiger',
    text: 'Eine große Eisenbahnbrücke über ein Tal – Pfeiler, Überbau, Gleis.' },
  { id: 'tunnel', n: 'Basistunnel', icon: '⛰', ziel: 200_000, bonus: 'Trassenentgelt der Fremdzüge +5 %',
    text: 'Ein langer Tunnel durchs Mittelgebirge: Vortrieb, Innenschale, Rettungsstollen.' },
];
/** Arbeitsschicht: Fragen und Gegenwert je richtiger Antwort; danach Pause (Spielsekunden). */
export const SCHICHT_FRAGEN = 5, SCHICHT_WERT = 1500, SCHICHT_PAUSE = 300;
export const BEITRAEGE = [1000, 5000, 20000];
