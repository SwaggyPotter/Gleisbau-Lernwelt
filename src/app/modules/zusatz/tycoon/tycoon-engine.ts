/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gleisbau Tycoon -- Spiel-Engine (Canvas). Portiert aus der Einzeldatei-Demo.
 * Haengt an einem Wurzel-Element (siehe tycoon.page.html), speichert ueber Callbacks
 * (Server statt localStorage) und kennt einen Nur-Lesen-Modus fuer fremde Netze.
 */

export interface TycoonOptions {
  /** Gespeicherter Spielstand (JSON vom Server) oder null fuer ein neues Spiel. */
  state: any | null;
  /** Fremdes Netz ansehen: keine Aktionen, keine Wirtschaft. */
  readOnly: boolean;
  onSave: (data: any, money: number) => void;
  onReset?: () => void;
}

export interface TycoonHandle {
  destroy: () => void;
}

export function startTycoon(root: HTMLElement, opts: TycoonOptions): TycoonHandle {
  const RO = opts.readOnly;

  /* ---------- Konfiguration / Balancing ---------- */
  const CFG = {
    startMoney: 5000, lineCostPerUnit: 5, trainCost: 2500, trainSpeed: 55, foreignFee: 0.2,
    foreignSpawn: [12, 24], ownRent: 0.12, ownUpkeep: 0.04, upkeepPerSec: 0.004, wearPerPass: 0.9,
    careCostPerUnit: 1.2, daySec: 60, unlockNeed: 3,
    // Bei einer Stoerung fahren die Zuege weiter, aber langsamer und mit weniger Einnahmen.
    faultSpeed: 0.5, faultIncome: 0.35,
  };
  /** Spielmodi: so oft (in aktiver Spielzeit, Minuten) kommt hoechstens eine Stoerung. */
  const MODES = [
    { n: 'Entspannt', min: 10 },
    { n: 'Normal', min: 7 },
    { n: 'Anspruchsvoll', min: 5 },
    { n: 'Stress', min: 3 },
  ];
  const modeInterval = (m: number) => MODES[m].min * 60 * (1 + Math.random() * 0.2);
  const CITIES = [
    { n: 'Berlin', x: 620, y: 185 }, { n: 'Hamburg', x: 360, y: 95 }, { n: 'Rostock', x: 600, y: 55 },
    { n: 'Hannover', x: 330, y: 235 }, { n: 'Leipzig', x: 570, y: 335 }, { n: 'Dresden', x: 720, y: 365 },
    { n: 'Dortmund', x: 170, y: 270 }, { n: 'Köln', x: 130, y: 380 }, { n: 'Frankfurt', x: 310, y: 430 },
    { n: 'Nürnberg', x: 520, y: 500 }, { n: 'Stuttgart', x: 320, y: 555 }, { n: 'München', x: 600, y: 595 },
  ];
  const START_CITY = 0;
  const DIFF = [
    // Alle Stoerungen werden mit dem Spiel "Nivellierlatte ablesen" behoben. Mit der Stufe wachsen
    // Zahl der Ablesungen, geforderte Treffer und Lattenentfernung (= weiter Ausschnitt, schwerer).
    { n: 'Leicht', task: 'Nivellierlatte ablesen (2 Ablesungen, 1 richtig)', val: 200, share: .05, col: '#4caf7d', reads: 2, need: 1, dist: 12 },
    { n: 'Mittel', task: 'Nivellierlatte ablesen (3 Ablesungen, 2 richtig)', val: 600, share: .15, col: '#d9a520', reads: 3, need: 2, dist: 16 },
    { n: 'Schwer', task: 'Nivellierlatte ablesen (3 Ablesungen, 3 richtig)', val: 1500, share: .30, col: '#e07a3a', reads: 3, need: 3, dist: 20 },
    { n: 'Experte', task: 'Nivellierlatte ablesen (4 Ablesungen, 3 richtig)', val: 4000, share: .50, col: '#d64545', reads: 4, need: 3, dist: 24 },
  ];
  /** Lok-Typen zum Kaufen: alte Loks sind billig, bringen aber weniger Miete (Tims Spielidee). speed/rent/upkeep sind Faktoren auf CFG. */
  const TRAINS = [
    { n: 'Dampflok (Gebrauchtkauf)', cost: 1200, speed: 0.75, rent: 0.55, upkeep: 1.6, len: 2, col: '#7a5230', col2: '#b08a64' },
    { n: 'Diesellok', cost: 2500, speed: 1, rent: 1, upkeep: 1, len: 2, col: '#ff7a00', col2: '#ffb066' },
    { n: 'E-Lok', cost: 4500, speed: 1.2, rent: 1.7, upkeep: 1.1, len: 3, col: '#2e86ab', col2: '#8cc1d6' },
    { n: 'ICE-Triebzug', cost: 9000, speed: 1.6, rent: 3.2, upkeep: 1.3, len: 4, col: '#d9d9d9', col2: '#9aa5b1' },
  ];
  const tdef = (t: any) => TRAINS[t.type ?? 1] || TRAINS[1];
  const LCOL = ['#e4572e', '#2e86ab', '#59a14f', '#b07aa1', '#f2a900', '#17bebb', '#8c564b', '#4e79a7', '#d6336c', '#7f8c8d'];

  /* ---------- Helfer ---------- */
  const $ = (s: string): any => root.querySelector(s);
  const cv: HTMLCanvasElement = $('#c');
  const ctx = cv.getContext('2d')!;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const ri = (a: number, b: number) => Math.floor(rand(a, b + 1));
  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE') + ' €';
  const sgn = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(Math.round(n)).toLocaleString('de-DE') + ' €';
  const shuffle = (a: any[]) => { for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mulberry = (a: number) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);

  /* ---------- Zustand ---------- */
  let W = 0, H = 0, dpr = 1, k = 1, ox = 0, oy = 0;
  let S: any = null;
  let sel: any = { city: null, line: null };
  let hover: any = { city: null, line: null, fault: null };
  let modal: any = null;
  const popups: any[] = [];
  let alive = true;
  let raf = 0;
  const HUD_H = 48;

  const fresh = () => {
    S = { money: CFG.startMoney, time: 0, speed: 1, lines: [], trains: [], vis: CITIES.map(() => false),
      skill: [0, 0, 0, 0], mode: 0, faultIn: modeInterval(0), tut: 0, tutT: 0, faultsFixed: 0, passes: 0, anyFault: false, openedLine: false, nextId: 1 };
    S.vis[START_CITY] = true;
    revealNear(START_CITY, 3);
  };
  const revealNear = (i: number, n: number) => {
    const c = CITIES[i];
    CITIES.map((o, j) => ({ j, d: dist(c, o) })).filter(o => !S.vis[o.j]).sort((a, b) => a.d - b.d).slice(0, n).forEach(o => S.vis[o.j] = true);
  };

  /* ---------- Geometrie ---------- */
  const makeGeo = (a: number, b: number) => {
    const lo = a < b ? CITIES[a] : CITIES[b], hi = a < b ? CITIES[b] : CITIES[a];
    const rnd = mulberry(Math.min(a, b) * 1000 + Math.max(a, b) + 7);
    const dx = hi.x - lo.x, dy = hi.y - lo.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const o1 = (rnd() * 2 - 1) * L * .28, o2 = (rnd() * 2 - 1) * L * .28;
    const c1 = { x: lo.x + dx * .3 + nx * o1, y: lo.y + dy * .3 + ny * o1 };
    const c2 = { x: lo.x + dx * .7 + nx * o2, y: lo.y + dy * .7 + ny * o2 };
    const pts: any[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, u = 1 - t;
      pts.push({ x: u * u * u * lo.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * hi.x,
        y: u * u * u * lo.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * hi.y });
    }
    if (a > b) pts.reverse();
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    return { pts, cum, len: cum[cum.length - 1] };
  };
  const posAt = (L: any, s: number) => {
    s = Math.max(0, Math.min(L.len, s));
    let i = 1; while (i < L.cum.length - 1 && L.cum[i] < s) i++;
    const p0 = L.pts[i - 1], p1 = L.pts[i], seg = L.cum[i] - L.cum[i - 1] || 1, f = (s - L.cum[i - 1]) / seg;
    return { x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f, ang: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
  };
  const lineExists = (a: number, b: number) => S.lines.some((l: any) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  const lineCost = (geo: any) => Math.round(geo.len * CFG.lineCostPerUnit / 10) * 10;

  /* ---------- Spiel-Aktionen ---------- */
  const addLine = (a: number, b: number) => {
    const g = makeGeo(a, b);
    const L = { id: S.lines.length, a, b, pts: g.pts, cum: g.cum, len: g.len, color: LCOL[S.lines.length % LCOL.length],
      cond: 100, inF: 0, inO: 0, up: 0, rep: 0, fault: null, spawnT: rand(1.5, 4) };
    S.lines.push(L);
    return L;
  };
  const tryBuild = (a: number, b: number) => {
    if (lineExists(a, b)) { toast('Diese Strecke gehört dir schon.'); return false; }
    const g = makeGeo(a, b), cost = lineCost(g);
    if (S.money < cost) { toast('Zu wenig Guthaben (' + fmt(cost) + ' nötig).'); return false; }
    S.money -= cost;
    addLine(a, b);
    revealNear(a, 2); revealNear(b, 2);
    toast('Strecke ' + CITIES[a].n + ' ⇄ ' + CITIES[b].n + ' gebaut (−' + fmt(cost) + ')');
    sel.line = null;
    save();
    return true;
  };
  const spawnForeign = (L: any) => {
    const dir = Math.random() < .5 ? 1 : -1;
    S.trains.push({ id: S.nextId++, line: L.id, own: false, dir, s: dir > 0 ? 0 : L.len, earned: 0, cost: 0, trips: 0 });
  };
  const buyTrain = (id: number, type = 1) => {
    const def = TRAINS[type]; if (!def) return;
    if (S.money < def.cost) { toast('Zu wenig Guthaben.'); return; }
    S.money -= def.cost;
    S.trains.push({ id: S.nextId++, line: id, own: true, type, dir: 1, s: 0, earned: 0, cost: 0, trips: 0 });
    toast(def.n + ' gekauft (−' + fmt(def.cost) + ')');
    save();
  };
  const careLine = (id: number) => {
    const L = S.lines[id], c = Math.round(L.len * CFG.careCostPerUnit / 10) * 10;
    if (S.money < c) { toast('Zu wenig Guthaben.'); return; }
    S.money -= c; L.rep += c; L.cond = Math.min(100, L.cond + 25);
    toast('Pflege durch Fremdfirma (−' + fmt(c) + ')');
    save();
  };
  /** Hoechster Schwierigkeitsgrad, den der Spieler selbst beheben darf. */
  const maxFixable = () => { let m = 0; for (let d = 1; d < DIFF.length; d++) if (unlocked(d)) m = d; return m; };
  const createFault = (first: boolean) => {
    if (!S.lines.length || S.lines.some((l: any) => l.fault)) return;
    // Linie nach Verschleiss gewichten
    const wl = S.lines.map((l: any) => 1 + (100 - l.cond) / 25);
    let r = Math.random() * wl.reduce((a: number, b: number) => a + b), li = 0;
    while (li < wl.length - 1 && r > wl[li]) { r -= wl[li]; li++; }
    const L = S.lines[li];
    let diff = 0;
    if (!first) {
      const w = (100 - L.cond) / 100, top = maxFixable();
      const wt = [.6 - .3 * w, .28, .1 + .15 * w, .02 + .15 * w].map((x, i) => x * (1 + S.mode * .35 * i)).slice(0, top + 1);
      const sum = wt.reduce((a: number, b: number) => a + b);
      let q = Math.random() * sum;
      while (diff < wt.length - 1 && q > wt[diff]) { q -= wt[diff]; diff++; }
    }
    L.fault = { t: rand(.25, .75), diff };
    S.anyFault = true;
    S.faultIn = modeInterval(S.mode);
    toast('⚠ Störung auf ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + ' (' + DIFF[diff].n + ')');
  };
  const resolveFault = (L: any, how: string) => {
    const d = DIFF[L.fault.diff];
    if (how === 'firm') { S.money -= d.val; L.rep += d.val; L.cond = Math.min(100, L.cond + 10); toast('Fremdfirma erledigt die Störung (−' + fmt(d.val) + ')'); }
    if (how === 'self-ok') { const b = d.val * d.share; S.money += b; L.cond = Math.min(100, L.cond + 20); S.skill[L.fault.diff]++; toast('Selbst erledigt! Fremdkosten gespart, Bonus +' + fmt(b)); }
    if (how === 'self-fail') { const c = d.val * .5; S.money -= c; L.rep += c; L.cond = Math.min(100, L.cond + 10); toast('Fehlversuch – Fremdfirma musste nacharbeiten (−' + fmt(c) + ')'); }
    L.fault = null; S.faultsFixed++;
  };
  const unlocked = (d: number) => d === 0 || S.skill[d - 1] >= CFG.unlockNeed;

  /* ---------- Simulation ---------- */
  const update = (dtReal: number) => {
    S.tutT += dtReal;
    if (RO) {
      // Nur Optik: Zuege fahren, keine Wirtschaft.
      for (const t of S.trains) {
        const L = S.lines[t.line]; if (!L) continue;
        t.s += t.dir * CFG.trainSpeed * (t.own ? tdef(t).speed : 1) * dtReal;
        if (t.s >= L.len || t.s <= 0) { t.s = Math.max(0, Math.min(L.len, t.s)); t.dir *= -1; }
      }
      return;
    }
    if (modal) return;
    const dt = Math.min(dtReal, .1) * S.speed;
    if (!dt) return;
    S.time += dt;
    for (const L of S.lines) {
      const up = L.len * CFG.upkeepPerSec * (1 + (100 - L.cond) / 50) * dt;
      S.money -= up; L.up += up;
      L.spawnT -= dt;
      if (L.spawnT <= 0) {
        L.spawnT = rand(CFG.foreignSpawn[0], CFG.foreignSpawn[1]);
        if (S.trains.filter((t: any) => t.line === L.id && !t.own).length < 3) spawnForeign(L);
      }
    }
    // Stoerungen: hoechstens eine pro Intervall aktiver Spielzeit (echte Zeit, nicht Spielgeschwindigkeit).
    if (!S.anyFault) {
      if (S.passes >= 4) createFault(true);   // erste Stoerung = Tutorial, immer leicht
    } else {
      S.faultIn -= Math.min(dtReal, .25);
      if (S.faultIn <= 0) createFault(false);   // wartet, solange noch eine Stoerung offen ist
    }
    for (const t of S.trains.slice()) {
      const L = S.lines[t.line];
      t.s += t.dir * CFG.trainSpeed * (t.own ? tdef(t).speed : 1) * (L.fault ? CFG.faultSpeed : 1) * dt;
      if (t.s >= L.len || t.s <= 0) { t.s = Math.max(0, Math.min(L.len, t.s)); arrive(t, L); }
    }
    for (let i = popups.length - 1; i >= 0; i--) { popups[i].age += dtReal; if (popups[i].age > 1.4) popups.splice(i, 1); }
  };
  const arrive = (t: any, L: any) => {
    const p = posAt(L, t.s);
    S.passes++;
    L.cond = Math.max(0, L.cond - CFG.wearPerPass * (t.own ? 1 : 1.4));
    t.trips++;
    if (t.own) {
      const td = tdef(t), inc = L.len * CFG.ownRent * td.rent * (L.fault ? CFG.faultIncome : 1), cost = L.len * CFG.ownUpkeep * td.upkeep;
      S.money += inc - cost; L.inO += inc; t.earned += inc; t.cost += cost;
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(inc - cost) + ' €', col: '#e07a00', age: 0 });
      t.dir *= -1;
    } else {
      const fee = L.len * CFG.foreignFee * (L.fault ? CFG.faultIncome : 1);
      S.money += fee; L.inF += fee;
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(fee) + ' €', col: '#2e8b57', age: 0 });
      S.trains.splice(S.trains.indexOf(t), 1);
    }
  };

  /* ---------- Layout / Eingabe ---------- */
  const layout = () => {
    W = root.clientWidth; H = root.clientHeight; dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const narrow = W < 700, aw = narrow ? W : W - 300, ah = narrow ? H - HUD_H - Math.round(H * .38) : H - HUD_H;
    k = Math.max(0.1, Math.min(aw / 1000, ah / 640) * .94); ox = (aw - 1000 * k) / 2; oy = HUD_H + (ah - 640 * k) / 2;
  };
  const toWorld = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k };
  };
  const segDist = (p: any, a: any, b: any) => {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };
  const hit = (p: any) => {
    const r: any = { city: null, line: null, fault: null };
    if (!RO) for (const L of S.lines) if (L.fault) { const q = posAt(L, L.len * L.fault.t); if (dist(p, q) < 18 / Math.min(1, k)) { r.fault = L.id; return r; } }
    for (let i = 0; i < CITIES.length; i++) if (S.vis[i] && dist(p, CITIES[i]) < 20) { r.city = i; return r; }
    let best = 1e9;
    for (const L of S.lines) {
      for (let i = 1; i < L.pts.length; i++) { const d = segDist(p, L.pts[i - 1], L.pts[i]); if (d < 9 / Math.min(1, k) && d < best) { best = d; r.line = L.id; } }
    }
    return r;
  };
  const onMove = (e: PointerEvent) => {
    hover = hit(toWorld(e));
    cv.style.cursor = (hover.city !== null || hover.line !== null || hover.fault !== null) ? 'pointer' : 'default';
  };
  const onCanvasDown = (e: PointerEvent) => {
    if (modal) return;
    const p = toWorld(e), h = hit(p);
    if (h.fault !== null) { openFault(h.fault); return; }
    if (RO) {
      if (h.line !== null) { sel.line = h.line; } else if (h.city === null) { sel.line = null; }
      return;
    }
    if (h.city !== null) {
      if (sel.city === null) { sel.city = h.city; sel.line = null; }
      else if (sel.city === h.city) { sel.city = null; }
      else { if (tryBuild(sel.city, h.city)) sel.city = h.city; }
      return;
    }
    if (h.line !== null) { sel.line = h.line; sel.city = null; S.openedLine = true; return; }
    sel.city = null; sel.line = null;
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { sel.city = null; sel.line = null; if (modal && modal.kind === 'fault') closeModal(); } };
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerdown', onCanvasDown);
  window.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => layout());
  ro.observe(root);

  /* ---------- Zeichnen ---------- */
  const path = (pts: any[]) => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); };
  const label = (x: number, y: number, txt: string, col: string, plain?: boolean) => {
    ctx.font = '700 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!plain) { const w = ctx.measureText(txt).width + 12; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(x - w / 2, y - 10, w, 20); }
    ctx.fillStyle = col; ctx.fillText(txt, x, y);
  };
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const L of S.lines) {
      const on = sel.line === L.id || hover.line === L.id;
      path(L.pts);
      if (on) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 14; ctx.stroke(); }
      path(L.pts); ctx.strokeStyle = L.color; ctx.lineWidth = 7; ctx.stroke();
      path(L.pts); ctx.strokeStyle = L.cond < 25 ? '#ff2d2d' : L.cond < 50 ? '#ffb347' : '#fff';
      ctx.lineWidth = 2.2; ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (!RO && sel.city !== null && hover.city !== null && hover.city !== sel.city && !lineExists(sel.city, hover.city)) {
      const g = makeGeo(sel.city, hover.city), c = lineCost(g), ok = S.money >= c;
      path(g.pts); ctx.strokeStyle = ok ? 'rgba(35,38,43,.55)' : 'rgba(192,57,43,.7)'; ctx.lineWidth = 5; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.setLineDash([]);
      const m = g.pts[30]; label(m.x, m.y - 14, fmt(c), ok ? '#23262b' : '#c0392b');
    }
    for (const t of S.trains) {
      const L = S.lines[t.line]; if (!L) continue;
      const n = t.own ? tdef(t).len : 3;
      for (let i = 0; i < n; i++) {
        const s = t.s - t.dir * i * 11;
        if (s < 0 || s > L.len) continue;
        const p = posAt(L, s);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
        ctx.fillStyle = t.own ? (i === 0 ? tdef(t).col : tdef(t).col2) : (i === 0 ? '#2f3a46' : '#5d6b7a');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(-5, -3.5, 10, 7); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    const pulse = 1 + .12 * Math.sin(performance.now() / 200);
    for (const L of S.lines) if (L.fault) {
      const p = posAt(L, L.len * L.fault.t), d = DIFF[L.fault.diff];
      ctx.beginPath(); ctx.arc(p.x, p.y, 13 * pulse, 0, 7); ctx.fillStyle = d.col; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '700 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', p.x, p.y + 1);
    }
    for (let i = 0; i < CITIES.length; i++) {
      if (!S.vis[i]) continue;
      const c = CITIES[i], connected = S.lines.some((l: any) => l.a === i || l.b === i);
      const isSel = sel.city === i, isHov = hover.city === i;
      ctx.beginPath(); ctx.arc(c.x, c.y, isSel || isHov ? 13 : 11, 0, 7);
      ctx.fillStyle = connected ? '#fff' : '#f4f1ea'; ctx.fill();
      ctx.lineWidth = isSel ? 5 : 3.5; ctx.strokeStyle = isSel ? '#e4572e' : '#23262b'; ctx.stroke();
      ctx.fillStyle = '#23262b'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(c.n, c.x, c.y + 17);
    }
    for (const p of popups) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / 1.4);
      label(p.x, p.y - 12 - p.age * 26, p.txt, p.col, true);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  /* ---------- Panel / HUD ---------- */
  let lastPanel = '';
  const barHTML = (v: number, col: string) => '<div class="bar"><i style="width:' + Math.round(v) + '%;background:' + col + '"></i></div>';
  const condCol = (c: number) => c < 25 ? '#d64545' : c < 50 ? '#e0a030' : '#4caf7d';
  const panelHTML = () => {
    if (sel.line !== null && S.lines[sel.line]) {
      const L = S.lines[sel.line];
      const own = S.trains.filter((t: any) => t.own && t.line === L.id);
      const ownUp = own.reduce((a: number, t: any) => a + t.cost, 0);
      const net = L.inF + L.inO - L.up - L.rep - ownUp;
      const care = Math.round(L.len * CFG.careCostPerUnit / 10) * 10;
      let h = '<h3 style="color:' + L.color + '">' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h3>';
      h += '<div class="mut">Länge ca. ' + Math.round(L.len * .6) + ' km</div>';
      h += '<div class="row"><span>Zustand</span><b>' + Math.round(L.cond) + ' %</b></div>' + barHTML(L.cond, condCol(L.cond));
      h += '<div class="row"><span>Trassenentgelt (Fremdzüge)</span><span class="pos">' + sgn(L.inF) + '</span></div>';
      h += '<div class="row"><span>Miete eigene Züge</span><span class="pos">' + sgn(L.inO) + '</span></div>';
      h += '<div class="row"><span>Unterhalt laufend</span><span class="neg">' + sgn(-L.up) + '</span></div>';
      h += '<div class="row"><span>Wartung eigene Züge</span><span class="neg">' + sgn(-ownUp) + '</span></div>';
      h += '<div class="row"><span>Reparaturen / Fremdfirma</span><span class="neg">' + sgn(-L.rep) + '</span></div>';
      h += '<div class="row"><b>Netto Strecke</b><b class="' + (net >= 0 ? 'pos' : 'neg') + '">' + sgn(net) + '</b></div>';
      if (!RO) {
        if (L.fault) h += '<p class="neg"><b>⚠ Störung (' + DIFF[L.fault.diff].n + ')</b> – Züge fahren langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen. Klicke das rote ! auf der Strecke.</p>';
        h += '<div class="btns">';
        TRAINS.forEach((d, ti) => {
          h += '<button data-act="buy" data-arg="' + L.id + ':' + ti + '" ' + (S.money < d.cost ? 'disabled' : '') + '>' + d.n + ' kaufen (' + fmt(d.cost) + ') · Miete ' + Math.round(d.rent * 100) + ' %</button>';
        });
        h += '<button data-act="care" data-arg="' + L.id + '" ' + (S.money < care || L.cond >= 95 ? 'disabled' : '') + '>Pflege durch Fremdfirma (' + fmt(care) + ')</button></div>';
      }
      h += '<b>Eigene Züge (' + own.length + ')</b>';
      if (!own.length) h += '<div class="mut">' + (RO ? 'Keine.' : 'Noch keiner. Vermiete Züge, um zusätzlich Geld zu verdienen.') + '</div>';
      own.forEach((t: any, i: number) => {
        const n = t.earned - t.cost;
        h += '<div class="train"><div class="row"><span>' + tdef(t).n + ' #' + (i + 1) + ' <span class="mut">(' + t.trips + ' Fahrten)</span></span><b class="' + (n >= 0 ? 'pos' : 'neg') + '">' + sgn(n) + '</b></div>' +
          '<div class="mut">Einnahmen ' + sgn(t.earned) + ' · Wartung ' + sgn(-t.cost) + '</div></div>';
      });
      return h;
    }
    const own = S.trains.filter((t: any) => t.own);
    const inF = S.lines.reduce((a: number, l: any) => a + l.inF, 0), inO = S.lines.reduce((a: number, l: any) => a + l.inO, 0);
    const out = S.lines.reduce((a: number, l: any) => a + l.up + l.rep, 0) + own.reduce((a: number, t: any) => a + t.cost, 0);
    let h = '<h3>' + (RO ? 'Unternehmen' : 'Dein Unternehmen') + '</h3>';
    h += '<div class="row"><span>Strecken</span><b>' + S.lines.length + '</b></div>';
    h += '<div class="row"><span>Eigene Züge</span><b>' + own.length + '</b></div>';
    h += '<div class="row"><span>Trassenentgelt gesamt</span><span class="pos">' + sgn(inF) + '</span></div>';
    h += '<div class="row"><span>Mieteinnahmen gesamt</span><span class="pos">' + sgn(inO) + '</span></div>';
    h += '<div class="row"><span>Kosten gesamt</span><span class="neg">' + sgn(-out) + '</span></div>';
    h += '<div class="row"><b>Betriebsergebnis</b><b class="' + (inF + inO - out >= 0 ? 'pos' : 'neg') + '">' + sgn(inF + inO - out) + '</b></div>';
    h += '<h3 style="margin-top:16px">Können (Eigenleistung)</h3>';
    DIFF.forEach((d, i) => {
      const u = unlocked(i);
      h += '<div class="row"><span><span class="tag" style="background:' + d.col + '">' + d.n + '</span> ' + (u ? '' : '🔒') + '</span><span>' + S.skill[i] + ' erledigt</span></div>';
      h += '<div class="mut">' + d.task + (u || RO ? '' : ' · frei nach ' + CFG.unlockNeed + '× ' + DIFF[i - 1].n) + '</div>';
    });
    h += '<h3 style="margin-top:16px">Schwierigkeit</h3>';
    if (RO) {
      h += '<div class="row"><span>' + MODES[S.mode ?? 0].n + '</span><span class="mut">Störung ca. alle ' + MODES[S.mode ?? 0].min + ' Min.</span></div>';
    } else {
      h += '<div class="modes">' + MODES.map((m, i) => '<button data-act="mode" data-arg="' + i + '" class="sm' + (S.mode === i ? ' on' : '') + '">' + m.n + '</button>').join('') + '</div>';
      h += '<div class="mut">Höchstens eine Störung ca. alle ' + MODES[S.mode].min + ' Minuten aktiver Spielzeit. Je höher, desto öfter und härter.</div>';
    }
    if (RO) {
      h += '<p class="mut" style="margin-top:14px">Du siehst das Netz nur zum Ansehen. Strecke anklicken = Details.</p>';
    } else {
      h += '<p class="mut" style="margin-top:14px">Stadt anklicken, dann zweite Stadt anklicken = Strecke kaufen. Strecke anklicken = Details & Züge. Rotes ! = Störung. Mit jeder Verbindung schalten sich neue Städte frei.</p>';
      h += '<div class="btns"><button data-act="reset" class="sm">Spiel zurücksetzen</button></div>';
    }
    return h;
  };
  const updateHUD = () => {
    const m = $('#money'); m.textContent = fmt(S.money); m.classList.toggle('neg', S.money < 0);
    $('#day').textContent = 'Tag ' + (Math.floor(S.time / CFG.daySec) + 1);
    root.querySelectorAll('#speeds button').forEach((b: any) => b.classList.toggle('on', +b.dataset.arg === S.speed));
    const h = panelHTML();
    if (h !== lastPanel) { $('#panel').innerHTML = h; lastPanel = h; }
    tutorial();
  };

  /* ---------- Tutorial ---------- */
  const TUT = [
    { t: 'Willkommen! Klicke auf eine Stadt und danach auf eine zweite, um eine Strecke zu kaufen.', ok: () => S.lines.length > 0 },
    { t: 'Gebaut! Fremdzüge nutzen deine Strecke und zahlen Trassenentgelt. Klicke die Strecke an für Details.', ok: () => S.openedLine },
    { t: 'Kaufe jetzt einen eigenen Zug und vermiete ihn (Button rechts).', ok: () => S.trains.some((t: any) => t.own) },
    { t: 'Verschleiß verursacht Störungen. Sobald ein rotes „!“ erscheint: anklicken und Aufgabe wählen.', ok: () => S.faultsFixed > 0 },
    { t: 'Stark! Erweitere dein Netz – neue Verbindungen schalten neue Städte frei. Behalte Zustand & Kosten im Blick.', ok: () => S.tutT > 14, reset: true },
  ];
  let tutStart = 0;
  const tutorial = () => {
    const el = $('#hint');
    if (RO || S.tut >= TUT.length) { el.style.display = 'none'; return; }
    const s: any = TUT[S.tut];
    if (s.reset && !tutStart) tutStart = S.tutT;
    el.style.display = 'block'; el.textContent = s.t;
    if (s.reset ? (S.tutT - tutStart > 12) : s.ok()) { S.tut++; tutStart = 0; save(); }
  };

  /* ---------- Modal: Stoerung & Mini-Aufgaben ---------- */
  const openFault = (id: number) => { modal = { kind: 'fault', line: id }; renderModal(); };
  const closeModal = () => { modal = null; $('#modal').style.display = 'none'; };
  const renderModal = () => {
    const box = $('#mcard'); $('#modal').style.display = 'flex';
    const L = S.lines[modal.line];
    if (modal.kind === 'fault') {
      const f = L.fault, d = DIFF[f.diff], can = unlocked(f.diff);
      box.innerHTML = '<h2>Störung: ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h2>' +
        '<p><span class="tag" style="background:' + d.col + '">' + d.n + '</span> &nbsp;Aufgabe: <b>' + d.task + '</b><br>Auftragswert: <b>' + fmt(d.val) + '</b></p>' +
        '<p class="mut">Solange die Störung besteht, fahren die Züge auf dieser Strecke nur langsam und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen.</p>' +
        '<div class="opts">' +
        '<button data-act="firm">Fremdfirma beauftragen (−' + fmt(d.val) + ')</button>' +
        '<button data-act="self" ' + (can ? '' : 'disabled') + '>Selbst erledigen – spart ' + fmt(d.val) + ' + Bonus ' + fmt(d.val * d.share) + ' (' + Math.round(d.share * 100) + ' %)</button>' +
        (can ? '' : '<div class="mut">🔒 Frei nach ' + CFG.unlockNeed + ' geschafften „' + DIFF[f.diff - 1].n + '“-Aufgaben (' + S.skill[f.diff - 1] + '/' + CFG.unlockNeed + ').</div>') +
        '<div class="mut">Fehlversuch: Fremdfirma muss nacharbeiten (−' + fmt(d.val * .5) + ').</div>' +
        '<button data-act="close">Später</button></div>';
      return;
    }
    const g = modal.mg, r = g.rounds[g.i];
    let h = '<h2>Nivellierlatte ablesen</h2><div class="mut">Ablesung ' + (g.i + 1) + ' / ' + g.rounds.length + ' · mind. ' + g.need + ' richtig · Toleranz ±' + READ_TOL_MM + ' mm</div>';
    h += '<p><b>Wo schneidet das Fadenkreuz die Latte?</b> Wert in Metern eintragen (z. B. 1,234).</p><div class="mut">Die Zahlen an der Latte sind Meter-Werte (2,0 = 2,0 m). Die Zahl gilt für die Linie direkt darunter, der Rest sind Zentimeter.</div>';
    h += '<div class="scope-circle">' + scopeSvg(r) + reticleSvg + '</div>';
    if (g.fb) {
      h += '<div class="fb ' + (g.fb.good ? 'good' : 'bad') + '"><b>' + (g.fb.good ? 'Richtig abgelesen!' : 'Daneben.') + '</b><br>Echter Wert: ' + r.target.toFixed(3).replace('.', ',') + ' m · Abweichung: ' + g.fb.diffMm + ' mm</div>';
      h += '<div class="opts"><button data-act="next">' + (g.i < g.rounds.length - 1 ? 'Nächste Ablesung' : 'Fertig') + '</button></div>';
    } else {
      h += '<div class="readrow"><input id="guess" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 1,234" /><button data-act="submit">Ablesen</button></div>';
    }
    h += '<div class="opts"><button data-act="close">Abbrechen (Störung bleibt)</button></div>';
    box.innerHTML = h;
    const inp = $('#guess'); if (inp) inp.focus();
  };

  /* ---- Nivellierlatte (E-Teilung), uebernommen aus dem Spiel "Nivellierlatte ablesen" ---- */
  const READ_TOL_MM = 5;
  const U_CM = 10, U_DM = U_CM * 10, U_M = U_DM * 10, HALF_W = 30, STAFF_W = HALF_W * 2, SPINE_W = 8;
  const ROD_MAX_M = 2.5, ROD_H = ROD_MAX_M * U_M, STADIA_FRACTION = 0.3;
  const reticleSvg = '<svg class="reticle" viewBox="0 0 100 100"><line x1="50" y1="0" x2="50" y2="100" stroke="#111418" stroke-width="0.8"/><line x1="0" y1="50" x2="100" y2="50" stroke="#111418" stroke-width="0.8"/><line x1="30" y1="20" x2="70" y2="20" stroke="#111418" stroke-width="0.6"/><line x1="30" y1="80" x2="70" y2="80" stroke="#111418" stroke-width="0.6"/></svg>';
  const rodInner = (() => {
    let o = '<rect x="0" y="0" width="' + STAFF_W + '" height="' + ROD_H + '" fill="#fff"/>';
    const rect = (x: number, y: number, w: number, h: number) => { o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#e8281e"/>'; };
    const dmCount = Math.round(ROD_MAX_M * 10);
    for (let dm = 0; dm < dmCount; dm++) {
      const top = dm * U_DM, left = dm % 2 === 0, px = left ? 0 : HALF_W;
      for (const cm of [0, 2, 4]) rect(px, top + cm * U_CM, HALF_W, U_CM);
      rect(left ? px : px + HALF_W - SPINE_W, top, SPINE_W, 5 * U_CM);
      for (const cm of [1, 3]) rect(px, top + 5 * U_CM + cm * U_CM, HALF_W, U_CM);
      o += '<line x1="0" y1="' + top + '" x2="' + STAFF_W + '" y2="' + top + '" stroke="#111418" stroke-width="0.8"/>';
      o += '<text x="' + ((left ? HALF_W : 0) + HALF_W / 2) + '" y="' + (top + U_DM * 0.75 + 12) + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="34" fill="#e8281e" textLength="26" lengthAdjust="spacingAndGlyphs">' + ((dmCount - 1 - dm) / 10).toFixed(1).replace('.', ',') + '</text>';
    }
    o += '<line x1="0" y1="0" x2="0" y2="' + ROD_H + '" stroke="#111418" stroke-width="0.8"/><line x1="' + STAFF_W + '" y1="0" x2="' + STAFF_W + '" y2="' + ROD_H + '" stroke="#111418" stroke-width="0.8"/>';
    return o;
  })();
  const scopeSvg = (r: any) => {
    const span = (r.dist / (2 * STADIA_FRACTION)) * (U_M / 100);
    const cy = (ROD_MAX_M - r.target) * U_M;
    return '<svg viewBox="' + (STAFF_W / 2 - span / 2) + ' ' + (cy - span / 2) + ' ' + span + ' ' + span + '" class="scope">' + rodInner + '</svg>';
  };
  const genRound = (d: number): any => {
    const dist = DIFF[d].dist, halfSpanM = (dist / (2 * STADIA_FRACTION)) * (U_M / 100) / 2 / U_M;
    const low = halfSpanM, high = ROD_MAX_M - halfSpanM;
    let bl = Math.max(low, 1.2), bh = Math.min(high, 1.7);
    if (bl > bh) { bl = low; bh = high; }
    const band = Math.random() < 0.8, lo = band ? bl : low, hi = band ? bh : high;
    return { target: Math.round((lo + Math.random() * (hi - lo)) * 1000) / 1000, dist };
  };
  const startSelf = () => {
    const L = S.lines[modal.line], d = L.fault.diff;
    modal = { kind: 'mg', line: modal.line, mg: { d, i: 0, ok: 0, need: DIFF[d].need, fb: null, rounds: Array.from({ length: DIFF[d].reads }, () => genRound(d)) } };
    renderModal();
  };
  const submitReading = () => {
    const g = modal.mg; if (g.fb) return;
    const inp = $('#guess'); if (!inp) return;
    const v = parseFloat(String(inp.value).replace(',', '.').trim());
    if (isNaN(v)) return;
    const diffMm = Math.round(Math.abs(v - g.rounds[g.i].target) * 1000), good = diffMm <= READ_TOL_MM;
    if (good) g.ok++;
    g.fb = { good, diffMm };
    renderModal();
  };
  const nextReading = () => {
    const g = modal.mg; if (!g.fb) return;
    if (g.i < g.rounds.length - 1) { g.i++; g.fb = null; renderModal(); }
    else {
      resolveFault(S.lines[modal.line], g.ok >= g.need ? 'self-ok' : 'self-fail');
      closeModal(); save();
    }
  };

  /* ---------- Klick-Aktionen ---------- */
  const onActionDown = (e: PointerEvent) => {
    const b = (e.target as HTMLElement).closest('[data-act]') as HTMLButtonElement | null;
    if (!b || b.disabled) return;
    const a = b.dataset['act'], arg = b.dataset['arg'];
    if (RO) return;
    if (a === 'speed') S.speed = +arg!;
    else if (a === 'mode') { S.mode = +arg!; S.faultIn = Math.min(S.faultIn, modeInterval(S.mode)); save(); }
    else if (a === 'buy') { const [lid, ty] = arg!.split(':'); buyTrain(+lid, ty === undefined ? 1 : +ty); }
    else if (a === 'care') careLine(+arg!);
    else if (a === 'firm') { resolveFault(S.lines[modal.line], 'firm'); closeModal(); save(); }
    else if (a === 'self') startSelf();
    else if (a === 'submit') submitReading();
    else if (a === 'next') nextReading();
    else if (a === 'close') closeModal();
    else if (a === 'reset') { if (confirm('Spielstand wirklich löschen?')) { opts.onReset?.(); fresh(); sel = { city: null, line: null }; tutStart = 0; } }
  };
  root.addEventListener('pointerdown', onActionDown);
  const onEnter = (e: KeyboardEvent) => { if (e.key === 'Enter' && modal && modal.kind === 'mg') { e.preventDefault(); if (modal.mg.fb) nextReading(); else submitReading(); } };
  root.addEventListener('keydown', onEnter);

  /* ---------- Toast / Speichern ---------- */
  let toastT: any;
  const toast = (t: string) => { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2600); };
  const serialize = () => ({
    money: S.money, time: S.time, vis: S.vis, skill: S.skill, mode: S.mode, faultIn: S.faultIn, tut: S.tut, faultsFixed: S.faultsFixed, passes: S.passes,
    anyFault: S.anyFault, openedLine: S.openedLine, nextId: S.nextId,
    lines: S.lines.map((l: any) => ({ a: l.a, b: l.b, cond: l.cond, inF: l.inF, inO: l.inO, up: l.up, rep: l.rep, fault: l.fault, color: l.color })),
    own: S.trains.filter((t: any) => t.own),
  });
  const save = () => { if (RO || !alive) return; opts.onSave(serialize(), S.money); };
  const load = (d: any) => {
    try {
      if (!d || !Array.isArray(d.lines)) return false;
      fresh();
      Object.assign(S, { money: d.money, time: d.time, vis: d.vis, skill: d.skill, mode: d.mode ?? 0, faultIn: d.faultIn ?? modeInterval(d.mode ?? 0), tut: d.tut, faultsFixed: d.faultsFixed, passes: d.passes, anyFault: d.anyFault, openedLine: d.openedLine, nextId: d.nextId });
      d.lines.forEach((o: any) => { const L: any = addLine(o.a, o.b); Object.assign(L, { cond: o.cond, inF: o.inF, inO: o.inO, up: o.up, rep: o.rep, fault: o.fault, color: o.color }); });
      S.trains = d.own || [];
      return true;
    } catch { return false; }
  };

  /* ---------- Start ---------- */
  layout();
  if (!load(opts.state)) fresh();
  const saveTimer = RO ? 0 : window.setInterval(save, 10000);
  const onHide = () => { if (document.visibilityState === 'hidden') save(); };
  document.addEventListener('visibilitychange', onHide);
  let last = performance.now();
  const loop = (now: number) => {
    if (!alive) return;
    const dt = (now - last) / 1000; last = now;
    update(Math.min(dt, .25)); draw(); updateHUD();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    destroy: () => {
      save();
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(saveTimer);
      clearTimeout(toastT);
      ro.disconnect();
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerdown', onCanvasDown);
      root.removeEventListener('pointerdown', onActionDown);
      root.removeEventListener('keydown', onEnter);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
    },
  };
}
