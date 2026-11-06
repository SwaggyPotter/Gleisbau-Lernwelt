/**
 * Gleisbau Tycoon -- Geraeusche, komplett im Browser erzeugt (Web Audio): keine Sounddateien, keine fremden Lizenzen.
 * Ein/Aus pro Geraet (localStorage). Der AudioContext entsteht erst beim ersten Ton nach einer Nutzeraktion.
 */

export type TonArt = 'kasse' | 'horn' | 'klick' | 'stoerung' | 'bau' | 'erfolg' | 'fehler' | 'signal' | 'level';
const SCHLUESSEL = 'tycoon-ton';
let ctx: AudioContext | null = null, master: GainNode | null = null, rauschen: AudioBuffer | null = null;
let fahrt: { quelle: AudioBufferSourceNode; gain: GainNode } | null = null;
let an = (() => { try { return localStorage.getItem(SCHLUESSEL) !== '0'; } catch { return true; } })();
const zuletzt: Partial<Record<TonArt, number>> = {};
/** Mindestabstand (s), damit z. B. die Kasse bei vielen Zuegen nicht dauernd klingelt. */
const ABSTAND: Partial<Record<TonArt, number>> = { kasse: 1.2, klick: 0.05, horn: 2, bau: 1.5, signal: 0.3 };

export const tonAn = () => an;
export function schalteTon(wert: boolean): void {
  an = wert;
  try { localStorage.setItem(SCHLUESSEL, wert ? '1' : '0'); } catch { /* egal */ }
  if (!wert) fahrGeraeusch(0);
}

const holeCtx = (): AudioContext | null => {
  if (!an) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
      // Rosa-ish Rauschen (1 s) fuer Bau- und Fahrgeraeusch.
      rauschen = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = rauschen.getChannelData(0);
      let b = 0;
      for (let i = 0; i < d.length; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 6; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    return ctx;
  } catch { return null; }
};

/** Ton mit Huellkurve: Frequenz f (Hz), Start t0 (s ab jetzt), Dauer, Wellenform, Lautstaerke. */
const ton = (c: AudioContext, f: number, t0: number, dauer: number, form: OscillatorType, laut: number, fEnde?: number) => {
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = form; o.frequency.setValueAtTime(f, t);
  if (fEnde) o.frequency.exponentialRampToValueAtTime(fEnde, t + dauer);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  o.connect(g); g.connect(master!); o.start(t); o.stop(t + dauer + 0.05);
};
const knall = (c: AudioContext, t0: number, dauer: number, laut: number, freq: number) => {
  const q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
  q.buffer = rauschen; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  q.connect(f); f.connect(g); g.connect(master!); q.start(t, Math.random() * 0.5); q.stop(t + dauer + 0.05);
};

export function spiele(art: TonArt): void {
  const c = holeCtx();
  if (!c || !master) return;
  const jetzt = c.currentTime, ab = ABSTAND[art] ?? 0.15;
  if ((zuletzt[art] ?? -99) + ab > jetzt) return;
  zuletzt[art] = jetzt;
  switch (art) {
    case 'kasse': ton(c, 1320, 0, 0.09, 'square', 0.08); ton(c, 1760, 0.07, 0.22, 'square', 0.08); break;
    case 'klick': ton(c, 900, 0, 0.03, 'triangle', 0.08); break;
    case 'horn':
      // Zweiklang-Signalhorn (gedaempfte Saegezahnwellen).
      [311, 370].forEach((f) => { ton(c, f, 0, 0.55, 'sawtooth', 0.06); ton(c, f, 0.62, 0.7, 'sawtooth', 0.06); });
      break;
    case 'stoerung': [0, 0.22, 0.44].forEach((t) => ton(c, 880, t, 0.16, 'square', 0.07)); break;
    case 'bau': [0, 0.18, 0.36, 0.7].forEach((t) => knall(c, t, 0.12, 0.5, 1800)); knall(c, 0, 0.9, 0.12, 300); break;
    case 'erfolg': [523, 659, 784].forEach((f, i) => ton(c, f, i * 0.09, 0.25, 'triangle', 0.12)); break;
    case 'level': [523, 659, 784, 1047].forEach((f, i) => ton(c, f, i * 0.12, 0.4, 'triangle', 0.13)); break;
    case 'fehler': ton(c, 220, 0, 0.25, 'sawtooth', 0.07, 150); break;
    case 'signal': ton(c, 1568, 0, 0.6, 'sine', 0.1); ton(c, 2093, 0, 0.4, 'sine', 0.04); break;
  }
}

/** Leises Fahrgeraeusch (tiefes Rauschen), Lautstaerke 0..1 nach Zahl fahrender eigener Zuege. */
export function fahrGeraeusch(staerke: number): void {
  if (!an || staerke <= 0) { if (fahrt && ctx) fahrt.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3); return; }
  const c = holeCtx();
  if (!c || !rauschen || !master) return;
  if (!fahrt) {
    const q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    q.buffer = rauschen; q.loop = true; f.type = 'lowpass'; f.frequency.value = 160; g.gain.value = 0;
    q.connect(f); f.connect(g); g.connect(master); q.start();
    fahrt = { quelle: q, gain: g };
  }
  fahrt.gain.gain.setTargetAtTime(Math.min(1, staerke) * 0.25, c.currentTime, 0.5);
}

export function tonStopp(): void {
  try { fahrt?.quelle.stop(); } catch { /* egal */ }
  fahrt = null;
  ctx?.close().catch(() => undefined);
  ctx = null; master = null; rauschen = null;
}
