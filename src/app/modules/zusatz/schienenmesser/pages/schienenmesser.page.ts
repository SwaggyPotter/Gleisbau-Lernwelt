import { AfterViewInit, Component, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';

/**
 * SKM1 · Schienenkopf-Verschleißmesser — 1:1-Übernahme von Tims Vorlage
 * skm1-verschleissmesser.html (2026-11-08, ersetzt die ältere Simulation).
 * Geometrie, Kalibrierung, Zieh-Logik und Auswertung sind wortgleich übernommen,
 * nur an die Komponente angebunden:
 *  - Element-Abfragen laufen über das Komponenten-Root (Ionic hält alte Seiten im DOM),
 *  - der Tastatur-Listener wird beim Verlassen der Seite entfernt.
 * Profilmaße (Höhe/Kopf/Fuß/Steg) 49E5 149/67/125/14, 54E4 159/70/140/16,
 * 60E2 172/72/150/16,5 mm; übrige Querschnittsmaße und Gerätebau sind vereinfacht.
 */

type P2 = number[];
interface Prof { H: number; B: number; F: number; w: number; te: number; hd: number; }
interface Pt { x: number; y: number; }
type Kind = 'rod' | 'probe' | 'steg' | 'carr';

function initSkm1(root: HTMLElement): () => void {
  const SQ = Math.SQRT1_2;
  const U = { x: SQ, y: -SQ };               // Vorschubrichtung 45°-Fühler (zur Schiene hin)
  const PROF: Record<string, Prof> = {
    '49E5': { H: 149, B: 67, F: 125, w: 14, te: 10.5, hd: 35 },
    '54E4': { H: 159, B: 70, F: 140, w: 16, te: 11, hd: 36 },
    '60E2': { H: 172, B: 72, F: 150, w: 16.5, te: 11.5, hd: 37.5 },
  };
  const ORDER = ['49E5', '54E4', '60E2'];
  const SMARK: Record<string, number> = { '49E5': -79, '54E4': -70, '60E2': -61 }; // Marken auf dem Steg-Messingschieber
  const MOFF: Record<string, number> = { '60E2': -6, '54E4': -14, '49E5': -22 };   // Marken auf dem Messingstreifen unter dem SKM1-Block
  const S_IDX = -30, T_MIN = -25, T_MAX = 22;       // 45°-Fühler
  const ROD_X = 0, ROD_IDX = 190, ROD_MAX = 186;    // Höhenmesslatte
  const STEG_Y = 70;

  const $ = <T extends Element = HTMLElement>(id: string): T => root.querySelector('#' + id) as unknown as T;
  const f1 = (v: number) => v.toFixed(1).replace('.', ',');
  const n2 = (v: number) => +v.toFixed(2);
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  /* ---------- Profilkonstruktion: Polygon mit ausgerundeten Ecken ---------- */
  function roundedPoly(V: P2[]): P2[] {
    const n = V.length, T: any[] = [];
    for (let i = 0; i < n; i++) {
      const P = V[i], A = V[(i - 1 + n) % n], C = V[(i + 1) % n];
      let ax = A[0] - P[0], ay = A[1] - P[1], cx = C[0] - P[0], cy = C[1] - P[1];
      const la = Math.hypot(ax, ay), lc = Math.hypot(cx, cy);
      ax /= la; ay /= la; cx /= lc; cy /= lc;
      const half = Math.acos(clamp(ax * cx + ay * cy, -1, 1)) / 2;
      T.push({ t: P[2] > 0 ? P[2] / Math.tan(half) : 0, ax, ay, cx, cy, half, lc });
    }
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, s = T[i].t + T[j].t, L = T[i].lc * 0.96;
      if (s > L) { const k = L / s; T[i].t *= k; T[j].t *= k; }
    }
    const out: P2[] = [];
    for (let i = 0; i < n; i++) {
      const P = V[i], q = T[i];
      if (q.t <= 1e-6) { out.push([P[0], P[1]]); continue; }
      const r = q.t * Math.tan(q.half);
      const t1 = [P[0] + q.ax * q.t, P[1] + q.ay * q.t], t2 = [P[0] + q.cx * q.t, P[1] + q.cy * q.t];
      let bx = q.ax + q.cx, by = q.ay + q.cy; const bl = Math.hypot(bx, by); bx /= bl; by /= bl;
      const d = r / Math.sin(q.half), c = [P[0] + bx * d, P[1] + by * d];
      const a1 = Math.atan2(t1[1] - c[1], t1[0] - c[0]);
      let da = Math.atan2(t2[1] - c[1], t2[0] - c[0]) - a1;
      while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const steps = Math.max(2, Math.ceil(Math.max(Math.abs(da) / (1.5 * Math.PI / 180), r * Math.abs(da) / 0.5)));
      for (let k = 0; k <= steps; k++) { const a = a1 + da * k / steps; out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
    }
    return out;
  }
  function profVerts(P: Prof, d: number): P2[] {
    const { H, B, F, w, te, hd } = P;
    const yfw = te + (F / 2 - w / 2) / 4;          // Fußoberseite Neigung 1:4
    const yhb = H - hd;                             // Unterkante Kopfseite
    const yhw = yhb - (B / 2 - w / 2) / 4;          // Kopfunterseite Neigung 1:4
    const R: P2[] = [[F / 2, 0, 2], [F / 2, te, 4], [w / 2, yfw, 22], [w / 2, yhw, 16], [B / 2, yhb, 4], [B / 2, H - 5, 13], [0, H + d, 300]];
    const L = R.slice(0, 6).reverse().map(([x, y, r]) => [-x, y, r]);
    return R.concat(L);
  }
  function buildProfile(p: string): P2[] {
    const P = PROF[p]; let d = 0, pts: P2[] = [];
    for (let k = 0; k < 5; k++) { pts = roundedPoly(profVerts(P, d)); let ym = -1e9; for (const q of pts) ym = Math.max(ym, q[1]); d += P.H - ym; }
    return pts;
  }
  function tangent45(pts: P2[]): Pt { let best: P2 = pts[0], bv = -1e9; for (const q of pts) { const v = -q[0] + q[1]; if (v > bv) { bv = v; best = q; } } return { x: best[0], y: best[1] }; }

  /* ---------- Geometrie-Helfer ---------- */
  function clipHalf(poly: P2[], a: number, b: number, c: number): P2[] { // behalte a*x+b*y <= c
    const out: P2[] = [], n = poly.length;
    for (let i = 0; i < n; i++) {
      const P = poly[i], Q = poly[(i + 1) % n], fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
      if (fp <= 0) out.push(P);
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const k = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); }
    }
    return out;
  }
  function chaikin(poly: P2[], it: number): P2[] {
    for (let k = 0; k < it; k++) {
      const o: P2[] = [], n = poly.length;
      for (let i = 0; i < n; i++) {
        const P = poly[i], Q = poly[(i + 1) % n];
        o.push([P[0] * .75 + Q[0] * .25, P[1] * .75 + Q[1] * .25], [P[0] * .25 + Q[0] * .75, P[1] * .25 + Q[1] * .75]);
      }
      poly = o;
    }
    return poly;
  }
  function rayHit(poly: P2[], ox: number, oy: number, dx: number, dy: number): number {
    let best = Infinity; const n = poly.length;
    for (let i = 0; i < n; i++) {
      const P = poly[i], Q = poly[(i + 1) % n], ex = Q[0] - P[0], ey = Q[1] - P[1];
      const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
      const wx = P[0] - ox, wy = P[1] - oy, t = (wx * ey - wy * ex) / den, s = (wx * dy - wy * dx) / den;
      if (t >= 0 && s >= 0 && s <= 1 && t < best) best = t;
    }
    return best;
  }
  function inside(poly: P2[], x: number, y: number): boolean {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
    }
    return c;
  }
  const pathOf = (pts: P2[]) => 'M' + pts.map(q => q[0].toFixed(2) + ',' + (-q[1]).toFixed(2)).join('L') + 'Z';

  /* ---------- Kalibrierung des Messers ---------- */
  const NEW: Record<string, P2[]> = {}, TP: Record<string, Pt> = {};
  for (const p of ORDER) { NEW[p] = buildProfile(p); TP[p] = tangent45(NEW[p]); }
  const Z = TP['60E2'];                                     // Nullpunkt 45°-Spitze (Messerkoordinaten)
  const CAL: Record<string, { dx: number; v: number; tip: number; b: number }> = {};
  for (const p of ORDER) {
    const dx = TP[p].x - Z.x, v = TP[p].y - Z.y;
    CAL[p] = { dx, v, tip: -PROF[p].w / 2 - dx, b: 0 };
  }
  for (const p of ORDER) CAL[p].b = CAL[p].tip - CAL['60E2'].tip;   // Schieberweg je Profil
  function tipDev(b: number) { return CAL['60E2'].tip + b; }       // Anschlagklotz sitzt fest am Schieberende

  /* ---------- Zustand ---------- */
  const S = {
    prof: '60E2', poly: [] as P2[], wear: { hv: 0, w45: 0, ws: 0 }, b: 25, v: 0, yt: ROD_MAX, t: -7, active: null as Kind | null,
    n: 0, ok: 0, tries: 0, checked: false, solved: false, view: 'all',
  };

  function newTask(): void {
    S.prof = ORDER[Math.floor(Math.random() * 3)];
    const P = PROF[S.prof], T = TP[S.prof];
    const hv = Math.random() < 0.15 ? Math.random() * 0.8 : 0.5 + Math.random() * 8.5;
    const w45 = Math.random() < 0.15 ? Math.random() * 0.8 : 0.5 + Math.random() * 13;
    const ws = Math.max(0, w45 * 0.55 - 1.5);
    let poly = NEW[S.prof];
    poly = clipHalf(poly, 0, 1, P.H - hv);
    if (w45 > 0.05) poly = clipHalf(poly, -SQ, SQ, (-T.x + T.y) * SQ - w45);
    if (ws > 0.05) { // Seitenverschleiß nur an der Kopfflanke, nach unten auslaufend
      const yhb = P.H - P.hd;
      poly = poly.map(q => { const lim = -P.B / 2 + ws * clamp((q[1] - yhb) / (P.hd * 0.5), 0, 1); return q[1] > yhb && q[0] < lim ? [lim, q[1]] : q; });
    }
    poly = chaikin(poly, 2);
    S.poly = poly; S.wear = { hv, w45, ws };
    // Messer bleibt auf irgendeinem Profil vom letzten Einsatz eingestellt
    const off = () => Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2.5);
    do { S.b = Math.random() < 0.4 ? CAL[ORDER[Math.floor(Math.random() * 3)]].b : -2.2 + Math.random() * 3.8; }
    while (ORDER.some(p => Math.abs(S.b - CAL[p].b) > 1e-9 && Math.abs(S.b - CAL[p].b) < 0.3));
    S.v = CAL[ORDER[Math.floor(Math.random() * 3)]].v + off();
    S.yt = ROD_MAX; S.t = -7; S.checked = false; S.solved = false; S.n++;
    $('profName').textContent = S.prof;
    $('taskNo').textContent = 'Messung ' + S.n;
    for (const id of ['inH', 'inHW', 'in45']) { const el = $<HTMLInputElement>(id); el.value = ''; el.className = ''; }
    $('fb').className = ''; $('sol').className = 'sol';
    buildRail(); clampAll(); update(); applyView();
  }

  /* ---------- Messphysik ---------- */
  function geom(st: { b: number; v: number } = S) {
    const dx = -PROF[S.prof].w / 2 - tipDev(st.b);
    const Zw = { x: Z.x + dx, y: Z.y + st.v };
    const rodX = ROD_X + dx;
    const rodC = 300 - rayHit(S.poly, rodX, 300, 0, -1);
    const O = { x: Zw.x + T_MIN * U.x, y: Zw.y + T_MIN * U.y };
    const tc = inside(S.poly, O.x, O.y) ? T_MIN : T_MIN + rayHit(S.poly, O.x, O.y, U.x, U.y);
    return { dx, Zw, rodX, rodC, tc };
  }
  function clampAll(): void {
    const g = geom();
    S.yt = clamp(S.yt, g.rodC, ROD_MAX);
    S.t = clamp(S.t, T_MIN, Math.min(T_MAX, g.tc));
  }
  function truth() {
    const c = CAL[S.prof], g = geom({ b: c.b, v: c.v });
    const h = g.rodC, r = Math.max(0, g.tc);
    return { h, hw: PROF[S.prof].H - h, r };
  }

  /* ---------- Zeichnen: statischer Teil ---------- */
  const ENG_B = '#2e2208', ENG_S = '#2b333b';
  function txt(x: number, y: number, s: string | number, o: any = {}): string {
    return `<text x="${x}" y="${y}" font-size="${o.fs || 3}" fill="${o.fill || ENG_S}" font-weight="${o.w || 600}"
  text-anchor="${o.a || 'start'}" font-family="Bahnschrift,'DIN Alternate','Arial Narrow',Arial,sans-serif"
  ${o.ls ? `letter-spacing="${o.ls}"` : ''} ${o.tr ? `transform="${o.tr}"` : ''}>${s}</text>`;
  }
  function screw(x: number, y: number, r = 1.8): string {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gSteel)" stroke="#5c6670" stroke-width=".3"/>
  <path d="M${x - r * .55},${y} h${r * 1.1} M${x},${y - r * .55} v${r * 1.1}" stroke="#4a545e" stroke-width=".35"/>`;
  }

  function buildStatic(): void {
    const I = { x: Z.x + S_IDX * U.x, y: Z.y + S_IDX * U.y };   // Indexpunkt 45°-Skala (Messkopf bei 60E2)
    const r2 = n2;
    const FRAME = 'M-22,0 L-22,9 Q-22,15 -28,15 L-110,15 C-138,15 -150,-8 -144,-38 L-130,-118 L-127,-214 Q-127,-224 -117,-224 L8,-224 Q14,-224 14,-218 L14,-208 Q14,-204 10,-204 L-98,-204 Q-104,-204 -104,-198 L-104,-36 C-104,-8 -92,0 -72,0 Z';
    const RECESS = 'M-135,-50 L-124,-118 L-121,-190 Q-121,-194 -117,-194 L-112,-194 Q-109,-194 -109,-190 L-109,-52 Q-109,-46 -115,-46 L-131,-46 Z';
    const RECESS2 = 'M-126,6 C-120,8 -104,9 -96,8 L-80,8 Q-76,8 -76,4 L-76,3 L-96,3 C-108,3 -112,-6 -114,-14 L-118,-26 Q-120,-32 -124,-28 Q-132,-14 -126,6 Z';

    /* --- Messkopf-Führung (fest am Rahmen) mit Profilgrenzen am Rand --- */
    const gx0 = I.x - 14, gx1 = I.x + 10;
    const sx0 = I.x - 12.5, sx1 = I.x - 3.5;
    const blkB = I.y - 10;
    let gMarks = '';
    for (const p of ORDER) {
      const y = r2(-(blkB + MOFF[p] + CAL[p].v));
      gMarks += `<path d="M${r2(sx1 + .4)},${y} h8.6 M${r2(sx1 + .6)},${y} v-3.4" stroke="${ENG_S}" stroke-width=".32" fill="none"/>` +
        txt(r2(sx1 + 1.6), r2(y - .8), p, { fs: 2.5, w: 700, fill: ENG_S });
    }
    const guide = `
    <path d="M${r2(gx0)},${r2(-205)} L${r2(gx1)},${r2(-205)} L${r2(gx1)},${r2(-(blkB - 76))} Q${r2(gx1)},${r2(-(blkB - 80))} ${r2(gx1 - 4)},${r2(-(blkB - 80))} L${r2(gx0 + 4)},${r2(-(blkB - 80))} Q${r2(gx0)},${r2(-(blkB - 80))} ${r2(gx0)},${r2(-(blkB - 76))} Z"
          fill="url(#gAlu)" stroke="#6b7680" stroke-width=".5"/>
    <rect x="${r2(sx0 - .6)}" y="-204" width="${r2(sx1 - sx0 + 1.2)}" height="${r2(204 - (blkB - 77))}" rx="1" fill="#4f5962" stroke="#3d464e" stroke-width=".3"/>
    ${gMarks}`;

    /* --- SKM1-Block + Messingstreifen (beweglich) --- */
    let sMarks = '';
    for (const p of ORDER) {
      const y = r2(-(blkB + MOFF[p]));
      sMarks += `<line x1="${r2(sx0)}" y1="${y}" x2="${r2(sx1)}" y2="${y}" stroke="${ENG_B}" stroke-width=".32"/>` +
        txt(r2((sx0 + sx1) / 2), r2(y - .8), p, { fs: 2.4, w: 700, fill: ENG_B, a: 'middle' });
    }
    const bx0 = I.x - 21, bx1 = I.x + 10, by0 = I.y - 10, by1 = I.y + 21;
    const carr = `
    <rect x="${r2(sx0)}" y="${r2(-blkB)}" width="${r2(sx1 - sx0)}" height="54" rx="1" fill="url(#gBrassH)" stroke="#6b5014" stroke-width=".35"/>
    <rect x="${r2(sx0 + .4)}" y="${r2(-blkB)}" width="1.3" height="54" fill="#fff" opacity=".22"/>
    <circle cx="${r2((sx0 + sx1) / 2)}" cy="${r2(-blkB + 50.5)}" r=".9" fill="#3b2c0c"/>
    ${sMarks}
    <rect x="${r2(bx0)}" y="${r2(-by1)}" width="${r2(bx1 - bx0)}" height="${r2(by1 - by0)}" rx="1.6" fill="url(#gPlate)" stroke="#7a858f" stroke-width=".5"/>
    <rect x="${r2(bx0)}" y="${r2(-by1)}" width="${r2(bx1 - bx0)}" height="${r2(by1 - by0)}" rx="1.6" fill="#000" filter="url(#fCast)" opacity=".1"/>
    ${txt(r2(bx1 - 1.8), r2(-by1 + 8.2), 'SKM1', { fs: 5.4, w: 500, a: 'end', ls: .3, fill: '#3b4650' })}
    ${screw(r2(bx1 - 5), r2(-by1 + 12.5), 1.5)} ${screw(r2(bx0 + 5.5), r2(-by0 - 5), 1.5)}
    <rect class="hit" fill="transparent" x="${r2(bx0)}" y="${r2(-by1)}" width="${r2(bx1 - bx0)}" height="${r2(by1 - by0 + 56)}"/>
    <rect class="hl" fill="none" stroke="none" x="${r2(bx0 - 1)}" y="${r2(-by1 - 1)}" width="${r2(bx1 - bx0 + 2)}" height="${r2(by1 - by0 + 56)}" rx="2"/>`;

    /* --- Stegfühler: Messingschieber läuft in der Nut des Halters, Anschlagklotz am Schieberende --- */
    const HX0 = -106, HX1 = -30, HY0 = 54, HY1 = 86, SL0 = 65.6, SL1 = 74.4;
    const BAR_R = CAL['60E2'].tip - 11;
    let barMarks = '', houseMarks = '';
    for (const p of ORDER) {
      const xb = SMARK[p];
      barMarks += `<line x1="${xb}" y1="${-SL0 - .8}" x2="${xb}" y2="${-SL0 - 4.4}" stroke="${ENG_B}" stroke-width=".3"/>` +
        txt(xb, -SL0 - 4.9, p, { fs: 2.4, w: 600, fill: ENG_B, a: 'middle' });
      const xh = n2(SMARK[p] + CAL[p].b);
      houseMarks += `<line x1="${xh}" y1="${-SL0 + .3}" x2="${xh}" y2="${-SL0 + 3.8}" stroke="${ENG_S}" stroke-width=".3"/>` +
        txt(xh, -SL0 + 6.8, p, { fs: 2.4, w: 600, fill: ENG_S, a: 'middle' });
    }

    let rodTicks = '';
    for (let v = 130; v <= 180; v++) {
      const y = -(ROD_IDX - v), L = v % 10 === 0 ? 5 : v % 5 === 0 ? 3.4 : 2.1;
      rodTicks += `<line x1="-5.5" y1="${y}" x2="${n2(-5.5 + L)}" y2="${y}" stroke="${ENG_B}" stroke-width="${v % 5 === 0 ? .32 : .24}"/>`;
      if (v % 10 === 0) rodTicks += txt(5, y + 1, v, { fs: 2.8, fill: ENG_B, a: 'end', w: 700 });
    }
    let prTicks = '';
    for (let r = 0; r <= 20; r++) {
      const x = S_IDX - r, L = r % 5 === 0 ? (r % 10 === 0 ? 3.6 : 2.8) : 1.7;
      prTicks += `<line x1="${x}" y1="3.8" x2="${x}" y2="${n2(3.8 - L)}" stroke="${ENG_B}" stroke-width="${r % 5 === 0 ? .3 : .22}"/>`;
      if (r % 5 === 0) prTicks += txt(x, -0.9, r, { fs: 2.5, fill: ENG_B, a: 'middle', w: 700 });
    }

    $('skmScene').innerHTML = `
  <g id="gRail"></g>

  <g id="gFrame" filter="url(#fShadow)">
    <path d="${FRAME}" fill="url(#gAlu)" stroke="#6b7680" stroke-width=".6"/>
    <path d="${FRAME}" fill="#000" filter="url(#fCast)" opacity=".28"/>
    <path d="${RECESS}" fill="url(#gAluDark)" stroke="#5d6871" stroke-width=".45"/>
    <path d="${RECESS}" fill="#000" filter="url(#fCast)" opacity=".25"/>
    <path d="${RECESS2}" fill="url(#gAluDark)" stroke="#5d6871" stroke-width=".45" opacity=".9"/>
    <rect x="-72" y="-1.6" width="50" height="1.6" fill="#59636c"/>
    ${txt(-62, 9.5, 'MAGNET', { fs: 2.6, fill: '#4b555e', w: 700, ls: .6 })}
    ${guide}
    <rect x="${HX0}" y="${-HY1}" width="${HX1 - HX0}" height="${HY1 - HY0}" rx="4" fill="url(#gSteel)" stroke="#66717b" stroke-width=".45"/>
    <rect x="${HX0 + 2}" y="${-HY1 + .6}" width="${HX1 - HX0 - 4}" height="1.8" rx=".9" fill="#fff" opacity=".25"/>
    <rect x="${HX0}" y="${-SL1}" width="${HX1 - HX0}" height="${SL1 - SL0}" fill="#59636c"/>
    <rect x="${HX0}" y="${-SL1}" width="${HX1 - HX0}" height=".9" fill="#000" opacity=".35"/>
    ${houseMarks}
    ${screw(HX0 + 6, -(HY1 - 5.5), 1.4)} ${screw(HX0 + 6, -(HY0 + 5.5), 1.4)}
    <g id="gSteg" class="drag" data-k="steg">
      <rect class="hit" fill="transparent" x="-102" y="${-SL1 - 1}" width="${n2(BAR_R + 104)}" height="${SL1 - SL0 + 2}"/>
      <rect x="-102" y="${-SL1 + .5}" width="${n2(BAR_R + 102)}" height="${SL1 - SL0 - 1}" rx=".5" fill="url(#gBrassV)" stroke="#6b5014" stroke-width=".3"/>
      <rect x="-102" y="${-SL1 + .6}" width="${n2(BAR_R + 102)}" height="1.2" fill="#fff" opacity=".25"/>
      <circle cx="-98.5" cy="${-(SL0 + SL1) / 2}" r=".9" fill="#3b2c0c"/>
      ${barMarks}
      <rect class="hl" fill="none" stroke="none" x="-102.5" y="${-SL1}" width="${n2(BAR_R + 103)}" height="${SL1 - SL0}"/>
    </g>
    <rect x="-11" y="-207" width="22" height="26" rx="2" fill="url(#gSteel)" stroke="#66717b" stroke-width=".45"/>
    <line x1="-11" y1="-190" x2="-5.5" y2="-190" stroke="${ENG_S}" stroke-width=".4"/>
    <line x1="5.5" y1="-190" x2="11" y2="-190" stroke="${ENG_S}" stroke-width=".4"/>
    <path d="M-5.6,-190 l-2.2,-1.3 v2.6 Z" fill="#f0872f"/>
    ${screw(8, -201, 1.4)}
    ${screw(-112, -212)} ${screw(-80, -214)}
  </g>

  <g id="gBlock" class="drag" data-k="steg" filter="url(#fShadow)">
    <path d="M-12,-9 L-4.5,-9 L-4.5,-6.5 L0,-6.5 L0,6.5 L-12,6.5 Z" fill="url(#gSteel)" stroke="#5d6871" stroke-width=".45"/>
    <path d="M-4.5,-9 L-4.5,-6.5 L0,-6.5" fill="none" stroke="#5d6871" stroke-width=".45"/>
    <path d="M-11.4,-8.4 L-5.1,-8.4" stroke="#fff" stroke-width=".6" opacity=".55"/>
    <line x1="0" y1="-6.2" x2="0" y2="6.2" stroke="#eef2f5" stroke-width=".5" opacity=".7"/>
  </g>

  <g id="gRod" class="drag" data-k="rod" filter="url(#fShadow)">
    <rect class="hit" fill="transparent" x="-10" y="-88" width="20" height="92"/>
    <path d="M0,0 L-1.3,-5 L1.3,-5 Z" fill="url(#gSteelDark)"/>
    <rect x="-2.6" y="-8.6" width="5.2" height="3.8" rx=".6" fill="url(#gSteel)" stroke="#4d5964" stroke-width=".3"/>
    <rect x="-5.5" y="-84" width="11" height="75.6" rx="1.2" fill="url(#gBrassH)" stroke="#6b5014" stroke-width=".35"/>
    <rect x="-5.1" y="-84" width="1.5" height="75.6" fill="#fff" opacity=".2"/>
    ${rodTicks}
    <circle cx="0" cy="-80.4" r="1.1" fill="#3b2c0c"/>
    <rect class="hl" fill="none" stroke="none" x="-6.6" y="-85" width="13.2" height="86" rx="2"/>
  </g>

  <g id="gCarr" class="drag" data-k="carr" filter="url(#fShadow)">${carr}</g>

  <g id="gGuide">
    <line x1="${S_IDX}" y1="3.9" x2="${S_IDX}" y2="10" stroke="${ENG_S}" stroke-width=".42"/>
    <path d="M${S_IDX},4.1 l-1.25,2.3 h2.5 Z" fill="#f0872f"/>
  </g>

  <g id="gProbe" class="drag" data-k="probe" filter="url(#fShadow)">
    <rect class="hit" fill="transparent" x="-82" y="-8" width="86" height="16"/>
    <path d="M0,0 L-6.6,-1.4 L-6.6,1.4 Z" fill="url(#gSteelDark)"/>
    <path d="M-10.6,-2.9 h4 l.6,1.2 v3.4 l-.6,1.2 h-4 Z" fill="url(#gSteel)" stroke="#4d5964" stroke-width=".3"/>
    <rect x="-78" y="-3.8" width="67.4" height="7.6" rx="1" fill="url(#gBrassV)" stroke="#6b5014" stroke-width=".35"/>
    <rect x="-78" y="-3.4" width="67.4" height="1.2" fill="#fff" opacity=".22"/>
    ${prTicks}
    <circle cx="-74.5" cy="0" r="1.1" fill="#3b2c0c"/>
    <rect class="hl" fill="none" stroke="none" x="-79" y="-5" width="80.5" height="10" rx="2"/>
  </g>

  <g id="gKnob">
    <circle cx="-56.5" cy="0" r="3.3" fill="url(#gSteel)" stroke="#59646e" stroke-width=".4"/>
    <circle cx="-56.5" cy="0" r="3.3" fill="none" stroke="#6f7a84" stroke-width=".9" stroke-dasharray=".5 .55"/>
    <circle cx="-56.5" cy="0" r="1" fill="#8f9aa4"/>
  </g>`;
  }

  /* ---------- Zeichnen: Schiene ---------- */
  function buildRail(): void {
    const P = PROF[S.prof], T = TP[S.prof], w = S.wear, poly = S.poly;
    let ytop = -1e9; for (const q of poly) ytop = Math.max(ytop, q[1]);
    const c45 = (-T.x + T.y) * SQ - w.w45, yhb = P.H - P.hd, xs = (y: number) => -P.B / 2 + w.ws * clamp((y - yhb) / (P.hd * 0.5), 0, 1);
    const pol = (q: P2) => (q[1] >= ytop - 1.1 && Math.abs(q[0]) < P.B / 2 - 5) ||
      (w.w45 > 0.2 && (-q[0] + q[1]) * SQ >= c45 - 0.4 && q[1] > yhb) ||
      (w.ws > 0.2 && q[0] <= xs(q[1]) + 0.3 && q[1] > yhb + P.hd * 0.3);
    let shine = '', run: P2[] = [];
    const flush = () => { if (run.length > 1) shine += 'M' + run.map(q => q[0].toFixed(2) + ',' + (-q[1]).toFixed(2)).join('L'); run = []; };
    for (const q of poly) { if (pol(q)) run.push(q); else flush(); } flush();
    const d = pathOf(poly);
    const sollAn = $<HTMLInputElement>('tSoll').checked || S.solved;
    $('gRail').innerHTML = `
    <g filter="url(#fShadow)"><path d="${d}" fill="url(#gRust)"/></g>
    <path d="${d}" fill="#000" filter="url(#fGrainRust)" opacity=".3"/>
    <path d="${d}" fill="#000" filter="url(#fGrainDark)" opacity=".22"/>
    <path d="${d}" fill="none" stroke="#2b160a" stroke-width=".55"/>
    <path d="${d}" fill="none" stroke="#c98a5a" stroke-width=".35" opacity=".18" transform="translate(.35,.35)"/>
    <path d="${shine}" fill="none" stroke="#e2e8ec" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${shine}" fill="none" stroke="#ffffff" stroke-width=".5" stroke-linecap="round" opacity=".8"/>
    <path id="soll" d="${pathOf(NEW[S.prof])}" fill="none" stroke="#6ec1ff" stroke-width=".45" stroke-dasharray="1.6 1.2" opacity=".9"
          style="display:${sollAn ? 'inline' : 'none'}"/>`;
  }

  /* ---------- Zeichnen: bewegliche Teile ---------- */
  function update(): void {
    const g = geom(), dx = g.dx;
    const tw = { x: g.Zw.x + S.t * U.x, y: g.Zw.y + S.t * U.y };
    $('gFrame').setAttribute('transform', `translate(${n2(dx)},0)`);
    $('gSteg').setAttribute('transform', `translate(${n2(S.b)},0)`);
    $('gBlock').setAttribute('transform', `translate(${n2(dx + tipDev(S.b))},${-STEG_Y})`);
    $('gRod').setAttribute('transform', `translate(${n2(g.rodX)},${n2(-S.yt)})`);
    $('gCarr').setAttribute('transform', `translate(${n2(dx)},${n2(-S.v)})`);
    $('gGuide').setAttribute('transform', `translate(${n2(g.Zw.x)},${n2(-g.Zw.y)}) rotate(45)`);
    $('gKnob').setAttribute('transform', `translate(${n2(g.Zw.x)},${n2(-g.Zw.y)}) rotate(45)`);
    $('gProbe').setAttribute('transform', `translate(${n2(tw.x)},${n2(-tw.y)}) rotate(45)`);
    for (const id of ['gSteg', 'gRod', 'gCarr', 'gProbe']) { const el = $(id); el.classList.toggle('active', S.active === el.dataset['k']); }

    // Lupen
    const L = 22;
    const rc = { x: g.rodX - 1.5, y: ROD_IDX + 1 };
    $('lpRod').setAttribute('viewBox', `${n2(rc.x - L / 2)} ${n2(-rc.y - L / 2)} ${L} ${L}`);
    const pc = { x: g.Zw.x + (S_IDX - 6) * U.x, y: g.Zw.y + (S_IDX - 6) * U.y };
    $('lpProbe').setAttribute('viewBox', `${n2(pc.x - L / 2)} ${n2(-pc.y - L / 2)} ${L} ${L}`);
    $('lpSteg').setAttribute('viewBox', `${n2(dx - 70 - 15)} ${n2(-70 - 15)} 30 30`);

    if ($<HTMLInputElement>('tTeach').checked) {
      $('live').innerHTML = `Höhe: ${f1(S.yt)} mm${S.yt - g.rodC < 0.15 ? ' (sitzt auf)' : ''}<br>45°: ${f1(S.t)} mm${g.tc - S.t < 0.15 ? ' (liegt an)' : ''}` +
        `<br>Steg: ${Math.abs(S.b - CAL[S.prof].b) <= 0.08 ? '✓' : '✗'} · Messkopf: ${Math.abs(S.v - CAL[S.prof].v) <= 0.2 ? '✓' : '✗'}`;
    }
  }

  /* ---------- Ziehen ---------- */
  const svg = $<SVGSVGElement>('skmMain');
  function worldPt(e: PointerEvent): Pt {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: -p.y };
  }
  const proj = (p: Pt) => p.x * U.x + p.y * U.y;
  let drag: { k: Kind; off: number } | null = null;
  function valOf(k: Kind, p: Pt) { return k === 'rod' ? p.y : k === 'probe' ? proj(p) : k === 'steg' ? p.x : p.y; }
  function setVal(k: Kind, v: number): void {
    const vmin = CAL['49E5'].v - 8, vmax = CAL['60E2'].v + 8;
    if (k === 'rod') S.yt = clamp(v, 0, ROD_MAX);
    if (k === 'probe') S.t = clamp(v, T_MIN, T_MAX);
    if (k === 'steg') S.b = clamp(v, -2.5, 2);
    if (k === 'carr') S.v = clamp(v, vmin, vmax);
    clampAll(); update();
  }
  const cur = (k: Kind) => k === 'rod' ? S.yt : k === 'probe' ? S.t : k === 'steg' ? S.b : S.v;
  svg.addEventListener('pointerdown', (e: PointerEvent) => {
    const g = (e.target as Element).closest('.drag') as HTMLElement | null;
    if (!g) { S.active = null; update(); return; }
    const k = g.dataset['k'] as Kind, p = worldPt(e);
    S.active = k; drag = { k, off: valOf(k, p) - cur(k) };
    svg.setPointerCapture(e.pointerId); e.preventDefault(); update();
  });
  svg.addEventListener('pointermove', (e: PointerEvent) => { if (!drag) return; const p = worldPt(e); setVal(drag.k, valOf(drag.k, p) - drag.off); });
  function snap(k: Kind): void { // Rastung: nahe an einer Profilmarke rastet der Schieber ein
    for (const p of ORDER) {
      if (k === 'steg' && Math.abs(S.b - CAL[p].b) < 0.18) { setVal('steg', CAL[p].b); return; }
      if (k === 'carr' && Math.abs(S.v - CAL[p].v) < 0.6) { setVal('carr', CAL[p].v); return; }
    }
  }
  const end = () => { if (drag) snap(drag.k); drag = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  const onKey = (e: KeyboardEvent) => {
    if (!S.active || !root.isConnected || /INPUT|TEXTAREA/.test(document.activeElement?.tagName ?? '')) return;
    const st = e.shiftKey ? 1 : 0.1, k = S.active;
    const dirs = ({ ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] } as Record<string, number[]>)[e.key];
    if (!dirs) return; e.preventDefault();
    let d = 0;
    if (k === 'rod' || k === 'carr') d = dirs[1];
    if (k === 'steg') d = dirs[0];
    if (k === 'probe') d = (dirs[0] || -dirs[1]);
    setVal(k, cur(k) + d * st);
  };
  document.addEventListener('keydown', onKey);

  /* ---------- Auswertung ---------- */
  const num = (id: string) => { const s = $<HTMLInputElement>(id).value.trim().replace(',', '.'); return s === '' ? NaN : parseFloat(s); };
  function check(): void {
    const tr = truth(), g = geom(), c = CAL[S.prof], P = PROF[S.prof];
    const h = num('inH'), hw = num('inHW'), r = num('in45');
    const okH = Math.abs(h - tr.h) <= 0.5, okHW = Math.abs(hw - tr.hw) <= 0.5, okR = Math.abs(r - tr.r) <= 0.5;
    const stegOk = Math.abs(S.b - c.b) <= 0.08, carrOk = Math.abs(S.v - c.v) <= 0.2;
    const rodOn = S.yt - g.rodC < 0.15, prOn = g.tc - S.t < 0.15;
    $('inH').className = isNaN(h) ? '' : okH ? 'ok' : 'bad';
    $('inHW').className = isNaN(hw) ? '' : okHW ? 'ok' : 'bad';
    $('in45').className = isNaN(r) ? '' : okR ? 'ok' : 'bad';
    const li: string[][] = [];
    li.push(stegOk ? ['ok', 'Stegfühler steht auf ' + S.prof + '.'] : ['bad', 'Stegfühler steht nicht auf ' + S.prof + ' – der Messer sitzt seitlich versetzt, die Messwerte verfälschen sich.']);
    li.push(carrOk ? ['ok', 'Messkopf ist auf ' + S.prof + ' eingestellt.'] : ['bad', 'Messkopf steht nicht auf der Marke ' + S.prof + ' – der 45°-Fühler trifft die Fahrkante an der falschen Stelle.']);
    if (!rodOn) li.push(['bad', 'Die Höhenmesslatte sitzt nicht auf dem Schienenkopf auf.']);
    if (!prOn) li.push(['bad', 'Die Spitze des 45°-Fühlers liegt nicht an der Fahrkante an.']);
    if (isNaN(h)) li.push(['info', 'Schienenhöhe fehlt.']);
    else if (okH) li.push(['ok', 'Schienenhöhe richtig abgelesen.']);
    else li.push(['bad', stegOk && carrOk && rodOn ? 'Schienenhöhe falsch abgelesen – in der Lupe genau prüfen, welcher Strich am Index steht.' : 'Schienenhöhe stimmt nicht – erst den Aufbau korrigieren.']);
    if (isNaN(hw)) li.push(['info', 'Höhenverschleiß fehlt.']);
    else if (okHW) li.push(['ok', 'Höhenverschleiß richtig berechnet.']);
    else li.push(['bad', !isNaN(h) && Math.abs((P.H - h) - hw) > 0.2 ? `Rechnung prüfen: Sollhöhe ${S.prof} = ${P.H} mm minus deinem Messwert.` : 'Höhenverschleiß stimmt nicht (Folgefehler aus der Höhe).']);
    if (isNaN(r)) li.push(['info', '45°-Verschleiß fehlt.']);
    else if (okR) li.push(['ok', '45°-Verschleiß richtig abgelesen.']);
    else li.push(['bad', stegOk && carrOk && prOn ? '45°-Wert falsch abgelesen – Teilung läuft von der Spitze weg: 0 vorne, 20 hinten.' : '45°-Wert stimmt nicht – erst den Aufbau korrigieren.']);
    $('fb').querySelector('ul')!.innerHTML = li.map(([c2, t]) => `<li class="${c2}">${t}</li>`).join('');
    $('fb').className = 'show';
    const all = okH && okHW && okR;
    if (!S.checked && !S.solved) { S.tries++; if (all) S.ok++; S.checked = true; ProfilSyncService.lokalZaehlen('zusatz:schienenmesser', all); }
    $('score').textContent = `${S.ok} / ${S.tries} richtig`;
  }
  function solve(): void {
    const c = CAL[S.prof], tr = truth();
    S.b = c.b; S.v = c.v; S.yt = 0; S.t = T_MAX; clampAll();
    S.solved = true; S.active = null;
    $('soll').style.display = 'inline';
    $('sol').innerHTML = `<div><span>Schienenhöhe</span><b>${f1(tr.h)} mm</b></div>
    <div><span>Höhenverschleiß</span><b>${f1(tr.hw)} mm</b></div>
    <div><span>Verschleiß 45°</span><b>${f1(tr.r)} mm</b></div>
    <div style="margin-top:6px;color:#8aa0b4;font-family:system-ui;font-size:12px;display:block">Messer ist jetzt richtig eingestellt und angelegt – vergleiche die Lupen. Blau gestrichelt: Sollprofil ${S.prof}.</div>`;
    $('sol').className = 'sol show';
    update();
  }

  /* ---------- UI ---------- */
  $('bCheck').onclick = check;
  $('bSol').onclick = solve;
  $('bNew').onclick = newTask;
  $('tSoll').onchange = () => { $('soll').style.display = ($<HTMLInputElement>('tSoll').checked || S.solved) ? 'inline' : 'none'; };
  $('tTeach').onchange = () => { $('live').className = $<HTMLInputElement>('tTeach').checked ? 'show' : ''; update(); };
  function applyView(): void {
    if (S.view === 'all') { svg.setAttribute('viewBox', '-162 -282 258 308'); return; }
    const yb = PROF[S.prof].H - 38, yt = 272;
    svg.setAttribute('viewBox', `-140 ${-yt} 190 ${yt - yb}`);
  }
  $('viewSeg').addEventListener('click', (e: Event) => {
    const b = (e.target as Element).closest('button') as HTMLElement | null; if (!b) return;
    for (const x of Array.from($('viewSeg').children)) x.classList.toggle('on', x === b);
    S.view = b.dataset['v'] ?? 'all'; applyView();
  });

  buildStatic();
  newTask();

  return () => document.removeEventListener('keydown', onKey);
}

@Component({
  selector: 'app-schienenmesser',
  templateUrl: './schienenmesser.page.html',
  styleUrls: ['./schienenmesser.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SchienenmesserPage implements AfterViewInit, OnDestroy {
  private cleanup: (() => void) | null = null;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.cleanup = initSkm1(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.cleanup) this.cleanup();
  }
}
