/**
 * Gleisbau Tycoon -- Wetter und Jahreszeiten. Jahreszeiten wechseln alle paar Spieltage; je Jahreszeit kommen
 * Wetterlagen ueber ein Bundesland. Strecken ohne passenden Wetterschutz fahren dort langsamer, bringen weniger
 * und bekommen ggf. eine Wetter-Stoerung (Fehlerart-Index in FEHLER_ARTEN der Engine).
 * Fachtexte bewusst kurz und allgemein gehalten (Lernwelt-Themen Schiene, Bettung, Weichen, Arbeitssicherheit).
 */

export const JAHRESZEITEN = [
  { n: 'Frühling', icon: '🌸' },
  { n: 'Sommer', icon: '☀️' },
  { n: 'Herbst', icon: '🍂' },
  { n: 'Winter', icon: '❄️' },
];
export const TAGE_JE_JAHRESZEIT = 5;
/** Jahreszeit (Index) aus der Spielzeit in Sekunden und der Tageslaenge. */
export const jahreszeitAus = (zeit: number, tagSek: number): number => Math.floor(zeit / tagSek / TAGE_JE_JAHRESZEIT) % 4;

/** Wetterschutz je Strecke; Preis = jeEinheit x Streckenlaenge. */
export interface WetterSchutz { id: string; n: string; text: string; jeEinheit: number }
export const SCHUTZ: WetterSchutz[] = [
  { id: 'entwaesserung', n: 'Entwässerung', text: 'Gräben und Durchlässe frei: Starkregen spült die Bettung nicht aus.', jeEinheit: 2 },
  { id: 'spannung', n: 'Spannungsausgleich', text: 'Lückenlos verschweißtes Gleis auf Neutraltemperatur gebracht: keine Verwerfung bei Hitze.', jeEinheit: 3 },
  { id: 'gruen', n: 'Vegetationspflege', text: 'Rückschnitt am Bahndamm: weniger Laub auf den Schienen, kein Baum im Gleis bei Sturm.', jeEinheit: 1.5 },
  { id: 'heizung', n: 'Weichenheizung', text: 'Hält die Weichen bei Schnee und Frost beweglich.', jeEinheit: 2.5 },
];

export interface WetterArt {
  id: 'regen' | 'hitze' | 'laub' | 'sturm' | 'schnee';
  n: string; icon: string;
  /** Jahreszeit-Index, in der das Wetter vorkommt. */
  zeit: number;
  schutz: string;
  /** Faktoren fuer ungeschuetzte Strecken im Gebiet. */
  tempo: number; einnahmen: number;
  /** Index in FEHLER_ARTEN (Engine) oder -1 = keine Stoerung. */
  fehler: number;
  text: string;
}
export const WETTER: WetterArt[] = [
  { id: 'regen', n: 'Starkregen', icon: '🌧', zeit: 0, schutz: 'entwaesserung', tempo: 0.9, einnahmen: 0.85, fehler: 9,
    text: 'Fließt das Wasser nicht ab, steht es im Schotter: Feinteile werden ausgespült, die Bettung verliert ihre Tragfähigkeit und das Gleis sackt ein.' },
  { id: 'hitze', n: 'Hitzewelle', icon: '🌡', zeit: 1, schutz: 'spannung', tempo: 0.85, einnahmen: 0.9, fehler: 6,
    text: 'Lückenlos verschweißte Schienen können sich nicht ausdehnen und stehen bei Hitze unter Druck. Liegt die Neutraltemperatur zu niedrig, kann sich das Gleis seitlich verwerfen.' },
  { id: 'laub', n: 'Herbstlaub', icon: '🍂', zeit: 2, schutz: 'gruen', tempo: 0.75, einnahmen: 0.85, fehler: -1,
    text: 'Zerfahrenes Laub bildet einen schmierigen Film auf den Schienen: Räder schleudern beim Anfahren und rutschen beim Bremsen – die Züge müssen langsamer fahren.' },
  { id: 'sturm', n: 'Herbststurm', icon: '🌪', zeit: 2, schutz: 'gruen', tempo: 0.8, einnahmen: 0.8, fehler: 7,
    text: 'Umgestürzte Bäume blockieren das Gleis. Vor dem Räumen muss das Gleis gesperrt und ggf. die Oberleitung abgeschaltet und geerdet sein.' },
  { id: 'schnee', n: 'Schnee und Frost', icon: '❄️', zeit: 3, schutz: 'heizung', tempo: 0.8, einnahmen: 0.85, fehler: 8,
    text: 'Schnee und Eis zwischen Zunge und Backenschiene verhindern, dass die Weiche umläuft. Weichenheizungen halten sie frei.' },
];

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
