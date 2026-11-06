/**
 * Kreuzungen beim Streckenbau:
 *  - Fluesse (Natural Earth): jede Querung braucht eine Flussbruecke, je groesser der Fluss, desto teurer.
 *  - Eigene Strecken: wo die neue Strecke eine vorhandene kreuzt, waehlt man Bruecke (Ueberfuehrung) oder Tunnel
 *    (Unterfuehrung). Im Flachland ist die Bruecke guenstiger, im Bergland (ab KREUZ_BERG_M) der Tunnel.
 */
import { FLUESSE } from './tycoon-fluesse-daten';

type P = { x: number; y: number };

/** Flussbruecke je Groessenklasse (1 Strom, 2 grosser Fluss, 3 Fluss). */
export const FLUSS_BRUECKE: Record<number, { n: string; preis: number }> = {
  1: { n: 'Strom', preis: 400 },
  2: { n: 'großer Fluss', preis: 250 },
  3: { n: 'Fluss', preis: 120 },
};
export type KreuzArt = 'bruecke' | 'tunnel';
/** Kreuzung mit einer eigenen Strecke: Preis nach Art, flach bzw. im Bergland. */
export const KREUZ_PREIS: Record<KreuzArt, { flach: number; berg: number }> = { bruecke: { flach: 150, berg: 260 }, tunnel: { flach: 300, berg: 140 } };
export const KREUZ_BERG_M = 400;
export const KREUZ_NAME: Record<KreuzArt, string> = { bruecke: '🌉 Brücke', tunnel: '🚇 Tunnel' };

/** Schnittpunkt der Strecken ab und cd: Anteil t auf ab (0..1) oder null. */
function schnitt(a: P, b: P, c: P, d: P): number | null {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y, den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qx = c.x - a.x, qy = c.y - a.y, t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/* Fluss-Segmente in einem Raster, damit beim Zeichnen nur die nahen geprueft werden. */
const ZELLE = 25;
let raster: Map<string, number[]> | null = null;
/** Segment i: Fluss f, Punkte p[j], p[j+1]. */
const segs: { f: number; ax: number; ay: number; bx: number; by: number }[] = [];
const zellen = (x0: number, y0: number, x1: number, y1: number) => {
  const r: string[] = [];
  for (let i = Math.floor(Math.min(x0, x1) / ZELLE); i <= Math.floor(Math.max(x0, x1) / ZELLE); i++)
    for (let j = Math.floor(Math.min(y0, y1) / ZELLE); j <= Math.floor(Math.max(y0, y1) / ZELLE); j++) r.push(i + ',' + j);
  return r;
};
const flussRaster = () => {
  if (raster) return raster;
  const r = new Map<string, number[]>();
  raster = r;
  FLUESSE.forEach((fl, f) => {
    for (let j = 0; j + 3 < fl.p.length; j += 2) {
      const s = { f, ax: fl.p[j], ay: fl.p[j + 1], bx: fl.p[j + 2], by: fl.p[j + 3] };
      segs.push(s);
      for (const z of zellen(s.ax, s.ay, s.bx, s.by)) { const l = r.get(z); if (l) l.push(segs.length - 1); else r.set(z, [segs.length - 1]); }
    }
  });
  return r;
};

export interface FlussQuerung { x: number; y: number; s: number; n: string; k: number }
/**
 * Flussquerungen entlang der Linie pts (cum = Laenge bis Punkt i). Mehrere Querungen desselben Flusses dicht
 * hintereinander (Flussschleifen) zaehlen als eine Bruecke.
 */
export function flussQuerungen(pts: P[], cum: number[]): FlussQuerung[] {
  const r = flussRaster(), out: FlussQuerung[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], gesehen = new Set<number>(), treffer: FlussQuerung[] = [];
    for (const z of zellen(a.x, a.y, b.x, b.y)) for (const si of r.get(z) || []) {
      if (gesehen.has(si)) continue;
      gesehen.add(si);
      const s = segs[si], t = schnitt(a, b, { x: s.ax, y: s.ay }, { x: s.bx, y: s.by });
      if (t === null) continue;
      const fl = FLUESSE[s.f];
      treffer.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: cum[i - 1] + (cum[i] - cum[i - 1]) * t, n: fl.n, k: fl.k });
    }
    treffer.sort((p, q) => p.s - q.s);
    for (const q of treffer) {
      const alt = out.find((o) => o.n === q.n && Math.abs(o.s - q.s) < 4);
      if (!alt) out.push(q);
    }
  }
  return out;
}

export interface StreckenKreuzung { x: number; y: number; s: number; linie: number; nr: number }
/**
 * Kreuzungen der Linie pts mit vorhandenen Strecken. Nahe an Streckenenden (gemeinsame Stadt, Bahnhof oder
 * Abzweig) ist es keine Kreuzung, sondern ein Anschluss.
 */
export function streckenKreuzungen(pts: P[], cum: number[], strecken: { id: number; pts: P[] }[], enden: P[], abstand = 2.5): StreckenKreuzung[] {
  const out: StreckenKreuzung[] = [];
  for (const L of strecken) {
    let nr = 0;
    for (let j = 1; j < L.pts.length; j++) {
      const c = L.pts[j - 1], d = L.pts[j];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if (Math.max(a.x, b.x) < Math.min(c.x, d.x) || Math.min(a.x, b.x) > Math.max(c.x, d.x) || Math.max(a.y, b.y) < Math.min(c.y, d.y) || Math.min(a.y, b.y) > Math.max(c.y, d.y)) continue;
        const t = schnitt(a, b, c, d);
        if (t === null) continue;
        const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        if (enden.some((e) => Math.hypot(e.x - x, e.y - y) < abstand)) continue;
        const s = cum[i - 1] + (cum[i] - cum[i - 1]) * t;
        if (out.some((o) => o.linie === L.id && Math.abs(o.s - s) < 1.5)) continue;
        out.push({ x, y, s, linie: L.id, nr: nr++ });
      }
    }
  }
  return out.sort((p, q) => p.s - q.s);
}
