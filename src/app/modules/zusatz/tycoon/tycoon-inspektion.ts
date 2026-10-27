/**
 * Gleisbau Tycoon -- Minispiel "Inspektionsfahrt": Das Gleis (von oben gesehen) zieht unter dem Messwagen durch,
 * der Spieler tippt Fehler an, bevor sie aus dem Bild laufen. Alles selbst gezeichnet (keine fremden Grafiken).
 * Harmlose Dinge (Laub, Steine) sind Ablenkung -- sie anzutippen zaehlt als Fehlalarm.
 */

export interface FahrtArt { id: string; n: string; text: string }
/** Fehlerarten der Inspektionsfahrt (Bezeichnungen wie im Themenquiz der Lernwelt). */
export const FAHRT_ARTEN: FahrtArt[] = [
  { id: 'bruch', n: 'Schienenbruch', text: 'Lücke in einer Schiene – sofort sperren!' },
  { id: 'schwelle', n: 'Schwellenbruch', text: 'Riss quer durch die Schwelle.' },
  { id: 'klemme', n: 'Fehlende Spannklemme', text: 'Kleineisen fehlt, die Klemme liegt daneben.' },
  { id: 'schlamm', n: 'Schlammstelle', text: 'Verschmutzte Bettung: Schotter trägt nicht mehr.' },
  { id: 'spur', n: 'Spurerweiterung', text: 'Eine Schiene weicht nach außen aus.' },
  { id: 'riffeln', n: 'Riffeln', text: 'Wellen auf der Fahrfläche der Schiene.' },
];

export interface FahrtErgebnis { gesamt: number; gefunden: number; fehlalarm: number; verpasst: string[] }

interface Merkmal { art: string; i: number; x: number; schiene: 0 | 1; w: number; gefunden: boolean }
interface Deko { art: 'laub' | 'stein'; x: number; y: number; dreh: number; farbe: string }

/** Gleisgeometrie (Bildpunkte): Schwellenabstand, Schienenlage relativ zur Gleisflaeche der Hoehe h. */
const SCHWELLE = 26, BAND = 26;
const schienenY = (top: number, h: number) => [top + h * 0.34, top + h * 0.66];

let schotterMuster: HTMLCanvasElement | null = null;
const schotter = () => {
  if (schotterMuster) return schotterMuster;
  const c = document.createElement('canvas');
  c.width = c.height = 104;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8f8b83'; g.fillRect(0, 0, 104, 104);
  let a = 7;
  const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let n = 0; n < 260; n++) {
    const v = 110 + Math.floor(r() * 70);
    g.fillStyle = 'rgb(' + v + ',' + (v - 4) + ',' + (v - 10) + ')';
    g.beginPath(); g.ellipse(r() * 104, r() * 104, 1.5 + r() * 3, 1.2 + r() * 2.4, r() * 3, 0, 7); g.fill();
  }
  schotterMuster = c;
  return c;
};

/** Seitlicher Versatz der Schiene (Spurerweiterung: die obere Schiene beult nach oben, die untere nach unten aus). */
const versatz = (feats: Merkmal[], wx: number, schiene: 0 | 1) => {
  let o = 0;
  for (const f of feats) if (f.art === 'spur' && f.schiene === schiene) o += 8 * Math.exp(-(((wx - f.x) / 42) ** 2));
  return schiene === 0 ? -o : o;
};

/**
 * Zeichnet das Gleis von Weltposition s an (s = linker Bildrand) in die Flaeche (0, top, W, h).
 * feats/deko in Weltkoordinaten (x), deko.y relativ zur Gleisflaeche (0..1).
 */
