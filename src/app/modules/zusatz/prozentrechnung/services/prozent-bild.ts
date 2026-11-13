/**
 * Bilder zur Prozentrechnung (Tim, 2026-11-06) als SVG:
 *  - Prozentstreifen (Anteil, Erhöhung, Minderung) mit Klammern für G, W und neuen Wert
 *  - Kette mehrerer Schritte (Rabatt → Skonto → MwSt) als Balken
 *  - Neigungsdreieck (‰) mit Gleis
 * Gesuchte Werte („?“) erscheinen in Akzentfarbe.
 */
import type { Bild } from './prozent-aufgaben';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n: number) => Math.round(n * 10) / 10;
const fz = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 2 });

function txt(x: number, y: number, t: string, anker: 'start' | 'middle' | 'end' = 'middle', klein = false): string {
  const ges = t.includes('?');
  return `<text class="pzb-t${ges ? ' gesucht' : ''}${klein ? ' klein' : ''}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anker}" dominant-baseline="middle">${esc(t)}</text>`;
}
function linie(x1: number, y1: number, x2: number, y2: number, k = 'pzb-l'): string {
  return `<line class="${k}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
}
/** waagerechte Klammer unter dem Streifen mit Beschriftung */
function klammer(x1: number, x2: number, y: number, t: string): string {
  return `<path class="pzb-k" d="M${r1(x1)},${r1(y - 6)} V${r1(y)} H${r1(x2)} V${r1(y - 6)}"/>` + txt((x1 + x2) / 2, y + 13, t);
}
function rechteck(x: number, y: number, w: number, h: number, k: string): string {
  return `<rect class="${k}" x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(w, 0))}" height="${r1(h)}" rx="3"/>`;
}

