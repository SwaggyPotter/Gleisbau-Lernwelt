/**
 * Gleisbau Tycoon -- Wetter und Jahreszeiten. Jahreszeiten wechseln alle paar Spieltage; je Jahreszeit kommen
 * Wetterlagen ueber ein Bundesland. Strecken ohne passenden Wetterschutz fahren dort langsamer, bringen weniger
 * und bekommen ggf. eine Wetter-Stoerung (Fehlerart-Index in FEHLER_ARTEN der Engine).
 * Fachtexte bewusst kurz und allgemein gehalten (Lernwelt-Themen Schiene, Bettung, Weichen, Arbeitssicherheit).
 */

import type { Klima } from './tycoon-gebiete';

export const JAHRESZEITEN = [
  { n: 'Frühling', icon: '🌸' },
  { n: 'Sommer', icon: '☀️' },
  { n: 'Herbst', icon: '🍂' },
  { n: 'Winter', icon: '❄️' },
];
/* Jahreszeit aus dem Spielkalender: siehe spielzeit() in tycoon-zeit.ts. */

/** Wetterschutz je Strecke; Preis = jeEinheit x Streckenlaenge. */
export interface WetterSchutz { id: string; n: string; text: string; jeEinheit: number }
export const SCHUTZ: WetterSchutz[] = [
  { id: 'entwaesserung', n: 'Entwässerung', text: 'Gräben und Durchlässe frei: Starkregen spült die Bettung nicht aus.', jeEinheit: 2 },
  { id: 'spannung', n: 'Spannungsausgleich', text: 'Lückenlos verschweißtes Gleis auf Neutraltemperatur gebracht: keine Verwerfung bei Hitze, kaum Schienenbrüche bei strengem Frost.', jeEinheit: 3 },
  { id: 'gruen', n: 'Vegetationspflege', text: 'Rückschnitt am Bahndamm: weniger Laub auf den Schienen, kein Baum im Gleis bei Sturm.', jeEinheit: 1.5 },
  { id: 'heizung', n: 'Weichenheizung', text: 'Hält die Weichen bei Schnee und Frost beweglich.', jeEinheit: 2.5 },
];

export interface WetterArt {
  id: 'regen' | 'hitze' | 'laub' | 'sturm' | 'schnee' | 'frost';
  n: string; icon: string;
  /** Jahreszeit-Index, in der das Wetter vorkommt. */
  zeit: number;
  schutz: string;
  /** Faktoren fuer ungeschuetzte Strecken im Gebiet. */
  tempo: number; einnahmen: number;
  /** Index in FEHLER_ARTEN (Engine) oder -1 = keine Stoerung. */
  fehler: number;
  text: string;
  /** Wie oft das Wetter je Klimazone vorkommt (Gewicht bei der Auswahl, siehe klimaVon in tycoon-gebiete.ts). */
  klima: Record<Klima, number>;
}
export const WETTER: WetterArt[] = [
  { id: 'regen', n: 'Starkregen', icon: '🌧', zeit: 0, schutz: 'entwaesserung', tempo: 0.9, einnahmen: 0.85, fehler: 9,
    text: 'Fließt das Wasser nicht ab, steht es im Schotter: Feinteile werden ausgespült, die Bettung verliert ihre Tragfähigkeit und das Gleis sackt ein.',
    klima: { nord: 1, mitte: 2, sued: 1 } },
  { id: 'hitze', n: 'Hitzewelle', icon: '🌡', zeit: 1, schutz: 'spannung', tempo: 0.85, einnahmen: 0.9, fehler: 6,
    text: 'Lückenlos verschweißte Schienen können sich nicht ausdehnen und stehen bei Hitze unter Druck. Liegt die Neutraltemperatur zu niedrig, kann sich das Gleis seitlich verwerfen.',
    klima: { nord: 0.3, mitte: 2.5, sued: 4 } },
  { id: 'laub', n: 'Herbstlaub', icon: '🍂', zeit: 2, schutz: 'gruen', tempo: 0.75, einnahmen: 0.85, fehler: -1,
    text: 'Zerfahrenes Laub bildet einen schmierigen Film auf den Schienen: Räder schleudern beim Anfahren und rutschen beim Bremsen – die Züge müssen langsamer fahren.',
    klima: { nord: 1.5, mitte: 2, sued: 0.7 } },
  { id: 'sturm', n: 'Herbststurm', icon: '🌪', zeit: 2, schutz: 'gruen', tempo: 0.8, einnahmen: 0.8, fehler: 7,
    text: 'Umgestürzte Bäume blockieren das Gleis. Vor dem Räumen muss das Gleis gesperrt und ggf. die Oberleitung abgeschaltet und geerdet sein.',
    klima: { nord: 1.5, mitte: 2, sued: 0.7 } },
  { id: 'schnee', n: 'Schnee und Frost', icon: '❄️', zeit: 3, schutz: 'heizung', tempo: 0.8, einnahmen: 0.85, fehler: 8,
    text: 'Schnee und Eis zwischen Zunge und Backenschiene verhindern, dass die Weiche umläuft. Weichenheizungen halten sie frei.',
    klima: { nord: 3, mitte: 1.5, sued: 0.5 } },
  // Nur hinten anhaengen: der Index steht im Spielstand.
  { id: 'frost', n: 'Strenger Frost', icon: '🥶', zeit: 3, schutz: 'spannung', tempo: 0.85, einnahmen: 0.85, fehler: 11,
    text: 'Bei strengem Frost ziehen sich lückenlos verschweißte Schienen zusammen und stehen unter hoher Zugspannung. An Schweißstößen und Vorschäden kann die Schiene brechen. Vorbeugen: Neutraltemperatur richtig einstellen (Spannungsausgleich) und Schienen per Ultraschall prüfen.',
    klima: { nord: 5, mitte: 1, sued: 0.2 } },
];
/** Was in einer Klimazone typisch ist (Gebiets-Panel, Startpunkt-Wahl). */
export const KLIMA_TEXT: Record<Klima, string> = {
  nord: '🥶 Nordeuropa: lange, kalte Winter – Frost bringt Schienenbrüche, Schnee friert Weichen ein. Hitze ist selten.',
  mitte: '🌦 Mitteleuropa: von allem etwas – Hitzewellen im Sommer (Gleisverwerfungen), Laub und Sturm im Herbst, Schnee im Winter.',
  sued: '🌡 Südeuropa: heiße Sommer – Hitzewellen verwerfen das Gleis. Frost und Schnee sind selten.',
};