const zeichneGleis = (g: CanvasRenderingContext2D, W: number, top: number, h: number, s: number, feats: Merkmal[], deko: Deko[]) => {
  const [y1, y2] = schienenY(top, h);
  g.save();
  g.beginPath(); g.rect(0, top, W, h); g.clip();
  g.save(); g.translate(-(s % 104), top); g.fillStyle = g.createPattern(schotter(), 'repeat')!; g.fillRect(0, 0, W + 104, h); g.restore();
  const sicht = (x: number, r = 60) => x - s > -r && x - s < W + r;
  // Schlammstellen liegen im Schotter, unter den Schwellen.
  for (const f of feats) if (f.art === 'schlamm' && sicht(f.x)) {
    const x = f.x - s, cy = (y1 + y2) / 2;
    g.fillStyle = 'rgba(78,58,38,.92)';
    g.beginPath(); g.ellipse(x, cy, 30, (y2 - y1) * 0.62, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(105,82,55,.9)';
    g.beginPath(); g.ellipse(x - 9, cy - 6, 13, 9, 0.4, 0, 7); g.ellipse(x + 12, cy + 8, 10, 7, -0.3, 0, 7); g.fill();
  }
  const i0 = Math.floor(s / SCHWELLE) - 1, i1 = Math.ceil((s + W) / SCHWELLE) + 1;
  const sy0 = y1 - (y2 - y1) * 0.42, sy1 = y2 + (y2 - y1) * 0.42;
  for (let i = i0; i <= i1; i++) {
    const x = i * SCHWELLE - s, bruch = feats.some((f) => f.art === 'schwelle' && f.i === i);
    g.fillStyle = bruch ? '#978c79' : '#c4bfb3'; g.strokeStyle = '#7d786e'; g.lineWidth = 1;
    g.fillRect(x - 5, sy0, 10, sy1 - sy0); g.strokeRect(x - 5, sy0, 10, sy1 - sy0);
    if (bruch) {
      // Riss quer ueber die Schwelle, ein Stueck abgeplatzt.
      g.strokeStyle = '#1e1a15'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x - 5, (y1 + y2) / 2 - 4); g.lineTo(x - 1, (y1 + y2) / 2 + 2); g.lineTo(x + 2, (y1 + y2) / 2 - 3); g.lineTo(x + 5, (y1 + y2) / 2 + 3); g.stroke();
      g.fillStyle = '#8f8b83'; g.beginPath(); g.moveTo(x + 5, sy1); g.lineTo(x + 1, sy1); g.lineTo(x + 5, sy1 - 9); g.fill();
    }
  }
  // Harmlose Ablenkung.
  for (const d of deko) if (sicht(d.x)) {
    g.save(); g.translate(d.x - s, top + d.y * h); g.rotate(d.dreh);
    g.fillStyle = d.farbe;
    if (d.art === 'laub') { g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.stroke(); }
    else { g.beginPath(); g.ellipse(0, 0, 6, 4.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke(); }
    g.restore();
  }
  // Schienen: Fuss dunkel, Fahrflaeche hell. Schienenbruch = Luecke, Riffeln = dunkle Querwellen.
  ([0, 1] as const).forEach((r) => {
    const y = r ? y2 : y1, brueche = feats.filter((f) => f.art === 'bruch' && f.schiene === r).map((f) => f.x);
    const linie = (breite: number, farbe: string) => {
      g.strokeStyle = farbe; g.lineWidth = breite; g.lineCap = 'butt';
      g.beginPath();
      let offen = false;
      for (let x = -6; x <= W + 6; x += 4) {
        const wx = x + s, inLuecke = brueche.some((b) => Math.abs(wx - b) < 6);
        if (inLuecke) { offen = false; continue; }
        const yy = y + versatz(feats, wx, r);
        if (!offen) { g.moveTo(x, yy); offen = true; } else g.lineTo(x, yy);
      }
      g.stroke();
    };
    linie(8, '#55595e'); linie(3, '#d4d7da');
    for (const f of feats) if (f.art === 'riffeln' && f.schiene === r && sicht(f.x, 80)) {
      g.strokeStyle = 'rgba(40,42,46,.85)'; g.lineWidth = 1.6;
      for (let d = -40; d <= 40; d += 5) { const x = f.x + d - s, yy = y + versatz(feats, f.x + d, r); g.beginPath(); g.moveTo(x, yy - 2); g.lineTo(x, yy + 2); g.stroke(); }
    }
  });
  // Spannklemmen je Schwelle und Schiene (innen und aussen); fehlende Klemme liegt daneben im Schotter.
  for (let i = i0; i <= i1; i++) {
    const x = i * SCHWELLE - s;
    ([0, 1] as const).forEach((r) => {
      const fehlt = feats.some((f) => f.art === 'klemme' && f.i === i && f.schiene === r);
      const y = (r ? y2 : y1) + versatz(feats, i * SCHWELLE, r);
      g.fillStyle = '#26282b';
      if (fehlt) {
        g.fillRect(x - 3, y + 5, 6, 4);
        g.save(); g.translate(x + 13, y + (r ? 22 : -22)); g.rotate(0.8); g.fillRect(-3, -2, 7, 4); g.restore();
      } else { g.fillRect(x - 3, y - 9, 6, 4); g.fillRect(x - 3, y + 5, 6, 4); }
    });
  }
  g.restore();
};

/** Zufall mit Startwert (Legende soll immer gleich aussehen). */
const zufall = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const neueDeko = (rnd: () => number, x0: number, x1: number, n: number): Deko[] => Array.from({ length: n }, () => {
  const laub = rnd() < 0.65;
  return { art: laub ? 'laub' : 'stein', x: x0 + rnd() * (x1 - x0), y: 0.08 + rnd() * 0.84, dreh: rnd() * 3,
    farbe: laub ? ['#c8741e', '#d9a12a', '#7a9a2e', '#a3461d'][Math.floor(rnd() * 4)] : '#9d9a94' };
});

/** Legende fuer den Startbildschirm: jede Fehlerart als kleiner Gleisausschnitt mit Namen, dazu "harmlos". */
export function zeichneLegende(cv: HTMLCanvasElement) {
  const W = cv.clientWidth || 400, spalten = W < 360 ? 2 : 3, zw = W / spalten, zh = 86, zeilen = Math.ceil((FAHRT_ARTEN.length + 1) / spalten);
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = zeilen * zh * dpr; cv.style.height = zeilen * zh + 'px';
  const g = cv.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, zeilen * zh);
  const sc = 0.6, breite = zw / sc - 8 / sc;
  [...FAHRT_ARTEN.map((a) => a.id), 'harmlos'].forEach((id, n) => {
    const cx = (n % spalten) * zw + 4, cy = Math.floor(n / spalten) * zh + 2;
    const mitte = breite / 2, i = Math.round(mitte / SCHWELLE);
    const feats: Merkmal[] = id === 'harmlos' ? [] : [{ art: id, i, x: id === 'schwelle' || id === 'klemme' ? i * SCHWELLE : mitte, schiene: 0, w: 40, gefunden: false }];
    const deko = id === 'harmlos' ? neueDeko(zufall(11), 10, breite - 10, 7) : [];
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    zeichneGleis(g, breite, 0, 110, 0, feats, deko);
    g.restore();
    g.fillStyle = '#23262b'; g.font = '600 11px system-ui'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText(id === 'harmlos' ? 'Harmlos: Laub, Steine' : FAHRT_ARTEN.find((a) => a.id === id)!.n, cx + zw / 2 - 4, cy + 110 * sc + 3);
  });
}