const MUSTER = `<defs><pattern id="pzb-weg" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
  + `<rect width="8" height="8" class="pzb-weg-grund"/><line x1="0" y1="0" x2="0" y2="8" class="pzb-weg-strich"/></pattern></defs>`;

function streifen(b: Extract<Bild, { art: 'streifen' }>): string {
  const VW = 420, x0 = 30, breite = 340, y = 62, h = 40;
  // kleine Prozentsätze sichtbar machen: Zusatzstück mind. 14 % breit
  const pv = b.modus === 'anteil' ? Math.min(Math.max(b.p, 6), 94) : Math.min(Math.max(b.p, 14), 60);
  const teile: string[] = [MUSTER];
  if (b.modus === 'anteil') {
    const s = breite / 100, xp = x0 + pv * s, xe = x0 + 100 * s;
    teile.push(rechteck(x0, y, 100 * s, h, 'pzb-leer'), rechteck(x0, y, pv * s, h, 'pzb-voll'));
    teile.push(txt(x0, y - 14, '0 %', 'start', true), txt(xe, y - 14, '100 %', 'end', true), txt(xp, y - 14, b.P), linie(xp, y - 6, xp, y + h + 2, 'pzb-mark'));
    teile.push(klammer(x0, xp, y + h + 16, b.W), klammer(x0, xe, y + h + 50, b.G));
    return svg(VW, 190, teile);
  }
  if (b.modus === 'plus') {
    const s = breite / (100 + pv), x100 = x0 + 100 * s, xe = x0 + (100 + pv) * s;
    teile.push(rechteck(x0, y, 100 * s, h, 'pzb-voll'), rechteck(x100, y, pv * s, h, 'pzb-plus'));
    teile.push(txt(x0, y - 14, '0 %', 'start', true), txt(x100 - 4, y - 14, '100 %', 'end', true), txt((x100 + xe) / 2, y + h / 2, '+' + b.P),
      txt(xe, y - 14, `${fz(100 + b.p)} %`, 'end', true), linie(x100, y - 6, x100, y + h + 2, 'pzb-mark'));
    teile.push(klammer(x0, x100, y + h + 16, b.G), klammer(x100, xe, y + h + 16, ''), txt(xe, y + h + 29, b.W, 'end'));
    teile.push(klammer(x0, xe, y + h + 56, b.E ?? ''));
    return svg(VW, 196, teile);
  }
  // minus
  const s = breite / 100, xr = x0 + (100 - pv) * s, xe = x0 + 100 * s;
  teile.push(rechteck(x0, y, (100 - pv) * s, h, 'pzb-voll'), `<rect x="${r1(xr)}" y="${y}" width="${r1(pv * s)}" height="${h}" rx="3" fill="url(#pzb-weg)" class="pzb-wegrand"/>`);
  teile.push(txt(x0, y - 14, '0 %', 'start', true), txt(xr - 4, y - 14, `${fz(100 - b.p)} %`, 'end', true), txt(xe, y - 14, '100 %', 'end', true),
    txt((xr + xe) / 2, y + h / 2, '−' + b.P), linie(xr, y - 6, xr, y + h + 2, 'pzb-mark'));
  teile.push(klammer(x0, xr, y + h + 16, b.E ?? ''), klammer(xr, xe, y + h + 16, ''), txt(xe, y + h + 29, b.W, 'end'));
  teile.push(klammer(x0, xe, y + h + 56, b.G));
  return svg(VW, 196, teile);
}

function kette(b: Extract<Bild, { art: 'kette' }>): string {
  const VW = 420, xBalken = 120, maxB = 190, zh = 44, y0 = 16;
  const max = Math.max(...b.zeilen.map(z => z.wert));
  const teile: string[] = [];
  b.zeilen.forEach((z, i) => {
    const y = y0 + i * zh, w = Math.max(8, z.wert / max * maxB);
    if (z.schritt) teile.push(txt(xBalken - 10, y - 6, z.schritt, 'end', true), linie(xBalken - 4, y - 14, xBalken - 4, y + 2, 'pzb-mark'));
    teile.push(txt(xBalken - 10, y + 14, z.name, 'end'));
    teile.push(rechteck(xBalken, y + 4, w, 22, i === 0 ? 'pzb-voll' : 'pzb-plus'));
    teile.push(txt(xBalken + w + 8, y + 15, z.text, 'start'));
  });
  return svg(VW, y0 + b.zeilen.length * zh + 6, teile);
}

function neigung(b: Extract<Bild, { art: 'neigung' }>): string {
  const VW = 420, VH = 200, x0 = 40, x1 = 330, yu = 150;
  const hoch = 80; // überhöht gezeichnet
  const yL = b.steigt ? yu : yu - hoch, yR = b.steigt ? yu - hoch : yu;
  const teile: string[] = [];
  teile.push(`<polygon class="pzb-dreieck" points="${x0},${yL} ${x1},${yR} ${x1},${yu} ${x0},${yu}"/>`);
  // Gleis mit Schwellen
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, yy = yL + (yR - yL) * t;
    teile.push(linie(x, yy - 3, x, yy + 5, 'pzb-schwelle'));
  }
  teile.push(linie(x0, yL - 3, x1, yR - 3, 'pzb-schiene'));
  teile.push(linie(x0, yu, x1, yu, 'pzb-l'));
  // Maße
  teile.push(`<path class="pzb-k" d="M${x0},${yu + 8} V${yu + 16} H${x1} V${yu + 8}"/>`, txt((x0 + x1) / 2, yu + 30, b.l));
  teile.push(`<path class="pzb-k" d="M${x1 + 8},${Math.min(yL, yR)} H${x1 + 16} V${yu} H${x1 + 8}"/>`, txt(x1 + 22, (Math.min(yL, yR) + yu) / 2, b.dh, 'start'));
  teile.push(txt((x0 + x1) / 2 + (b.steigt ? -40 : 40), (yL + yR) / 2 - 30, `${b.steigt ? 'steigt' : 'fällt'} ${b.n}`));
  teile.push(txt(x0, 16, 'überhöht gezeichnet', 'start', true));
  return svg(VW, VH, teile);
}

function svg(w: number, h: number, teile: string[]): string {
  return `<svg class="pzb-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Bild zur Aufgabe">${teile.join('')}</svg>`;
}

export function prozentBild(b: Bild): string {
  return b.art === 'streifen' ? streifen(b) : b.art === 'kette' ? kette(b) : neigung(b);
}