/** Wetterlage im Spielstand: Art (Index in WETTER), Bundesland (NUTS-1), Ende (Spielzeit), Ausschnitt fuer die Anzeige. */
export interface WetterLage { art: number; bl: string; bis: number; box: { x0: number; y0: number; x1: number; y1: number } }

/** Tönung der 2D-Karte je Jahreszeit (ueber die ganze Flaeche). */
export const TOENUNG = ['rgba(0,0,0,0)', 'rgba(255,214,120,.07)', 'rgba(205,120,40,.09)', 'rgba(255,255,255,.24)'];

/**
 * Wetter-Partikel im Ausschnitt b zeichnen (Weltkoordinaten; ctx ist schon auf Welt transformiert).
 * m = Symbolmassstab der Engine (Welteinheiten je Bildschirmpixel), t = Zeit in Sekunden.
 */
export function zeichneWetter(ctx: CanvasRenderingContext2D, art: WetterArt['id'], b: WetterLage['box'], m: number, t: number) {
  const w = b.x1 - b.x0, h = b.y1 - b.y0, n = Math.min(240, Math.max(70, Math.round((w * h) / (m * m) / 700)));
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x0, b.y0, w, h); ctx.clip();
  if (art === 'hitze') { ctx.fillStyle = 'rgba(255,120,40,.10)'; ctx.fillRect(b.x0, b.y0, w, h); }
  if (art === 'regen' || art === 'sturm') { ctx.fillStyle = 'rgba(40,60,90,.10)'; ctx.fillRect(b.x0, b.y0, w, h); }
  if (art === 'frost') { ctx.fillStyle = 'rgba(170,215,255,.16)'; ctx.fillRect(b.x0, b.y0, w, h); }
  for (let i = 0; i < n; i++) {
    // Feste Pseudozufallsbahnen je Partikel, Bewegung ueber die Zeit.
    const r1 = ((i * 9301 + 49297) % 233280) / 233280, r2 = ((i * 4253 + 1931) % 7919) / 7919;
    if (art === 'regen' || art === 'sturm') {
      const v = art === 'sturm' ? 0.9 : 0.6, x = b.x0 + ((r1 * w + t * 60 * m * (art === 'sturm' ? 1.5 : 0.3)) % w), y = b.y0 + ((r2 * h + t * 420 * m * v) % h);
      ctx.strokeStyle = 'rgba(60,90,140,.55)'; ctx.lineWidth = 1.2 * m;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * m * (art === 'sturm' ? 2 : 0.5), y - 9 * m); ctx.stroke();
    } else if (art === 'schnee') {
      const x = b.x0 + ((r1 * w + Math.sin(t + i) * 6 * m) % w + w) % w, y = b.y0 + ((r2 * h + t * 40 * m) % h);
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(x, y, (1.5 + r1 * 1.5) * m, 0, 7); ctx.fill();
    } else if (art === 'laub') {
      const x = b.x0 + ((r1 * w + t * 25 * m) % w), y = b.y0 + ((r2 * h + t * 30 * m) % h);
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i);
      ctx.fillStyle = ['#c8741e', '#d9a12a', '#a3461d'][i % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 3.5 * m, 1.8 * m, 0, 0, 7); ctx.fill();
      ctx.restore();
    } else if (art === 'frost') {
      // Frost: funkelnde Eiskristalle (Sternchen) an festen Stellen.
      const x = b.x0 + r1 * w, y = b.y0 + r2 * h, s = (1.6 + r1 * 1.8) * m * (0.6 + 0.4 * Math.abs(Math.sin(t * 1.5 + i)));
      ctx.strokeStyle = 'rgba(235,248,255,.9)'; ctx.lineWidth = 0.9 * m;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); }
      ctx.stroke();
    } else {
      // Hitze: flimmernde Wellenlinien steigen auf.
      const x = b.x0 + r1 * w, y = b.y1 - ((r2 * h + t * 18 * m) % h);
      ctx.strokeStyle = 'rgba(230,90,30,.45)'; ctx.lineWidth = 1.2 * m;
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) { const yy = y - k * 1.5 * m, xx = x + Math.sin(k * 0.9 + t * 4) * 1.6 * m; if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
      ctx.stroke();
    }
  }
  ctx.restore();
}