/**
 * Startet die Fahrt im Canvas. anzahl = Zahl der Fehler, tempo = Bildpunkte je Sekunde.
 * Liefert eine Stopp-Funktion (z. B. beim Schliessen des Fensters).
 */
export function starteFahrt(cv: HTMLCanvasElement, o: { anzahl: number; tempo: number; onEnde: (e: FahrtErgebnis) => void }): () => void {
  const W = cv.clientWidth || 400, H = 200, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d')!;
  const rnd = zufall(Math.floor(Math.random() * 1e6) + 1);
  const h = H - BAND, [y1, y2] = schienenY(BAND, h);
  // Fehler im Abstand von 6..13 Schwellen, Start kurz hinter dem rechten Bildrand.
  const feats: Merkmal[] = [];
  let i = Math.ceil(W / SCHWELLE) + 3;
  for (let n = 0; n < o.anzahl; n++) {
    const art = FAHRT_ARTEN[Math.floor(rnd() * FAHRT_ARTEN.length)].id, schiene = (rnd() < 0.5 ? 0 : 1) as 0 | 1;
    const genau = art === 'schwelle' || art === 'klemme';
    feats.push({ art, i, x: genau ? i * SCHWELLE : i * SCHWELLE + SCHWELLE / 2, schiene, w: art === 'riffeln' || art === 'spur' ? 80 : art === 'schlamm' ? 60 : 26, gefunden: false });
    i += 6 + Math.floor(rnd() * 8);
  }
  const ende = i * SCHWELLE + W * 0.3;
  const deko = neueDeko(rnd, W, ende - W * 0.3, Math.round(o.anzahl * 0.9));
  const hinweise: { x: number; y: number; t: string; gut: boolean; alter: number }[] = [];
  let s = 0, fehlalarm = 0, laeuft = true, last = performance.now(), raf = 0;

  const yVon = (f: Merkmal) => f.art === 'schlamm' || f.art === 'schwelle' ? (y1 + y2) / 2 : f.schiene ? y2 : y1;
  const zeichne = () => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    zeichneGleis(g, W, BAND, h, s, feats, deko);
    // Gefundene Fehler gruen eingekreist.
    for (const f of feats) if (f.gefunden && f.x - s > -60 && f.x - s < W + 60) {
      g.strokeStyle = '#2ecc71'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(f.x - s, yVon(f), Math.max(18, f.w / 2 + 6), f.art === 'schlamm' ? 36 : 18, 0, 0, 7); g.stroke();
    }
    for (const t of hinweise) {
      g.globalAlpha = Math.max(0, 1 - t.alter / 1.3);
      g.font = '700 13px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = g.measureText(t.t).width + 12;
      g.fillStyle = t.gut ? 'rgba(46,139,87,.95)' : 'rgba(192,57,43,.95)';
      g.fillRect(t.x - s - w / 2, t.y - 30 - t.alter * 20, w, 20);
      g.fillStyle = '#fff'; g.fillText(t.t, t.x - s, t.y - 20 - t.alter * 20);
      g.globalAlpha = 1;
    }
    // Kopfleiste: Fortschritt und Zaehler.
    g.fillStyle = '#23262b'; g.fillRect(0, 0, W, BAND);
    g.fillStyle = '#4b5059'; g.fillRect(8, BAND - 6, W - 16, 3);
    g.fillStyle = '#ff8a3d'; g.fillRect(8, BAND - 6, (W - 16) * Math.min(1, s / ende), 3);
    g.fillStyle = '#fff'; g.font = '600 12px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('✓ ' + feats.filter((f) => f.gefunden).length + ' gefunden · ✗ ' + fehlalarm + ' Fehlalarm', 8, 10);
    g.textAlign = 'right'; g.fillText('Fehler antippen!', W - 8, 10);
  };
  const schritt = (now: number) => {
    if (!laeuft) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    s += o.tempo * dt;
    for (let n = hinweise.length - 1; n >= 0; n--) { hinweise[n].alter += dt; if (hinweise[n].alter > 1.3) hinweise.splice(n, 1); }
    zeichne();
    if (s >= ende) {
      laeuft = false;
      o.onEnde({ gesamt: feats.length, gefunden: feats.filter((f) => f.gefunden).length, fehlalarm,
        verpasst: feats.filter((f) => !f.gefunden).map((f) => FAHRT_ARTEN.find((a) => a.id === f.art)!.n) });
      return;
    }
    raf = requestAnimationFrame(schritt);
  };
  const tippe = (e: PointerEvent) => {
    if (!laeuft) return;
    e.preventDefault();
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < BAND) return;
    const wx = x + s;
    let best: Merkmal | null = null, bd = Infinity;
    for (const f of feats) {
      if (f.gefunden) continue;
      const dx = Math.abs(wx - f.x) - f.w / 2, dy = Math.abs(y - yVon(f)) - (f.art === 'schlamm' || f.art === 'schwelle' ? 40 : 14);
      const d = Math.max(dx, 0) + Math.max(dy, 0);
      if (d < 18 && d < bd) { bd = d; best = f; }
    }
    if (best) { best.gefunden = true; hinweise.push({ x: best.x, y: yVon(best), t: '✓ ' + FAHRT_ARTEN.find((a) => a.id === best!.art)!.n, gut: true, alter: 0 }); }
    else { fehlalarm++; hinweise.push({ x: wx, y, t: '✗ kein Fehler', gut: false, alter: 0 }); }
  };
  cv.addEventListener('pointerdown', tippe);
  raf = requestAnimationFrame(schritt);
  return () => { laeuft = false; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', tippe); };
}
