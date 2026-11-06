/**
 * Gleisbau Tycoon -- Ereignisse, Gelaende (Bruecken/Tunnel) und Tageszeit.
 *  - Ereignisse: kommen alle paar Minuten Spielzeit, wirken eine Weile (Wirkung in tycoon-engine.ts).
 *  - Gelaende: Hoehenprofil einer Strecke -> Tunnel (durch Huegel), Bruecken (ueber Taeler), Bergstrecke; kostet mehr.
 *  - Tageszeit: Sonnenstand ueber Deutschland zur echten Uhrzeit -> Dunkelheit fuer Karte, Stadtlichter, Nachtzuege.
 */

export interface EreignisArt { id: string; n: string; icon: string; dauer: number; text: string }
/** {ort} = Stadt, {preis} = Kosten der Tarifeinigung. Nur hinten anhaengen (Index im Spielstand). */
export const EREIGNISSE: EreignisArt[] = [
  { id: 'fest', n: 'Großveranstaltung', icon: '🎉', dauer: 120, text: 'In {ort} ist eine Großveranstaltung (Messe, Konzert, Stadtfest): Deine Züge von und nach {ort} sind voll – doppelte Miete, und es kommen mehr Fremdzüge.' },
  { id: 'ferien', n: 'Ferienbeginn', icon: '🧳', dauer: 150, text: 'Ferienbeginn: Alle Personenzüge sind gut besetzt – +25 % Miete.' },
  { id: 'streik', n: 'Streik', icon: '✊', dauer: 90, text: 'Deine Lokführer streiken: Eigene Züge fahren nur mit 30 % Tempo. Eine Tarifeinigung beendet den Streik sofort ({preis}).' },
  { id: 'engpass', n: 'Lieferengpass', icon: '📦', dauer: 180, text: 'Schienen und Schwellen sind knapp: Neue Strecken, Ausbau und Baustellen kosten 50 % mehr.' },
  { id: 'foerder', n: 'Förderprogramm', icon: '🏛', dauer: 180, text: 'Förderprogramm für die Schiene: Oberleitung, zweites Gleis und Signaltechnik kosten 40 % weniger.' },
];
export const EREIGNIS_TAKT: [number, number] = [200, 320];

/* ---------- Gelaende ---------- */

export interface Kunstbau { s0: number; s1: number; art: 'tunnel' | 'bruecke' | 'berg' }
export interface Gelaende { faktor: number; tunnel: number; bruecke: number; berg: number; abschnitte: Kunstbau[] }
/** Kostenfaktor je Kilometer. */
export const GELAENDE_KOSTEN = { tunnel: 4, bruecke: 3, berg: 1.5 };

/**
 * Hoehenprofil entlang einer Linie (Punkte mit Laengen cum) mit hoehe(x, y) in Metern auswerten: Schritte von 2 km,
 * Vergleich mit dem geglaetteten Profil (+-10 km). Deutlich darueber = Linie muss durch einen Huegel (Tunnel),
 * deutlich darunter = ueber ein Tal (Bruecke); hoch oder steil = Bergstrecke.
 */
export function gelaendeVon(pts: { x: number; y: number }[], cum: number[], hoehe: (x: number, y: number) => number): Gelaende {
  const len = cum[cum.length - 1];
  // Zeichnung mit erst einem Punkt (gerade begonnen) oder ohne Laenge: kein Gelaende, sonst fehlt pts[1].
  if (pts.length < 2 || !(len > 0)) return { faktor: 1, tunnel: 0, bruecke: 0, berg: 0, abschnitte: [] };
  const n = Math.max(2, Math.ceil(len / 2)), h: number[] = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const s = len * i / n;
    while (j < cum.length - 1 && cum[j] < s) j++;
    const a = pts[j - 1], b = pts[j], f = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
    h.push(hoehe(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f));
  }
  const glatt = h.map((_, i) => { let su = 0, k = 0; for (let d = -5; d <= 5; d++) { const v = h[i + d]; if (v !== undefined) { su += v; k++; } } return su / k; });
  const abschnitte: Kunstbau[] = [];
  const g = { tunnel: 0, bruecke: 0, berg: 0 };
  const schritt = len / n;
  for (let i = 1; i <= n; i++) {
    const d = h[i] - glatt[i], steil = Math.abs(h[i] - h[i - 1]) / schritt;
    const art: Kunstbau['art'] | null = d > 50 ? 'tunnel' : d < -50 ? 'bruecke' : h[i] > 750 || steil > 15 ? 'berg' : null;
    if (!art) continue;
    g[art] += schritt;
    const l = abschnitte[abschnitte.length - 1], s0 = schritt * (i - 1);
    if (l && l.art === art && Math.abs(l.s1 - s0) < 0.01) l.s1 = schritt * i; else abschnitte.push({ s0, s1: schritt * i, art });
  }
  const faktor = (len - g.tunnel - g.bruecke - g.berg + g.tunnel * GELAENDE_KOSTEN.tunnel + g.bruecke * GELAENDE_KOSTEN.bruecke + g.berg * GELAENDE_KOSTEN.berg) / (len || 1);
  return { faktor, tunnel: Math.round(g.tunnel), bruecke: Math.round(g.bruecke), berg: Math.round(g.berg), abschnitte };
}

/* ---------- Tageszeit ---------- */

/** Sonnenhoehe (Grad) ueber der Mitte Deutschlands (51 N, 10 O) zum Zeitpunkt d (einfache Sonnenstandsformel). */
export function sonnenHoehe(d = new Date()): number {
  const rad = Math.PI / 180, tag = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000;
  const dekl = -23.44 * Math.cos(2 * Math.PI / 365 * (tag + 10)) * rad;
  const stunden = d.getUTCHours() + d.getUTCMinutes() / 60 + 10 / 15; // wahre Ortszeit bei 10 Grad Ost (grob)
  const ha = (stunden - 12) * 15 * rad, lat = 51 * rad;
  return Math.asin(Math.sin(lat) * Math.sin(dekl) + Math.cos(lat) * Math.cos(dekl) * Math.cos(ha)) / rad;
}
/** Dunkelheit 0 (Tag) .. 1 (Nacht); Daemmerung zwischen +4 und -8 Grad Sonnenhoehe. */
export const dunkelheit = (d = new Date()): number => { const h = sonnenHoehe(d); return h >= 4 ? 0 : h <= -8 ? 1 : (4 - h) / 12; };
