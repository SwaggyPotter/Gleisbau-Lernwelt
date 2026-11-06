/**
 * Gleisbau Tycoon -- Minispiel "Stellwerk": kleiner Bahnhof mit drei Gleisen als Spurplan (Stellwerksbildschirm).
 * Weichen antippen = umstellen, Signal antippen = Fahrstrasse einstellen. Das Stellwerk prueft, ob die Weichen zum
 * Ziel des Zuges fuehren und das Gleis frei ist, verschliesst die Weichen der Fahrstrasse und stellt das Signal auf
 * Fahrt (Hp 1) bzw. Langsamfahrt (Hp 2, ueber abzweigende Weichen). Nach dem Halt am Bahnsteig: Ausfahrt einstellen.
 */

import { spiele } from './tycoon-ton';

export interface StellwerkErgebnis { zuege: number; fehler: number; verspaetung: number }

type P = [number, number];
/** Gleisabschnitte im Spurplan (logische Koordinaten 720 x 230). */
const SEG: Record<string, P[]> = {
  zu: [[0, 120], [110, 120]], w1g: [[110, 120], [170, 120]], w1a: [[110, 120], [160, 60], [200, 60]],
  w2g: [[170, 120], [200, 120]], w2a: [[170, 120], [220, 180], [235, 180]],
  g1: [[200, 60], [500, 60]], g2: [[200, 120], [500, 120]], g3: [[235, 180], [490, 180]],
  w3a: [[500, 60], [580, 60], [620, 120]], w4g: [[500, 120], [560, 120]], w4a: [[490, 180], [540, 180], [560, 120]],
  w34: [[560, 120], [620, 120]], ab: [[620, 120], [720, 120]],
};
const EIN: Record<number, string[]> = { 1: ['zu', 'w1a', 'g1'], 2: ['zu', 'w1g', 'w2g', 'g2'], 3: ['zu', 'w1g', 'w2a', 'g3'] };
const AUS: Record<number, string[]> = { 1: ['g1', 'w3a', 'ab'], 2: ['g2', 'w4g', 'w34', 'ab'], 3: ['g3', 'w4a', 'w34', 'ab'] };
/** Weichen: Lage im Plan, gerader und abzweigender Schenkel. */
const WEICHEN: { id: string; p: P; g: string; a: string }[] = [
  { id: 'W1', p: [110, 120], g: 'w1g', a: 'w1a' }, { id: 'W2', p: [170, 120], g: 'w2g', a: 'w2a' },
  { id: 'W4', p: [560, 120], g: 'w4g', a: 'w4a' }, { id: 'W3', p: [620, 120], g: 'w34', a: 'w3a' },
];
/** Weichenlagen, die eine Fahrstrasse braucht. */
const LAGE_EIN: Record<number, Record<string, 'g' | 'a'>> = { 1: { W1: 'a' }, 2: { W1: 'g', W2: 'g' }, 3: { W1: 'g', W2: 'a' } };
const LAGE_AUS: Record<number, Record<string, 'g' | 'a'>> = { 1: { W3: 'a' }, 2: { W4: 'g', W3: 'g' }, 3: { W4: 'a', W3: 'g' } };
/** Halteplatz (x) je Gleis, kurz vor dem Ausfahrsignal; Signale (Lage). */
const HALT: Record<number, number> = { 1: 478, 2: 478, 3: 468 };
const SIG: Record<string, P> = { A: [92, 120], N1: [486, 60], N2: [486, 120], N3: [476, 180] };
const ZUGLAENGE = 70, TEMPO = 70;
const NAMEN = ['RB 12', 'RE 7', 'GZ 45', 'RB 31', 'IRE 4', 'GZ 18', 'RB 56', 'RE 2'];

