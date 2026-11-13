/**
 * 2D-Ansicht der Volumenkörper (Tim, 2026-11-06): technische Zeichnung als SVG –
 * Querschnitt/Grundfläche (die Fläche A der Formel) und, wo nötig, eine Seitenansicht für Länge/Höhe.
 * Beschriftung zeigt immer die echten Werte, zu lange/flache Körper werden gestaucht gezeichnet.
 */
import type { ModellAnsicht } from './volumen-3d';

const VW = 380, VH = 200, MAX_W = 230, MAX_H = 120;
let zaehler = 0;

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n: number) => Math.round(n * 10) / 10;

interface Box { w: number; h: number; x0: number; y0: number; xb: number; yb: number; cx: number; cy: number; }

class Panel {
  teile: string[] = [];
  gestaucht = false;
  constructor(public titel: string, private fuell: string, private text: (key: string) => { t: string; gesucht: boolean }) {}

  /** Rechteck der Größe wReal × hReal (m) einpassen, Seitenverhältnis begrenzt */
  box(wReal: number, hReal: number, maxVerh = 6): Box {
    let w = wReal, h = hReal;
    if (w / h > maxVerh) { w = h * maxVerh; this.gestaucht = true; }
    if (h / w > 3) { h = w * 3; this.gestaucht = true; }
    const s = Math.min(MAX_W / w, MAX_H / h);
    w *= s; h *= s;
    // etwas nach links gerückt: rechts steht die Höhen-Beschriftung
    const x0 = (VW - w) / 2 - 40, y0 = (VH - h) / 2;
    return { w, h, x0, y0, xb: x0 + w, yb: y0 + h, cx: x0 + w / 2, cy: VH / 2 };
  }

  flaeche(punkte: [number, number][]): void {
    this.teile.push(`<polygon class="v2d-k" fill="${this.fuell}" points="${punkte.map(p => r1(p[0]) + ',' + r1(p[1])).join(' ')}"/>`);
  }
  kreis(cx: number, cy: number, r: number, loch = 0): void {
    if (!loch) { this.teile.push(`<circle class="v2d-k" fill="${this.fuell}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}"/>`); return; }
    const k = (rr: number) => `M${r1(cx - rr)},${r1(cy)} a${r1(rr)},${r1(rr)} 0 1,0 ${r1(2 * rr)},0 a${r1(rr)},${r1(rr)} 0 1,0 ${r1(-2 * rr)},0 Z`;
    this.teile.push(`<path class="v2d-k" fill="${this.fuell}" fill-rule="evenodd" d="${k(r)} ${k(loch)}"/>`);
  }
  strich(x1: number, y1: number, x2: number, y2: number, klasse = 'v2d-hilfe'): void {
    this.teile.push(`<line class="${klasse}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`);
  }
  private label(x: number, y: number, key: string, anker: 'start' | 'middle' | 'end'): void {
    const { t, gesucht } = this.text(key);
    this.teile.push(`<text class="v2d-t${gesucht ? ' gesucht' : ''}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anker}" dominant-baseline="middle">${esc(t)}</text>`);
  }
  /** waagerechte Maßlinie in Höhe y, Text darüber oder darunter; hilfeVon = y der Körperkante für Hilfslinien */
  massH(x1: number, x2: number, y: number, key: string, lage: 'oben' | 'unten' = 'unten', hilfeVon?: number): void {
    if (hilfeVon !== undefined) { this.strich(x1, hilfeVon, x1, y + (y > hilfeVon ? 4 : -4)); this.strich(x2, hilfeVon, x2, y + (y > hilfeVon ? 4 : -4)); }
    this.strich(x1, y, x2, y, 'v2d-m');
    this.strich(x1 - 4, y + 4, x1 + 4, y - 4, 'v2d-m'); this.strich(x2 - 4, y + 4, x2 + 4, y - 4, 'v2d-m');
    this.label((x1 + x2) / 2, lage === 'oben' ? y - 11 : y + 13, key, 'middle');
  }
  /** senkrechte Maßlinie bei x, Text rechts oder links daneben */
  massV(y1: number, y2: number, x: number, key: string, lage: 'rechts' | 'links' = 'rechts', hilfeVon?: [number, number]): void {
    if (hilfeVon) { const d = x > hilfeVon[0] ? 4 : -4; this.strich(hilfeVon[0], y1, x + d, y1); this.strich(hilfeVon[1], y2, x + d, y2); }
    this.strich(x, y1, x, y2, 'v2d-m');
    this.strich(x - 4, y1 + 4, x + 4, y1 - 4, 'v2d-m'); this.strich(x - 4, y2 + 4, x + 4, y2 - 4, 'v2d-m');
    this.label(lage === 'rechts' ? x + 8 : x - 8, (y1 + y2) / 2, key, lage === 'rechts' ? 'start' : 'end');
  }

