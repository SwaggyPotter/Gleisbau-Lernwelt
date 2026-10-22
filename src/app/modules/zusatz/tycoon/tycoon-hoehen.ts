import { HOEHEN } from './tycoon-hoehen-meta';
import { KARTE_H, KARTE_W, SC } from './tycoon-karte';

/**
 * Hoehenrelief der Tycoon-Karte (ganz Europa). Quelle: AWS Terrain Tiles (SRTM, GMTED2010, ETOPO1, EU-DEM u. a.),
 * aufbereitet von tools/tycoon-karte/erzeuge-hoehen.py. Vor dem Laden ist alles flach (Hoehe 0).
 */

/** 3D-Einheiten je Meter: etwa 8-fach ueberhoeht, damit Mittelgebirge sichtbar sind (Zugspitze ~ 2,6 Einheiten). */
export const UEBERHOEHUNG = 0.00088;
export const HOEHEN_QUELLE = 'Höhen: AWS Terrain Tiles (SRTM, GMTED2010, ETOPO1, EU-DEM)';

let meter: Float32Array | null = null;
let laden: Promise<boolean> | null = null;
let relief: HTMLCanvasElement | null = null;

/** Hoehenraster laden (einmal); true = Hoehen verfuegbar. */
export function ladeHoehen(): Promise<boolean> {
  if (laden) return laden;
  laden = new Promise<boolean>((fertig) => {
    const bild = new Image();
    bild.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = HOEHEN.breite; c.height = HOEHEN.hoehe;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bild, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        const m = new Float32Array(c.width * c.height);
        for (let i = 0; i < m.length; i++) { const v = d[i * 4] / 255; m[i] = v * v * HOEHEN.maxM; }
        meter = m;
        fertig(true);
      } catch { fertig(false); }
    };
    bild.onerror = () => fertig(false);
    bild.src = 'assets/tycoon/hoehen.png';
  });
  return laden;
}

export const hoehenGeladen = (): boolean => !!meter;

/** Hoehe in Metern an Weltkoordinaten (bilinear); 0 ausserhalb oder vor dem Laden. */
export function meterBei(x: number, y: number): number {
  if (!meter) return 0;
  const fx = (x - HOEHEN.x0) / HOEHEN.zelle - 0.5, fy = (y - HOEHEN.y0) / HOEHEN.zelle - 0.5;
  const i = Math.floor(fx), j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= HOEHEN.breite - 1 || j >= HOEHEN.hoehe - 1) return 0;
  const tx = fx - i, ty = fy - j, w = HOEHEN.breite, o = j * w + i;
  return (meter[o] * (1 - tx) + meter[o + 1] * tx) * (1 - ty) + (meter[o + w] * (1 - tx) + meter[o + w + 1] * tx) * ty;
}

/** Gelaendehoehe in 3D-Einheiten an Weltkoordinaten. */
export const hoeheWelt = (x: number, y: number): number => meterBei(x, y) * UEBERHOEHUNG;
/** Gelaendehoehe in 3D-Einheiten an 3D-Koordinaten (x, z). */
export const hoehe3D = (x: number, z: number): number => hoeheWelt(x / SC + KARTE_W / 2, -z / SC + KARTE_H / 2);

/** Farbverlauf nach Hoehe (Meter): Tiefland gruen, Mittelgebirge braun, Hochgebirge grau, Gipfel weiss. */
const STUFEN: [number, number, number, number][] = [
  [0, 132, 172, 102], [150, 160, 190, 116], [400, 205, 205, 140], [800, 196, 170, 120],
  [1400, 166, 136, 104], [2100, 150, 146, 140], [2800, 214, 214, 214], [3600, 250, 250, 252],
];
function farbe(h: number): [number, number, number] {
  for (let s = 1; s < STUFEN.length; s++) {
    if (h <= STUFEN[s][0]) {
      const a = STUFEN[s - 1], b = STUFEN[s], t = (h - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
    }
  }
  const l = STUFEN[STUFEN.length - 1];
  return [l[1], l[2], l[3]];
}

/** Eingefaerbtes Relief mit Schummerung (Licht aus Nordwesten), Rastergroesse; Lage siehe HOEHEN. Null vor dem Laden. */
export function reliefBild(): HTMLCanvasElement | null {
  if (!meter) return null;
  if (relief) return relief;
  const w = HOEHEN.breite, h = HOEHEN.hoehe, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!, img = ctx.createImageData(w, h), d = img.data, m = meter;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = j * w + i, v = m[o];
      const west = m[j * w + Math.max(0, i - 1)], ost = m[j * w + Math.min(w - 1, i + 1)];
      const nord = m[Math.max(0, j - 1) * w + i], sued = m[Math.min(h - 1, j + 1) * w + i];
      const licht = 1 + Math.max(-0.35, Math.min(0.35, ((west - ost) + (nord - sued)) * 0.0011));
      const [r, g, b] = farbe(v);
      d[o * 4] = Math.min(255, r * licht); d[o * 4 + 1] = Math.min(255, g * licht); d[o * 4 + 2] = Math.min(255, b * licht); d[o * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  relief = c;
  return c;
}