const punkte = (ids: string[]): P[] => { const o: P[] = []; ids.forEach((id) => SEG[id].forEach((q) => { const l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q); })); return o; };
const laenge = (pts: P[]) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
const punktBei = (pts: P[], s: number): P => {
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (s <= d) { const f = d ? s / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; }
    s -= d;
  }
  return pts[pts.length - 1];
};
/** Laenge entlang pts bis zur Stelle x (erstes Erreichen). */
const bisX = (pts: P[], x: number) => { let l = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if ((x - a[0]) * (x - b[0]) <= 0 && b[0] !== a[0]) return l + d * (x - a[0]) / (b[0] - a[0]); l += d; } return l; };

interface Zug { fehl?: Set<string>; n: string; ziel: number; zustand: 'wartet' | 'ein' | 'steht' | 'aus'; pfad: P[]; s: number; ende: number; warte: number; halt: number }

export function starteStellwerk(el: HTMLElement, o: { zuege: number; onEnde: (e: StellwerkErgebnis) => void }): () => void {
  el.innerHTML = '<canvas class="sw-cv"></canvas><div class="sw-info"></div><div class="sw-log"></div>';
  const cv = el.querySelector('.sw-cv') as HTMLCanvasElement, info = el.querySelector('.sw-info') as HTMLElement, log = el.querySelector('.sw-log') as HTMLElement;
  const W = cv.clientWidth || el.clientWidth || 400, sk = W / 720, H = Math.round(230 * sk), dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d')!;
  const lage: Record<string, 'g' | 'a'> = { W1: 'g', W2: 'g', W3: 'g', W4: 'g' };
  const signal: Record<string, number> = { A: 0, N1: 0, N2: 0, N3: 0 };
  const zuege: Zug[] = [];
  let ein: Zug | null = null, aus: Zug | null = null, erzeugt = 0, fertig = 0, fehler = 0, versp = 0, bisNaechster = 1.5, aktiv = true, raf = 0, last = performance.now();
  const meldungen: { t: string; gut: boolean }[] = [];
  const melde = (t: string, gut = false) => {
    meldungen.unshift({ t, gut }); meldungen.length = Math.min(meldungen.length, 4);
    log.innerHTML = meldungen.map((m, i) => '<div class="' + (m.gut ? 'pos' : 'neg') + '"' + (i ? ' style="opacity:.6"' : '') + '>' + m.t + '</div>').join('');
  };
  const verschlossen = (w: string) => (!!ein && w in LAGE_EIN[ein.ziel]) || (!!aus && w in LAGE_AUS[aus.ziel]);
  const gleisBelegt = (n: number) => zuege.some((z) => z.ziel === n && (z.zustand === 'ein' || z.zustand === 'steht' || (z.zustand === 'aus' && z.s - ZUGLAENGE < bisX(z.pfad, 500))));
  const wartend = () => zuege.find((z) => z.zustand === 'wartet');

  const neuerZug = () => {
    // Ziel: moeglichst ein freies Gleis, sonst zufaellig (dann muss man warten, bis es frei wird).
    const frei = [1, 2, 3].filter((n) => !gleisBelegt(n) && !zuege.some((z) => z.ziel === n && z.zustand !== 'aus'));
    const ziel = frei.length ? frei[Math.floor(Math.random() * frei.length)] : 1 + Math.floor(Math.random() * 3);
    const pfad = punkte(EIN[ziel]);
    zuege.push({ n: NAMEN[erzeugt % NAMEN.length], ziel, zustand: 'wartet', pfad, s: 40, ende: bisX(pfad, HALT[ziel]), warte: 0, halt: 0 });
    erzeugt++;
  };
  const stelleWeiche = (w: string) => {
    if (verschlossen(w)) { melde('🔒 ' + w + ' ist verschlossen – eine Fahrstraße führt darüber. Erst wenn der Zug durch ist, löst sie sich auf.'); return; }
    lage[w] = lage[w] === 'g' ? 'a' : 'g';
    spiele('klick');
    cv.dataset['lage'] = JSON.stringify(lage);
  };
  /** Ziel der Einfahrt nach den aktuellen Weichenlagen. */
  const einZiel = () => (lage['W1'] === 'a' ? 1 : lage['W2'] === 'g' ? 2 : 3);
  const passt = (soll: Record<string, 'g' | 'a'>) => Object.keys(soll).every((w) => lage[w] === soll[w]);
  /** Fehler zaehlt je Zug und Art nur einmal (mehrfaches Antippen bestraft nicht doppelt). */
  const fehlerVon = (z: Zug, art: string) => { spiele('fehler'); z.fehl = z.fehl || new Set(); if (!z.fehl.has(art)) { z.fehl.add(art); fehler++; } };
  const ziehSignal = (s: string) => {
    if (s === 'A') {
      const z = wartend();
      if (!z) { melde('Vor dem Einfahrsignal wartet gerade kein Zug.'); return; }
      if (ein) { melde('Die Einfahrt ist noch belegt – ' + ein.n + ' fährt gerade ein.'); return; }
      const g2 = einZiel();
      if (g2 !== z.ziel) { fehlerVon(z, 'weiche'); melde('✗ Die Weichen führen auf Gleis ' + g2 + ', ' + z.n + ' soll aber auf Gleis ' + z.ziel + '. Weichen prüfen!'); return; }
      if (gleisBelegt(g2)) { fehlerVon(z, 'besetzt'); melde('✗ Gleis ' + g2 + ' ist besetzt – Fahrstraße nicht einstellbar. Erst ausfahren lassen.'); return; }
      ein = z; z.zustand = 'ein'; signal['A'] = g2 === 2 ? 1 : 2; spiele('signal');
      melde('✓ Fahrstraße nach Gleis ' + g2 + ' eingestellt, Weichen verschlossen. Signal A: ' + (g2 === 2 ? 'Hp 1 (Fahrt)' : 'Hp 2 (Langsamfahrt, abzweigend)'), true);
      return;
    }
    const n = +s.slice(1), z = zuege.find((x) => x.ziel === n && x.zustand === 'steht');
    if (!z) { melde('Auf Gleis ' + n + ' steht kein abfahrbereiter Zug.'); return; }
    if (z.halt > 0) { melde(z.n + ' ist noch nicht abfahrbereit (Fahrgastwechsel).'); return; }
    if (aus) { melde('Die Ausfahrt ist noch belegt – ' + aus.n + ' fährt gerade aus.'); return; }
    if (!passt(LAGE_AUS[n])) { fehlerVon(z, 'aus'); melde('✗ Die Weichen W3/W4 stehen nicht richtig für die Ausfahrt aus Gleis ' + n + '.'); return; }
    const pfad = punkte(AUS[n]);
    Object.assign(z, { zustand: 'aus', pfad, s: bisX(pfad, HALT[n]), ende: laenge(pfad) + ZUGLAENGE });
    aus = z; signal[s] = n === 2 ? 1 : 2; spiele('signal');
    melde('✓ Ausfahrt aus Gleis ' + n + ' eingestellt. Signal ' + s + ': ' + (n === 2 ? 'Hp 1' : 'Hp 2'), true);
  };
  const tippe = (e: PointerEvent) => {
    if (!aktiv) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / sk, y = (e.clientY - r.top) / sk;
    for (const w of WEICHEN) if (Math.hypot(x - w.p[0], y - w.p[1]) < 20) { stelleWeiche(w.id); return; }
    for (const s in SIG) { const p = SIG[s]; if (Math.hypot(x - (p[0] - 2), y - (p[1] - 20)) < 18) { ziehSignal(s); return; } }
  };
  cv.addEventListener('pointerdown', tippe);

  const takt = (dt: number) => {
    if (erzeugt < o.zuege && !wartend()) { bisNaechster -= dt; if (bisNaechster <= 0) { neuerZug(); bisNaechster = 6 + Math.random() * 5; } }
    for (const z of zuege.slice()) {
      if (z.zustand === 'wartet') { z.warte += dt; if (z.warte > 15) versp += dt; }
      else if (z.zustand === 'ein') {
        z.s = Math.min(z.ende, z.s + TEMPO * dt * (signal['A'] === 2 && z.s < 260 ? 0.7 : 1));
        // Zug ganz im Gleis: Fahrstrasse loest sich auf, Signal faellt auf Halt.
        if (z.s - ZUGLAENGE > bisX(z.pfad, 240) && signal['A']) signal['A'] = 0;
        if (z.s >= z.ende) { z.zustand = 'steht'; z.halt = 4; ein = null; signal['A'] = 0; melde(z.n + ' steht an Gleis ' + z.ziel + '. Nach dem Fahrgastwechsel: Ausfahrt einstellen (W3/W4 und Signal N' + z.ziel + ').', true); }
      } else if (z.zustand === 'steht') { if (z.halt > 0) z.halt -= dt; else { z.warte += dt; if (z.warte > 20) versp += dt; } }
      else if (z.zustand === 'aus') {
        z.s += TEMPO * dt;
        if (z.s - ZUGLAENGE > bisX(z.pfad, 560)) signal['N' + z.ziel] = 0;
        if (z.s >= z.ende) { zuege.splice(zuege.indexOf(z), 1); aus = null; fertig++; melde('✓ ' + z.n + ' hat den Bahnhof verlassen (' + fertig + ' / ' + o.zuege + ').', true); }
      }
    }
    if (fertig >= o.zuege) { aktiv = false; setTimeout(() => o.onEnde({ zuege: fertig, fehler, verspaetung: Math.round(versp) }), 600); }
  };
  const linie = (pts: P[], farbe: string, breite: number) => {
    g.strokeStyle = farbe; g.lineWidth = breite; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke();
  };
  const zeichne = () => {
    g.setTransform(dpr * sk, 0, 0, dpr * sk, 0, 0);
    g.fillStyle = '#1b2129'; g.fillRect(0, 0, 720, 230);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // Bahnsteige
    g.fillStyle = '#2d3742'; g.fillRect(240, 76, 230, 26); g.fillRect(250, 136, 210, 26);
    g.fillStyle = '#7f8b99'; g.font = '600 11px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Bahnsteig 1/2', 300, 89); g.fillText('Bahnsteig 3', 310, 149);
    // Gleise grau, Fahrstrassen gruen, besetzte Gleise rot.
    for (const id in SEG) linie(SEG[id], '#5f6b78', 5);
    if (ein) EIN[ein.ziel].forEach((id) => linie(SEG[id], '#27ae60', 5));
    if (aus) AUS[aus.ziel].forEach((id) => linie(SEG[id], '#27ae60', 5));
    [1, 2, 3].forEach((n) => { if (gleisBelegt(n) && !(ein && ein.ziel === n) && !(aus && aus.ziel === n)) linie(SEG['g' + n], '#c0392b', 5); });
    for (const n of [1, 2, 3]) { const p = SEG['g' + n][0]; g.fillStyle = '#c9d2dc'; g.font = '700 12px system-ui'; g.fillText('Gl. ' + n, p[0] + 6, p[1] - 10); }
    // Weichen: anliegender Schenkel hell, der andere mit Luecke.
    for (const w of WEICHEN) {
      const sch = (id: string) => { const pts = SEG[id], ab = pts[0][0] === w.p[0] && pts[0][1] === w.p[1]; const a = ab ? pts[0] : pts[pts.length - 1], b = ab ? pts[1] : pts[pts.length - 2]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a, [a[0] + (b[0] - a[0]) * 22 / d, a[1] + (b[1] - a[1]) * 22 / d]] as P[]; };
      const an = sch(lage[w.id] === 'g' ? w.g : w.a), weg = sch(lage[w.id] === 'g' ? w.a : w.g);
      linie(weg, '#1b2129', 7);
      linie(an, verschlossen(w.id) ? '#f1c40f' : '#ecf0f1', 5);
      g.fillStyle = verschlossen(w.id) ? '#f1c40f' : '#9fb3c8'; g.font = '700 11px system-ui'; g.textAlign = 'center';
      g.fillText(w.id + (verschlossen(w.id) ? ' 🔒' : ''), w.p[0], w.p[1] + (w.id === 'W1' || w.id === 'W3' ? 22 : -18));
      g.strokeStyle = 'rgba(159,179,200,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(w.p[0], w.p[1], 14, 0, 7); g.stroke();
    }
    // Signale: Mast und Schirm; Hp 0 rot, Hp 1 gruen, Hp 2 gruen + gelb.
    for (const s in SIG) {
      const [x, y] = SIG[s], st = signal[s];
      g.strokeStyle = '#9fb3c8'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x, y - 10); g.stroke();
      g.fillStyle = '#0d1117'; g.beginPath(); g.roundRect(x - 9, y - 32, 14, 24, 4); g.fill(); g.strokeStyle = '#9fb3c8'; g.stroke();
      g.fillStyle = st ? '#2ecc71' : '#e74c3c'; g.beginPath(); g.arc(x - 2, y - 26, 4, 0, 7); g.fill();
      g.fillStyle = st === 2 ? '#f1c40f' : '#3b4048'; g.beginPath(); g.arc(x - 2, y - 15, 4, 0, 7); g.fill();
      g.fillStyle = '#c9d2dc'; g.font = '700 10px system-ui'; g.textAlign = 'center'; g.fillText(s, x - 2, y - 40);
    }
    // Zuege als Balken entlang ihres Weges.
    for (const z of zuege) {
      const pts: P[] = [];
      for (let d = Math.max(0, z.s - ZUGLAENGE); d <= z.s; d += 6) pts.push(punktBei(z.pfad, d));
      pts.push(punktBei(z.pfad, z.s));
      if (pts.length > 1) linie(pts, z.n.startsWith('GZ') ? '#8e6e53' : '#3498db', 10);
      const k = punktBei(z.pfad, z.s);
      g.fillStyle = '#fff'; g.font = '700 10px system-ui'; g.textAlign = 'center';
      g.fillText(z.n + (z.zustand === 'steht' ? (z.halt > 0 ? ' ⏱' : ' ✓') : ''), Math.max(24, Math.min(696, k[0] - ZUGLAENGE / 2)), k[1] + (z.ziel === 3 && z.zustand !== 'wartet' ? 18 : -14));
    }
  };
  const zeigeInfo = () => {
    const z = wartend(), st = zuege.filter((x) => x.zustand === 'steht' && x.halt <= 0);
    info.innerHTML = '<b>' + fertig + ' / ' + o.zuege + ' Züge</b> · Fehler ' + fehler + ' · Verspätung ' + Math.round(versp) + ' s<br>' +
      (z ? '🚆 Vor Signal A wartet <b>' + z.n + '</b> → soll auf <b>Gleis ' + z.ziel + '</b>' + (z.warte > 15 ? ' <span class="neg">(verspätet!)</span>' : '') : erzeugt < o.zuege ? 'Nächster Zug kommt gleich …' : 'Alle Züge sind angekündigt.') +
      (st.length ? '<br>✓ Abfahrbereit: ' + st.map((x) => x.n + ' (Gleis ' + x.ziel + ' → Signal N' + x.ziel + ')').join(', ') : '');
  };
  let infoT = 0;
  const schleife = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (aktiv) takt(dt);
    zeichne();
    infoT -= dt; if (infoT <= 0) { zeigeInfo(); infoT = 0.25; }
    if (aktiv || zuege.length) raf = requestAnimationFrame(schleife);
  };
  melde('Weiche antippen = umstellen. Signal antippen = Fahrstraße einstellen. Gelb = verschlossen, grün = eingestellte Fahrstraße, rot = Gleis besetzt.', true);
  raf = requestAnimationFrame(schleife);
  return () => { aktiv = false; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', tippe); };
}
