import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';

/**
 * 1:1-Uebernahme der von Tim gelieferten Referenz-Simulation
 * (schienenkopf-verschleissmesser.html). Die gesamte Geraete-Physik
 * (Geometrie, Zieh-Interaktion, SVG-Aufbau) ist bewusst NICHT in
 * Angular-Bindings uebersetzt, sondern als eigenstaendige Funktion
 * `initSchienenmesser()` fast wortgleich uebernommen und nur an die
 * Komponenten-Lebensdauer angebunden (siehe Klasse unten):
 *  - `document.getElementById` -> auf das Komponenten-Root-Element
 *    beschraenkte Abfrage (Ionic haelt vorherige Seiten ausgeblendet im
 *    DOM, ein globales getElementById koennte sonst ein Element einer
 *    frueher besuchten, toten Seiteninstanz treffen).
 *  - `window.addEventListener('keydown', ...)` wird beim Verlassen der
 *    Seite wieder entfernt (sonst Speicher-/Verhaltensleck über die
 *    Seite hinaus).
 * Alle Zahlenwerte, Formeln und die Reihenfolge der Berechnungen sind
 * unveraendert aus der Vorlage uebernommen.
 *
 * ACHTUNG — Datenlage: Belegt sind die Gesamthoehen (49E5 = 149 mm,
 * 54E4 = 154 mm, 60E2 = 172 mm) sowie die Messtiefe von 14 mm unter
 * Schienenoberkante fuer den Seitenverschleiss. Die uebrigen Masse
 * (Kopf-/Fuss-/Steg-Halbmasse der Profilgeometrie) dienen nur dem
 * massstaeblichen Zeichnen und sind vereinfacht.
 */

type ProfileKey = '49E5' | '54E4' | '60E2';

interface ProfileGeom {
  H: number;
  hh: number;
  fh: number;
  wh: number;
  headH: number;
  name: string;
}

const PR: Record<ProfileKey, ProfileGeom> = {
  '49E5': { H: 149, hh: 33.5, fh: 62.5, wh: 7.0, headH: 42.0, name: '49E5 (S49)' },
  '54E4': { H: 154, hh: 33.5, fh: 62.5, wh: 8.0, headH: 45.0, name: '54E4 (S54)' },
  '60E2': { H: 172, hh: 36.0, fh: 75.0, wh: 8.25, headH: 47.5, name: '60E2 (UIC60)' },
};
const KEYS: ProfileKey[] = ['49E5', '54E4', '60E2'];

interface Geom {
  R0: number;
  TH0: number;
  ARM_MIN: number;
  ARM_MAX: number;
  ROD_X: number;
  ROD_MIN: number;
  ROD_BAR: number;
  ROD_SLEEVE_TOP: number;
  ROD_SLEEVE_BOT: number;
  STEG_TIP_Y: number;
  BASE_PROBE_Y: number;
  BASE_ZERO_X: number;
  PY: number;
  DIRX: number;
  DIRY: number;
}

type SelKind = 'rod' | 'latte' | 'steg' | 'arm';

interface SkmState {
  actual: ProfileKey;
  hwear: number;
  swear: number;
  setSteg: ProfileKey;
  setLatte: ProfileKey;
  rodTip: number;
  armReach: number;
  showNom: boolean;
  blind: boolean;
  revealed: boolean;
  sel: SelKind | null;
}

interface DragInfo {
  kind: SelKind;
  off: number;
}

interface TxtOpts {
  fill?: string;
  fs?: number;
  ls?: number;
  a?: string;
  w?: number;
}

/**
 * Baut die komplette interaktive Simulation innerhalb von `root` auf und
 * gibt eine Aufraeum-Funktion zurueck (entfernt den globalen
 * Keydown-Listener). Wird pro Seitenbesuch neu aufgerufen — alle
 * "Modul-Level"-Werte der Vorlage sind deshalb bewusst lokale Variablen
 * dieser Funktion statt echter Modul-Konstanten, damit zwei Besuche
 * derselben Seite sich nicht gegenseitig beeinflussen.
 */