  svg(muster: string): string {
    return `<figure class="v2d-panel"><svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(this.titel)}">${muster}${this.teile.join('')}</svg>`
      + `<figcaption>${esc(this.titel)}</figcaption></figure>`;
  }
}

/** Liefert das HTML der 2D-Ansicht (ein oder zwei Zeichnungen) */
export function zeichnung2D(a: ModellAnsicht): string {
  const m = a.masse;
  const id = 'v2dk' + (++zaehler);
  const fuell = a.koernig ? `url(#${id})` : a.farbe;
  const muster = a.koernig
    ? `<defs><pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${a.farbe}"/>`
      + `<circle cx="2.5" cy="2.5" r="1.7" fill="#000" fill-opacity=".22"/><circle cx="7" cy="6.5" r="1.3" fill="#fff" fill-opacity=".25"/></pattern></defs>`
    : '';
  const text = (key: string) => { const t = a.beschriftung[key] ?? key; return { t, gesucht: t.includes('?') }; };
  const neu = (titel: string) => new Panel(titel, fuell, text);
  const panels: Panel[] = [];
  const o = 18;

  /** Seitenansicht eines Prismas: Länge l × Höhe h */
  const seite = (h: number, mitH = false) => {
    const p = neu('Seitenansicht (Länge)');
    const b = p.box(m['l'], h);
    p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
    p.massH(b.x0, b.xb, b.yb + o, 'l', 'unten', b.yb);
    if (mitH) p.massV(b.y0, b.yb, b.xb + o, 'h', 'rechts', [b.xb, b.xb]);
    panels.push(p);
  };
  /** Dreieck (gleichschenklig) mit Grundseite × Höhe */
  const dreieck = (p: Panel, gKey: string, gReal: number, hReal: number) => {
    const b = p.box(gReal, hReal);
    p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.cx, b.y0]]);
    p.strich(b.cx, b.y0, b.cx, b.yb, 'v2d-achse');
    p.massH(b.x0, b.xb, b.yb + o, gKey, 'unten', b.yb);
    p.massV(b.y0, b.yb, b.xb + o, 'h', 'rechts', [b.cx, b.xb]);
  };
  /** Kreis mit Durchmesser-Maß unten */
  const kreis = (p: Panel, dKey: string) => {
    const b = p.box(1, 1);
    const r = b.w / 2;
    p.kreis(b.cx, b.cy, r);
    p.strich(b.cx - r - 6, b.cy, b.cx + r + 6, b.cy, 'v2d-achse'); p.strich(b.cx, b.cy - r - 6, b.cx, b.cy + r + 6, 'v2d-achse');
    p.massH(b.cx - r, b.cx + r, b.yb + o, dKey, 'unten', b.cy);
  };

  switch (a.koerper) {
    case 'rechteck': {
      const p = neu('Fläche');
      const b = p.box(m['l'], m['b']);
      p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
      p.massH(b.x0, b.xb, b.yb + o, 'l', 'unten', b.yb);
      p.massV(b.y0, b.yb, b.xb + o, 'b', 'rechts', [b.xb, b.xb]);
      panels.push(p);
      break;
    }
    case 'dreiecksflaeche': {
      const p = neu('Fläche');
      dreieck(p, 'g', m['g'], m['h']);
      panels.push(p);
      break;
    }
    case 'trapez': {
      const p = neu('Querschnitt (Trapez)');
      const breit = Math.max(m['a'], m['c']);
      const b = p.box(breit, m['h']);
      const s = b.w / breit, wa = m['a'] * s, wc = m['c'] * s;
      p.flaeche([[b.cx - wc / 2, b.yb], [b.cx + wc / 2, b.yb], [b.cx + wa / 2, b.y0], [b.cx - wa / 2, b.y0]]);
      p.massH(b.cx - wa / 2, b.cx + wa / 2, b.y0 - o, 'a', 'oben', b.y0);
      p.massH(b.cx - wc / 2, b.cx + wc / 2, b.yb + o, 'c', 'unten', b.yb);
      p.massV(b.y0, b.yb, b.xb + o, 'h', 'rechts', [b.cx + wa / 2, b.cx + wc / 2]);
      panels.push(p);
      seite(m['h']);
      break;
    }
    case 'dreieck': {
      const p = neu('Querschnitt (Dreieck)');
      dreieck(p, 'g', m['g'], m['h']);
      panels.push(p);
      seite(m['h']);
      break;
    }
    case 'quader': {
      const p = neu('Querschnitt (Breite × Höhe)');
      const b = p.box(m['b'], m['h']);
      p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
      p.massH(b.x0, b.xb, b.yb + o, 'b', 'unten', b.yb);
      p.massV(b.y0, b.yb, b.xb + o, 'h', 'rechts', [b.xb, b.xb]);
      panels.push(p);
      seite(m['h']);
      break;
    }
    case 'wuerfel': {
      const p = neu('Ansicht (alle Kanten gleich)');
      const b = p.box(1, 1);
      p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
      p.massH(b.x0, b.xb, b.yb + o, 'a', 'unten', b.yb);
      p.massV(b.y0, b.yb, b.xb + o, 'a', 'rechts', [b.xb, b.xb]);
      panels.push(p);
      break;
    }
    case 'zylinder': {
      const p = neu('Seitenansicht');
      const b = p.box(m['d'], m['h']);
      p.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
      p.strich(b.cx, b.y0 - 8, b.cx, b.yb + 8, 'v2d-achse');
      p.massH(b.x0, b.xb, b.yb + o, 'd', 'unten', b.yb);
      p.massV(b.y0, b.yb, b.xb + o, 'h', 'rechts', [b.xb, b.xb]);
      panels.push(p);
      const g = neu('Grundfläche (Kreis)'); kreis(g, 'd'); panels.push(g);
      break;
    }
    case 'kegel': {
      const p = neu('Seitenansicht');
      dreieck(p, 'd', m['d'], m['h']);
      panels.push(p);
      const g = neu('Grundfläche (Kreis)'); kreis(g, 'd'); panels.push(g);
      break;
    }
    case 'pyramide': {
      const p = neu('Seitenansicht');
      dreieck(p, 'l', m['l'], m['h']);
      panels.push(p);
      const g = neu('Grundfläche (Draufsicht)');
      const b = g.box(m['l'], m['b']);
      g.flaeche([[b.x0, b.yb], [b.xb, b.yb], [b.xb, b.y0], [b.x0, b.y0]]);
      g.strich(b.x0, b.y0, b.xb, b.yb, 'v2d-kante'); g.strich(b.xb, b.y0, b.x0, b.yb, 'v2d-kante');
      g.massH(b.x0, b.xb, b.yb + o, 'l', 'unten', b.yb);
      g.massV(b.y0, b.yb, b.xb + o, 'b', 'rechts', [b.xb, b.xb]);
      panels.push(g);
      break;
    }
    case 'rohr': {
      const p = neu('Querschnitt (Kreisring)');
      const b = p.box(1, 1);
      const ra = b.w / 2;
      let ri = ra * m['d'] / m['D'];
      if (ri > ra * 0.9) { ri = ra * 0.86; p.gestaucht = true; }
      p.kreis(b.cx, b.cy, ra, ri);
      p.massH(b.cx - ra, b.cx + ra, b.yb + o, 'D', 'unten', b.cy);
      p.massH(b.cx - ri, b.cx + ri, b.cy, 'd', 'oben');
      panels.push(p);
      const s = neu('Seitenansicht');
      const bs = s.box(m['D'], m['h']);
      s.flaeche([[bs.x0, bs.yb], [bs.xb, bs.yb], [bs.xb, bs.y0], [bs.x0, bs.y0]]);
      const wi = bs.w * Math.min(m['d'] / m['D'], 0.86) / 2;
      s.strich(bs.cx - wi, bs.y0, bs.cx - wi, bs.yb, 'v2d-verdeckt'); s.strich(bs.cx + wi, bs.y0, bs.cx + wi, bs.yb, 'v2d-verdeckt');
      s.massV(bs.y0, bs.yb, bs.xb + o, 'h', 'rechts', [bs.xb, bs.xb]);
      panels.push(s);
      break;
    }
    case 'kugel': default: {
      const p = neu('Ansicht (Kugel)'); kreis(p, 'd'); panels.push(p);
      break;
    }
  }

  const gestaucht = panels.some(p => p.gestaucht);
  return `<div class="v2d-panels">${panels.map(p => p.svg(muster)).join('')}</div>`
    + (gestaucht ? '<div class="v3d-hinweis v2d-hinweis">nicht maßstäblich</div>' : '');
}