function initSchienenmesser(root: HTMLElement): () => void {
  // ------------------------------------------------------------------
  // 2 · GERAETEGEOMETRIE
  // Lokales Koordinatensystem des Geraets: Nullpunkt = Auflagekante am
  // Schienenfuss (Fussaussenkante / Fussunterseite). x nach rechts,
  // y nach unten. Das Geraet wird mit translate(-fh, H) in die
  // Schienenkoordinaten gesetzt.
  // ------------------------------------------------------------------
  const G: Geom = {
    R0: 62, // Achsabstand Pivot -> Nullstellung (fester Fuehlerarm-Winkel)
    TH0: 43, // fester Winkel des Fuehlerarms [Grad, von der Senkrechten] — aendert sich NICHT
    ARM_MIN: 26, // kuerzeste Ausfahrt (zurueckgezogen)
    ARM_MAX: 96, // laengste Ausfahrt
    ROD_X: 66, // Achse der Hoehenmesslatte (lokal, Geraetekoordinaten)
    ROD_MIN: -178, // ganz zurueckgezogen (Fuehlerspitze)
    ROD_BAR: 58, // gezeichnete Laenge des Messingstabs
    ROD_SLEEVE_TOP: -222, // feste Fuehrungshuelse, in der die Latte gleitet
    ROD_SLEEVE_BOT: -190,
    STEG_TIP_Y: -79, // Hoehe, auf der der Steg-Fuehler antastet (Referenz 60E2)
    BASE_PROBE_Y: -158, // Antastlinie bei Einstellung 60E2 = -(172-14), echte Messtiefe
    BASE_ZERO_X: 39, // Nullpunkt Seitenskala bei 60E2 = fh-hh
    PY: 0,
    DIRX: 0,
    DIRY: 0,
  };
  G.PY = G.BASE_PROBE_Y - G.R0 * Math.cos((G.TH0 * Math.PI) / 180); // Pivot y (lokal) — gilt fuer jedes Profil
  G.DIRX = Math.sin((G.TH0 * Math.PI) / 180); // feste Fuehlerrichtung (Einheitsvektor)
  G.DIRY = Math.cos((G.TH0 * Math.PI) / 180);

  /**
   * Pivot-X haengt von der physisch wirklich anliegenden Schiene ab (der
   * Haken haengt am echten Fuss — unterschiedliche Fussbreiten
   * verschieben die Lage automatisch), NICHT von einer Kalibrierwahl.
   * Dadurch trifft der Fuehler bei korrektem Winkel/Weg fuer JEDES
   * Profil exakt auf die Fahrkante bei 14 mm unter SOK — unabhaengig
   * davon, was an Steg/Kopf eingestellt ist.
   */
  function pivotPX(profileKey: ProfileKey): number {
    const p = PR[profileKey];
    return p.fh - p.hh - G.R0 * G.DIRX;
  }

  // Rastpositionen der beiden Einstellbalken
  const LATTE_DY: Record<ProfileKey, number> = { '60E2': 0, '54E4': 18, '49E5': 23 }; // = 172 - H
  const STEG_DX: Record<ProfileKey, number> = { '60E2': 0, '54E4': -14, '49E5': -28 }; // gleichmaessig gerastet
  const carrierDy = (k: ProfileKey): number => LATTE_DY[k];

  // ------------------------------------------------------------------
  // 3 · ZUSTAND
  // ------------------------------------------------------------------
  const state: SkmState = {
    actual: '60E2',
    hwear: 0,
    swear: 0,
    setSteg: '60E2',
    setLatte: '60E2',
    rodTip: G.ROD_MIN, // lokale y der Fuehlerspitze (Hoehe)
    armReach: G.ARM_MIN, // Ausfahrlaenge des Seitenfuehlers (fester Winkel!)
    showNom: true,
    blind: false,
    revealed: false,
    sel: null, // zuletzt angefasstes Bauteil (Tastatur)
  };

  // ------------------------------------------------------------------
  // 4 · PROFIL-GEOMETRIE
  // ------------------------------------------------------------------
  function halfProfile(p: ProfileGeom): Array<[number, number]> {
    // rechte Haelfte, oben -> unten
    const { H, hh, fh, wh, headH } = p;
    return [
      [0, 0], [hh * 0.45, 1.2], [hh * 0.75, 3.5], [hh * 0.92, 7], [hh, 14], [hh, 30],
      [hh * 0.95, headH - 9], [hh * 0.6, headH - 2],
      [wh + 4.5, headH + 6], [wh, headH + 18],
      [wh, H - 52], [wh + 5, H - 40],
      [fh * 0.32, H - 27], [fh * 0.68, H - 19],
      [fh, H - 11], [fh, H - 4], [fh * 0.82, H], [0, H],
    ];
  }
  const f2 = (n: number): number => Math.round(n * 100) / 100;
  function xAtY(pts: Array<[number, number]>, y: number): number {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      if (y >= y1 && y <= y2) {
        const t = y2 - y1 ? (y - y1) / (y2 - y1) : 0;
        return x1 + (x2 - x1) * t;
      }
    }
    return pts[pts.length - 1][0];
  }
  const wearDepth = (y: number): number => (y <= 30 ? 1 : Math.max(0, 1 - (y - 30) / 9)); // Tiefenverlauf
  const wearLat = (x: number, hh: number): number => Math.min(1, Math.max(0, (x - hh * 0.55) / (hh * 0.25))); // seitl. Auslauf

  function pathFrom(pts: Array<[number, number]>): string {
    const r = pts.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' L ');
    const l = [...pts].reverse().map(([x, y]) => `${f2(-x)},${f2(y)}`).join(' L ');
    return `M ${r} L ${l} Z`;
  }
  function nomPath(p: ProfileGeom): string {
    return pathFrom(halfProfile(p));
  }
  function wornPath(p: ProfileGeom): string {
    const h = halfProfile(p);
    const right: Array<[number, number]> = h.map(([x, y]) => [x, Math.max(y, state.hwear)]);
    const left: Array<[number, number]> = h.map(([x, y]) => {
      const ny = Math.max(y, state.hwear);
      return [-x + state.swear * wearDepth(ny) * wearLat(x, p.hh), ny];
    });
    const r = right.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' L ');
    const l = [...left].reverse().map(([x, y]) => `${f2(x)},${f2(y)}`).join(' L ');
    return `M ${r} L ${l} Z`;
  }
  /** x der Fahrkante (Geraeteseite, negativ) auf Hoehe y — null = ueber der Fahrflaeche */
  function flankX(y: number): number | null {
    if (y < state.hwear) return null;
    const p = PR[state.actual];
    const nx = xAtY(halfProfile(p), y);
    return -nx + state.swear * wearDepth(y) * wearLat(nx, p.hh);
  }

  // ------------------------------------------------------------------
  // 5 · KINEMATIK & ABLESUNGEN
  // ------------------------------------------------------------------
  const A = (): ProfileGeom => PR[state.actual];
  const gOrigin = (): [number, number] => [-A().fh, A().H]; // Geraeteursprung in Schienenkoordinaten
  const toRail = (lx: number, ly: number): [number, number] => {
    const [ox, oy] = gOrigin();
    return [lx + ox, ly + oy];
  };
  const toLocal = (rx: number, ry: number): [number, number] => {
    const [ox, oy] = gOrigin();
    return [rx - ox, ry - oy];
  };

  function armTipLocal(reach: number): [number, number] {
    return [pivotPX(state.actual) + reach * G.DIRX, G.PY + carrierDy(state.setLatte) + reach * G.DIRY];
  }
  function armTipRail(reach: number): [number, number] {
    const [x, y] = armTipLocal(reach);
    return toRail(x, y);
  }
  function armBlocked(reach: number): boolean {
    const [tx, ty] = armTipRail(reach);
    const fx = flankX(ty);
    return fx !== null && tx > fx;
  }
  /** groesste freie Ausfahrt <= reachWish (erste Beruehrung von ARM_MIN aus gesucht) */
  function clampArm(reachWish: number): number {
    const want = Math.min(G.ARM_MAX, Math.max(G.ARM_MIN, reachWish));
    if (!armBlocked(want)) return want;
    let lo = G.ARM_MIN;
    let hi = want;
    if (armBlocked(lo)) return lo;
    for (let r = G.ARM_MIN; r < want; r += 0.25) {
      if (armBlocked(r)) {
        hi = r;
        lo = r - 0.25;
        break;
      }
    }
    for (let i = 0; i < 24; i++) {
      const m = (lo + hi) / 2;
      if (armBlocked(m)) hi = m;
      else lo = m;
    }
    return lo;
  }
  function clampRod(yWish: number): number {
    const stop = state.hwear - A().H; // Kontakt mit der Fahrflaeche
    return Math.min(stop, Math.max(G.ROD_MIN, yWish));
  }
  const rodContact = (): boolean => state.rodTip >= state.hwear - A().H - 0.02;
  const armContact = (): boolean => state.armReach < G.ARM_MAX - 0.05 && armBlocked(state.armReach + 0.2);

  const rodReading = (): number => -state.rodTip; // Schienenhoehe ab Auflage

  /**
   * Simuliert den Antastpunkt gegen eine gedachte, unverschlissene
   * Schiene des Profils k (gleiche feste Pivot-/Winkelgeometrie). Das
   * ist der "Nullpunkt" fuer die Seitenablesung — dadurch stimmt die
   * Anzeige immer exakt, unabhaengig von Kurvenform oder Winkelwahl.
   */
  function idealContactX(k: ProfileKey): number {
    const p = PR[k];
    const oxK = -p.fh;
    const oyK = p.H;
    const cyK = carrierDy(k);
    const pxK = pivotPX(k);
    const tip = (reach: number): [number, number] => {
      const lx = pxK + reach * G.DIRX;
      const ly = G.PY + cyK + reach * G.DIRY;
      return [lx + oxK, ly + oyK];
    };
    const blocked = (reach: number): boolean => {
      const [tx, ty] = tip(reach);
      if (ty < 0) return false;
      const nx = xAtY(halfProfile(p), Math.max(ty, 1.4));
      return tx > -nx;
    };
    let lo = G.ARM_MIN;
    let hi = G.ARM_MAX;
    if (blocked(lo)) return tip(lo)[0];
    if (!blocked(hi)) return tip(hi)[0];
    for (let r = G.ARM_MIN; r <= hi; r += 0.25) {
      if (blocked(r)) {
        hi = r;
        lo = r - 0.25;
        break;
      }
    }
    for (let i = 0; i < 24; i++) {
      const m = (lo + hi) / 2;
      if (blocked(m)) hi = m;
      else lo = m;
    }
    return tip(lo)[0];
  }
  const zeroXRail = (): number => idealContactX(state.setLatte);
  const armReading = (): number => armTipRail(state.armReach)[0] - zeroXRail();

  /** Zielpunkt am Schienensteg fuer ein gegebenes Profil (feste Antasthoehe, Steg-Mitte) */
  function stegTargetXRailFor(p: ProfileGeom): number {
    return -xAtY(halfProfile(p), Math.max(G.STEG_TIP_Y + p.H, p.headH + 2));
  }
  const stegTargetXRail = (): number => stegTargetXRailFor(A()); // Ziel am tatsaechlich verbauten Profil

  /**
   * Feste Zielposition je Profilwahl (wie ein Massband, das genau bis
   * zur Marke des gewaehlten Profils reicht — NICHT dynamisch an die
   * tatsaechliche Schiene angepasst). Der goldene Balken reicht bis
   * hierhin; der graue Anschlag am Ende bleibt immer klein und gleich
   * gross. Nur wenn die Wahl zum wirklich verbauten Profil passt,
   * landet die Spitze exakt auf dem Steg.
   */
  const STEG_BAR_LEN = 95; // feste Laenge des Messingbalkens (er gleitet, dehnt sich nicht)
  const STEG_HOUSE_L = -70; // silbernes Fuehrungsgehaeuse, fest am Gusskoerper
  const STEG_HOUSE_R = 46; // reicht fast bis an den Schienensteg
  const STEG_TARGET_X: Record<ProfileKey, number> = { '49E5': 0, '54E4': 0, '60E2': 0 };
  for (const k of KEYS) {
    STEG_TARGET_X[k] = stegTargetXRailFor(PR[k]) + PR[k].fh; // Ziel, als waere k selbst die verbaute Schiene
  }
  const heightWear = (): number => PR[state.setLatte].H - rodReading();
  const stegOk = (): boolean => state.setSteg === state.actual;
  const latteOk = (): boolean => state.setLatte === state.actual;
  const refOk = (): boolean => stegOk() && latteOk();

  // ------------------------------------------------------------------
  // 6 · ZEICHNEN
  // ------------------------------------------------------------------
  const DEFS = `
<defs>
  <linearGradient id="cast" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0"   stop-color="#b9c3cc"/>
    <stop offset=".35" stop-color="#8d99a5"/>
    <stop offset=".62" stop-color="#a7b2bc"/>
    <stop offset="1"   stop-color="#727e8a"/>
  </linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#dfe6ec"/><stop offset=".5" stop-color="#b3bec8"/>
    <stop offset="1" stop-color="#cbd5dd"/>
  </linearGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0"   stop-color="#a97f22"/>
    <stop offset=".22" stop-color="#f2d787"/>
    <stop offset=".55" stop-color="#d3a63f"/>
    <stop offset="1"   stop-color="#8f6a19"/>
  </linearGradient>
  <linearGradient id="brassV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="#a97f22"/>
    <stop offset=".22" stop-color="#f2d787"/>
    <stop offset=".55" stop-color="#d3a63f"/>
    <stop offset="1"   stop-color="#8f6a19"/>
  </linearGradient>
  <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0"   stop-color="#6b5946"/>
    <stop offset=".3"  stop-color="#8b7358"/>
    <stop offset=".55" stop-color="#6e5c48"/>
    <stop offset="1"   stop-color="#4e4133"/>
  </linearGradient>
  <filter id="drop" x="-30%" y="-20%" width="170%" height="150%">
    <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" flood-color="#000" flood-opacity=".45"/>
  </filter>
</defs>`;

  const TXT = (x: number, y: number, s: string, o: TxtOpts = {}): string =>
    `<text x="${f2(x)}" y="${f2(y)}" fill="${o.fill || '#5d7a91'}" font-size="${o.fs || 4.4}"
     font-family="ui-monospace,monospace" letter-spacing="${o.ls || 0.2}"
     text-anchor="${o.a || 'start'}" ${o.w ? `font-weight="${o.w}"` : ''}>${s}</text>`;

  function railMarkup(p: ProfileGeom): string {
    const topY = state.hwear;
    const xr = xAtY(halfProfile(p), Math.max(topY, 1.4));
    const xl = -xr + state.swear;
    return `
  <g>
    <path d="${wornPath(p)}" fill="url(#rail)" stroke="#3b3126" stroke-width="0.9" filter="url(#drop)"/>
    <path d="M ${f2(xl)},${f2(topY)} L ${f2(xr)},${f2(topY)}" stroke="#eef3f7" stroke-width="1.8"
          stroke-linecap="round" opacity=".9"/>
    ${state.showNom ? `<path d="${nomPath(p)}" fill="none" stroke="#79c8f2" stroke-width="0.7"
          stroke-dasharray="3.5 3" opacity=".8"/>` : ''}
    <line x1="${f2(-p.hh - 46)}" y1="14" x2="${f2(p.hh + 4)}" y2="14"
          stroke="#79c8f2" stroke-width="0.5" stroke-dasharray="2 2.5" opacity=".65"/>
    ${TXT(p.hh + 7, 15.6, '14 mm unter SOK', { fill: '#5f7f94', fs: 4.2 })}
  </g>`;
  }

  function gaugeMarkup(): string {
    const dyL = LATTE_DY[state.setLatte];
    const cy = carrierDy(state.setLatte);
    const rod = state.rodTip;
    const reach = state.armReach;

    // --- Skalenstriche Hoehenmesslatte (auf dem Stab, wandert mit) ---
    let rodTicks = '';
    for (let i = 0; i <= G.ROD_BAR; i += 4) {
      const y = -i;
      const maj = i % 20 === 0;
      rodTicks += `<line x1="${G.ROD_X - 7}" y1="${y}" x2="${G.ROD_X - (maj ? 1 : 3.5)}" y2="${y}"
                  stroke="#5a4517" stroke-width="${maj ? 0.7 : 0.4}"/>`;
    }
    // --- Skalenstriche Seitenfuehler (auf dem Stab, wandert mit) ---
    let armTicks = '';
    for (let i = 0; i <= G.ARM_MAX - G.ARM_MIN + 24; i += 4) {
      const y = -i;
      const maj = i % 20 === 0;
      armTicks += `<line x1="-5.5" y1="${y}" x2="${maj ? -1 : -3.5}" y2="${y}"
                  stroke="#5a4517" stroke-width="${maj ? 0.7 : 0.4}"/>`;
    }

    // --- Ablesungen ---
    const rd = rodReading();
    const ar = armReading();
    const rodTxt = `${rd.toFixed(1).replace('.', ',')}`;
    const armTxt = `${ar >= 0 ? '' : '−'}${Math.abs(ar).toFixed(1).replace('.', ',')}`;

    // --- Steg-Fuehler: der goldene Balken reicht bis zur festen
    //     Zielmarke des gewaehlten Profils (linke Verankerung bleibt
    //     starr) — der graue Anschlag am Ende bleibt immer klein und
    //     gleich gross, wie am Original.
    // Exakt am Steg NUR wenn setSteg wirklich zum tatsaechlichen Profil
    // passt (echte Physik). Bei falscher Wahl wird der (in Wirklichkeit
    // oft nur ~1mm kleine) Unterschied zwischen den Stegdicken bewusst
    // auf den deutlich sichtbaren Rasterabstand der Auswahl gestreckt —
    // sodass eine falsche Wahl klar als Luecke bzw. Ueberlappung zu
    // erkennen ist.
    const stegTargetX = STEG_TARGET_X[state.actual] + (STEG_DX[state.setSteg] - STEG_DX[state.actual]); // fest, kein echter Bezug
    const STEG_TIP_LEN = 8; // Laenge des Anschlagblocks — immer konstant
    const stegBarRight = stegTargetX - STEG_TIP_LEN;
    const stegBarLeft = stegBarRight - STEG_BAR_LEN; // feste Laenge: der Balken gleitet
    const stegMatch = state.setSteg === state.actual;
    const stegMaxTarget = Math.max(...KEYS.map((k) => STEG_TARGET_X[k]));

    const latteMarks: Array<[ProfileKey, number]> = [
      ['60E2', -168],
      ['54E4', -150],
      ['49E5', -145],
    ];

    return `
  <!-- ============ Gusskoerper (Hakenklemme + Steg + Kopfplatte) ============ -->
  <defs>
    <mask id="hookHole" maskUnits="userSpaceOnUse" x="-92" y="-16" width="115" height="60">
      <rect x="-92" y="-16" width="115" height="60" fill="#fff"/>
      <ellipse cx="-40" cy="10" rx="14" ry="10.5" fill="#000"/>
    </mask>
  </defs>
  <g filter="url(#drop)">
    <rect x="-60" y="-6"  width="74" height="30" rx="8" fill="url(#cast)" mask="url(#hookHole)"/>
    <rect x="-58" y="-195" width="44" height="199" rx="10" fill="url(#cast)"/>
    <rect x="-70" y="-215" width="70" height="35"  rx="8"  fill="url(#cast)"/>
    <rect x="-58" y="-195" width="10" height="199" fill="#fff" opacity=".14"/>
    <rect x="-70" y="-215" width="70" height="6" fill="#fff" opacity=".25"/>
    <rect x="-58" y="-190" width="44" height="4" fill="#000" opacity=".16"/>
  </g>

  <!-- ============ Feste Fuehrungshuelse fuer die Hoehenmesslatte ============ -->
  <rect x="${G.ROD_X - 10}" y="${G.ROD_SLEEVE_TOP}" width="20" height="${G.ROD_SLEEVE_BOT - G.ROD_SLEEVE_TOP}"
        rx="3" fill="url(#steel)" stroke="#5f6c78" stroke-width="0.6"/>
  <rect x="${G.ROD_X - 10}" y="${G.ROD_SLEEVE_TOP}" width="20" height="5" fill="#000" opacity=".18"/>
  <rect x="-4" y="-219" width="${G.ROD_X - 10 + 4}" height="8" rx="3" fill="url(#steel)" stroke="#6d7a86" stroke-width="0.4"/>

  <!-- ============ Fuehlerlehre am Steg: Messingbalken gleitet im silbernen Gehaeuse ============ -->
  <g transform="translate(0,${G.STEG_TIP_Y})">
    <!-- Silbernes Fuehrungsgehaeuse (fest) — reicht fast bis an den Steg -->
    <rect x="${STEG_HOUSE_L}" y="-14" width="${STEG_HOUSE_R - STEG_HOUSE_L}" height="28" rx="7"
          fill="url(#steel)" stroke="#6d7a86" stroke-width="0.6"/>
    <rect x="${STEG_HOUSE_L}" y="-14" width="${STEG_HOUSE_R - STEG_HOUSE_L}" height="5" rx="2.5"
          fill="#fff" opacity=".3"/>
    <rect x="${STEG_HOUSE_L}" y="9" width="${STEG_HOUSE_R - STEG_HOUSE_L}" height="5" rx="2.5"
          fill="#000" opacity=".14"/>
    <!-- Schlitz, in dem der Balken laeuft -->
    <rect x="${STEG_HOUSE_L + 3}" y="-8.6" width="${STEG_HOUSE_R - STEG_HOUSE_L - 6}" height="17.2" rx="2"
          fill="#000" opacity=".22"/>
    <!-- Feste Indexmarke am Gehaeuse -->
    <path d="M 0,-13.6 l 2.4,-3.2 l -4.8,0 Z" fill="#f0872f"/>
    <line x1="0" y1="-13.6" x2="0" y2="-9" stroke="#f0872f" stroke-width="0.8"/>
    <line x1="0" y1="9" x2="0" y2="13.6" stroke="#f0872f" stroke-width="0.8"/>

    <!-- Messingbalken (gleitet mit der Profilwahl) -->
    <rect x="${f2(stegBarLeft)}" y="-8" width="${STEG_BAR_LEN}" height="16" rx="2"
          fill="url(#brass)" stroke="#6c5113" stroke-width="0.4"/>
    <rect x="${f2(stegBarLeft)}" y="-7" width="${STEG_BAR_LEN}" height="2.6" fill="#fff" opacity=".3"/>
    <circle cx="${f2(stegBarLeft + 7)}" cy="0" r="1.7" fill="#8a6a1c"/>
    <!-- Eingravierte Profilmarken auf dem Messingbalken -->
    ${KEYS.map((k) => {
      const mx = STEG_DX[state.setSteg] - STEG_DX[k];
      const on = state.setSteg === k;
      return `<line x1="${f2(mx)}" y1="1.4" x2="${f2(mx)}" y2="5.2"
                 stroke="${on ? '#a8410f' : '#5c4512'}" stroke-width="${on ? 1 : 0.6}"/>
              ${TXT(mx, -1.2, k, { fill: on ? '#a8410f' : '#5c4512', fs: 3.7, a: 'middle', w: on ? 800 : 700 })}`;
    }).join('')}

    <!-- Kleiner Anschlagblock am Balkenende — immer gleich gross -->
    <path d="M ${f2(stegBarRight)},-8 L ${f2(stegTargetX - 3)},-8
             L ${f2(stegTargetX)},-4 L ${f2(stegTargetX)},8 L ${f2(stegBarRight)},8 Z"
          fill="url(#steel)" stroke="${stegMatch ? '#f0872f' : '#5f6c78'}" stroke-width="${stegMatch ? 1 : 0.6}"/>
    <path d="M ${f2(stegBarRight)},-8 L ${f2(stegTargetX - 3)},-8 L ${f2(stegTargetX)},-4 L ${f2(stegBarRight + 1.5)},-4 Z"
          fill="#fff" opacity=".3"/>
    <rect x="${f2(stegBarRight)}" y="4.4" width="${STEG_TIP_LEN}" height="3.6" fill="#000" opacity=".16"/>
  </g>
  <rect x="${f2(Math.min(STEG_HOUSE_L, stegBarLeft) - 2)}" y="${G.STEG_TIP_Y - 15}"
        width="${f2(stegMaxTarget - Math.min(STEG_HOUSE_L, stegBarLeft) + 46)}" height="30"
        fill="transparent" data-h="steg" style="cursor:grab"/>

  <!-- ============ Messlatte am Kopf (beweglich, vertikal) ============ -->
  ${latteMarks.map(([k, y]) => `
    <line x1="-56" y1="${y}" x2="-50" y2="${y}" stroke="#33414f" stroke-width="0.7"/>
    ${TXT(-48, y + 1.4, k, { fill: state.setLatte === k ? '#f0872f' : '#41525f', fs: 3.6, w: 700 })}
  `).join('')}
  <g transform="translate(0,${dyL})">
    <rect x="-40" y="-188" width="12" height="46" rx="2" fill="url(#brassV)" stroke="#6c5113" stroke-width="0.4"/>
    <rect x="-38" y="-188" width="2.4" height="46" fill="#fff" opacity=".3"/>
    <path d="M -28,-168 l 3.4,2.6 l 0,-5.2 Z" fill="#f0872f"/>
    <rect x="-42" y="-190" width="16" height="50" fill="transparent" data-h="latte" style="cursor:grab"/>
  </g>

  <!-- ============ Messkopf mit Seitenfuehler (nur die Hoehe folgt Kopf/Latte — Steg bleibt starr) ============ -->
  <g transform="translate(0,${cy})">
    <rect x="-58" y="-214" width="66" height="30" rx="6" fill="url(#steel)"
          stroke="#6d7a86" stroke-width="0.5"/>
    ${TXT(-53, -197, 'SKM1', { fill: '#3d4c5b', fs: 6, w: 800, ls: 0.6 })}
    <!-- Bezugslinie 14 mm unter SOK -->
    <line x1="-6" y1="${G.BASE_PROBE_Y}" x2="22" y2="${G.BASE_PROBE_Y}"
          stroke="#f0872f" stroke-width="0.4" stroke-dasharray="2 2" opacity=".5"/>
    <!-- Seitenfuehler: Schieber mit festem Winkel, nur Ein-/Ausfahren -->
    <g transform="translate(${f2(pivotPX(state.actual))},${f2(G.PY)}) rotate(${f2(-G.TH0)})">
      <!-- feste Fuehrungsoese am Schlitten -->
      <rect x="-7" y="-14" width="14" height="20" rx="3" fill="url(#steel)" stroke="#5f6c78" stroke-width="0.5"/>
      <g transform="translate(0,${f2(reach - G.ARM_MIN)})">
        <rect x="-5.5" y="${-56}" width="11" height="${56 + G.ARM_MIN - 11}" rx="2" fill="url(#brass)" stroke="#6c5113" stroke-width="0.4"/>
        <rect x="-5.5" y="${-56}" width="2.2" height="${56 + G.ARM_MIN - 11}" fill="#fff" opacity=".3"/>
        ${armTicks}
        <!-- duenne, scharfe Nadelspitze (wie am Original) — Spitze exakt auf dem Kontaktpunkt -->
        <path d="M -2.4,${G.ARM_MIN - 11} L 2.4,${G.ARM_MIN - 11} L 0,${G.ARM_MIN + 0.3} Z" fill="#2c3138"/>
        <line x1="0" y1="${G.ARM_MIN - 10}" x2="0" y2="${G.ARM_MIN - 0.2}" stroke="#565f6a" stroke-width="0.3"/>
        <rect x="-7.5" y="${-58}" width="15" height="${58 + G.ARM_MIN + 14}" fill="transparent" data-h="arm" style="cursor:grab"/>
      </g>
    </g>
    ${TXT(-53, -203, 'SEITE (fest 43°)', { fill: '#4a5b6b', fs: 3, w: 700 })}
    ${TXT(-53, -171, armTxt + ' mm', { fill: armContact() ? '#f0872f' : '#4a5b6b', fs: 7, w: 800 })}
  </g>

  <!-- ============ Hoehenmesslatte (beweglich, unabhaengig von der Kopf-Kalibrierung) ============ -->
  <g transform="translate(0,${f2(rod)})">
    <rect x="${G.ROD_X - 7}" y="${-G.ROD_BAR}" width="14" height="${G.ROD_BAR}" rx="2" fill="url(#brass)"
          stroke="#6c5113" stroke-width="0.4"/>
    <rect x="${G.ROD_X - 7}" y="${-G.ROD_BAR}" width="2.6" height="${G.ROD_BAR}" fill="#fff" opacity=".3"/>
    ${rodTicks}
    <path d="M ${G.ROD_X - 2.3},-8.5 L ${G.ROD_X + 2.3},-8.5 L ${G.ROD_X + 0.5},0.5 L ${G.ROD_X - 0.5},0.5 Z" fill="#2c3138"/>
    <line x1="${G.ROD_X}" y1="-7.5" x2="${G.ROD_X}" y2="-0.2" stroke="#565f6a" stroke-width="0.3"/>
    <rect x="${G.ROD_X - 9}" y="${-G.ROD_BAR - 4}" width="20" height="${G.ROD_BAR + 8}" fill="transparent" data-h="rod" style="cursor:grab"/>
  </g>
  ${TXT(G.ROD_X + 13, G.ROD_SLEEVE_TOP - 6, 'HOEHE', { fill: '#4a5b6b', fs: 3.4, w: 700 })}
  ${TXT(G.ROD_X + 13, G.ROD_SLEEVE_TOP + 4, rodTxt + ' mm', { fill: rodContact() ? '#f0872f' : '#4a5b6b', fs: 7, w: 800 })}
  `;
  }

  function sceneMarkup(): string {
    const p = A();
    const [ox, oy] = gOrigin();
    return `<g>
    ${railMarkup(p)}
    <g transform="translate(${ox},${oy})">${gaugeMarkup()}</g>
  </g>`;
  }

  // ------------------------------------------------------------------
  // 7 · RENDER
  // ------------------------------------------------------------------
  function $<T extends Element>(id: string): T {
    const el = root.querySelector<T>('#' + id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el;
  }
  const scene = $<SVGSVGElement>('scene');
  const detail = $<SVGSVGElement>('detail');

  function render(): void {
    const m = sceneMarkup();
    scene.innerHTML = DEFS + m;
    detail.innerHTML = m; // gleiche Geometrie, engerer viewBox
    renderPanel();
  }

  function fmt(n: number, d = 1): string {
    return n.toFixed(d).replace('.', ',');
  }

  function renderPanel(): void {
    $('vSteg').textContent = state.setSteg;
    $('vLatte').textContent = state.setLatte;
    $('tagProfile').textContent = state.blind ? 'Verbaut: ??? — selbst bestimmen' : 'Verbaut: ' + PR[state.actual].name;

    const ok = refOk();
    const rs = $('refState');
    const stegBad = !stegOk();
    const latteBad = !latteOk();
    if (ok) {
      rs.className = 'state ok';
      rs.textContent = 'Bezug stimmt — du kannst messen.';
    } else if (stegBad && latteBad) {
      rs.className = 'state bad';
      rs.textContent =
        'Fuehlerlehre und Messlatte stehen auf dem falschen Profil — der Anlageschuh liegt nicht flaechig am Steg an, und der Messkopf sitzt in der Hoehe versetzt.';
    } else if (stegBad) {
      rs.className = 'state bad';
      rs.textContent =
        'Fuehlerlehre (Steg) steht auf dem falschen Profil — der Anlageschuh liegt nicht flaechig am Schienensteg an. Der Messkopf selbst bleibt unveraendert.';
    } else {
      rs.className = 'state bad';
      rs.textContent = 'Messlatte (Kopf) steht auf dem falschen Profil — der Messkopf sitzt in der Hoehe versetzt, die Ablesung stimmt nicht.';
    }

    // Fuehler
    const rc = rodContact();
    const ac = armContact();
    $('vRod').textContent = fmt(rodReading()) + ' mm';
    $('cRod').textContent = rc ? 'Kontakt' : 'kein Kontakt';
    $('cRod').className = rc ? 'chip live' : 'chip';
    $('vArm').textContent = fmt(armReading()) + ' mm';
    $('cArm').textContent = ac ? 'Kontakt' : 'kein Kontakt';
    $('cArm').className = ac ? 'chip live' : 'chip';

    // Ergebnis
    const hv = heightWear();
    const sv = armReading();
    const boxH = $('rHeight');
    const boxS = $('rSide');
    const tH = $('tHeight');
    const tS = $('tSide');

    if (rc) {
      boxH.textContent = fmt(hv) + ' mm';
      boxH.className = 'v';
    } else {
      boxH.textContent = '—';
      boxH.className = 'v muted';
    }
    if (ac) {
      boxS.textContent = fmt(sv) + ' mm';
      boxS.className = 'v';
    } else {
      boxS.textContent = '—';
      boxS.className = 'v muted';
    }

    if (state.revealed) {
      const dh = rc ? hv - state.hwear : null;
      const ds = ac ? sv - state.swear : null;
      tH.textContent = 'echt ' + fmt(state.hwear) + ' mm' + (dh === null ? '' : '  ·  Δ' + fmt(dh));
      tS.textContent = 'echt ' + fmt(state.swear) + ' mm' + (ds === null ? '' : '  ·  Δ' + fmt(ds));
      tH.className = 't ' + (dh !== null && Math.abs(dh) <= 0.5 ? 'hit' : 'miss');
      tS.className = 't ' + (ds !== null && Math.abs(ds) <= 0.5 ? 'hit' : 'miss');
    } else {
      tH.textContent = rc ? 'Sollhoehe ' + state.setLatte + ' = ' + PR[state.setLatte].H + ' mm' : 'Fahrflaeche';
      tS.textContent = 'Fahrkante, 14 mm unter SOK';
      tH.className = 't';
      tS.className = 't';
    }
  }

  // ------------------------------------------------------------------
  // 8 · INTERAKTION
  // ------------------------------------------------------------------
  let drag: DragInfo | null = null;

  function localPoint(evt: PointerEvent): [number, number] {
    const pt = scene.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = scene.getScreenCTM();
    if (!ctm) return [0, 0];
    const r = pt.matrixTransform(ctm.inverse());
    return toLocal(r.x, r.y);
  }
  function nearestKey(map: Record<ProfileKey, number>, v: number): ProfileKey {
    let best: ProfileKey = KEYS[0];
    let d = Infinity;
    for (const k of KEYS) {
      const dd = Math.abs(map[k] - v);
      if (dd < d) {
        d = dd;
        best = k;
      }
    }
    return best;
  }
  function reclamp(): void {
    state.rodTip = clampRod(state.rodTip);
    state.armReach = clampArm(state.armReach);
  }
  /** Ausfahrlaenge des Seitenfuehlers aus einem Punkt (Projektion auf feste Achse) */
  function reachAt(lx: number, ly: number): number {
    const px = pivotPX(state.actual);
    const py = G.PY + carrierDy(state.setLatte);
    return (lx - px) * G.DIRX + (ly - py) * G.DIRY;
  }

  const onPointerDown = (e: PointerEvent): void => {
    const target = e.target as Element | null;
    const h = target ? target.closest('[data-h]') : null;
    if (!h) return;
    const kind = h.getAttribute('data-h') as SelKind | null;
    if (!kind) return;
    const [lx, ly] = localPoint(e);
    state.sel = kind;
    if (kind === 'rod') drag = { kind, off: ly - state.rodTip };
    if (kind === 'latte') drag = { kind, off: ly - LATTE_DY[state.setLatte] };
    if (kind === 'steg') drag = { kind, off: lx - STEG_DX[state.setSteg] };
    if (kind === 'arm') drag = { kind, off: reachAt(lx, ly) - state.armReach };
    scene.setPointerCapture(e.pointerId);
    e.preventDefault();
    render();
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!drag) return;
    const [lx, ly] = localPoint(e);
    if (drag.kind === 'rod') state.rodTip = clampRod(ly - drag.off);
    if (drag.kind === 'latte') {
      state.setLatte = nearestKey(LATTE_DY, ly - drag.off);
      reclamp();
    }
    if (drag.kind === 'steg') {
      state.setSteg = nearestKey(STEG_DX, lx - drag.off);
      reclamp();
    }
    if (drag.kind === 'arm') {
      state.armReach = clampArm(reachAt(lx, ly) - drag.off);
    }
    e.preventDefault();
    render();
  };

  const endDrag = (e: PointerEvent): void => {
    if (drag) {
      drag = null;
      try {
        scene.releasePointerCapture(e.pointerId);
      } catch {
        /* Zeiger war bereits freigegeben */
      }
    }
  };

  scene.addEventListener('pointerdown', onPointerDown);
  scene.addEventListener('pointermove', onPointerMove);
  scene.addEventListener('pointerup', endDrag);
  scene.addEventListener('pointercancel', endDrag);

  /** Tastatur: zuletzt angefasstes Bauteil mit den Pfeiltasten feinjustieren */
  const keydownHandler = (e: KeyboardEvent): void => {
    if (!state.sel) return;
    const k = e.key;
    const up = k === 'ArrowUp' || k === 'ArrowRight';
    const dn = k === 'ArrowDown' || k === 'ArrowLeft';
    if (!up && !dn) return;
    const step = e.shiftKey ? 0.1 : 0.5;
    if (state.sel === 'rod') state.rodTip = clampRod(state.rodTip + (up ? -step : step));
    if (state.sel === 'arm') state.armReach = clampArm(state.armReach + (up ? step : -step));
    if (state.sel === 'latte' || state.sel === 'steg') {
      const cur = state.sel === 'latte' ? state.setLatte : state.setSteg;
      let i = KEYS.indexOf(cur) + (up ? 1 : -1);
      i = Math.max(0, Math.min(KEYS.length - 1, i));
      if (state.sel === 'latte') state.setLatte = KEYS[i];
      else state.setSteg = KEYS[i];
      reclamp();
    }
    e.preventDefault();
    render();
  };
  window.addEventListener('keydown', keydownHandler);

  // ------------------------------------------------------------------
  // 9 · AUFGABEN-STEUERUNG
  // ------------------------------------------------------------------
  function newRail(): void {
    state.actual = KEYS[Math.floor(Math.random() * KEYS.length)];
    state.hwear = Math.round(Math.random() * 22) / 2; // 0 … 11,0 mm
    state.swear = Math.round(Math.random() * 22) / 2;
    state.rodTip = G.ROD_MIN;
    state.armReach = G.ARM_MIN;
    state.revealed = false;
    reclamp();
    render();
  }
  $('btnNew').addEventListener('click', newRail);
  $('btnReset').addEventListener('click', () => {
    state.rodTip = G.ROD_MIN;
    state.armReach = G.ARM_MIN;
    state.revealed = false;
    render();
  });
  $('btnReveal').addEventListener('click', () => {
    state.revealed = !state.revealed;
    render();
  });
  $('btnNominal').addEventListener('click', (e) => {
    state.showNom = !state.showNom;
    (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(state.showNom));
    render();
  });
  $('btnBlind').addEventListener('click', (e) => {
    state.blind = !state.blind;
    (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(state.blind));
    render();
  });

  newRail();

  return () => {
    window.removeEventListener('keydown', keydownHandler);
  };
}

@Component({
  selector: 'app-schienenmesser',
  templateUrl: './schienenmesser.page.html',
  styleUrls: ['./schienenmesser.page.scss'],
  standalone: false,
})
export class SchienenmesserPage implements AfterViewInit, OnDestroy {
  private cleanup: (() => void) | null = null;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.cleanup = initSchienenmesser(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.cleanup) this.cleanup();
  }
}
