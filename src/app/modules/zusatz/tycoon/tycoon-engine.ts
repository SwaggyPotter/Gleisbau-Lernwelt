/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gleisbau Tycoon -- Spiel-Engine (Canvas). Portiert aus der Einzeldatei-Demo.
 * Haengt an einem Wurzel-Element (siehe tycoon.page.html), speichert ueber Callbacks
 * (Server statt localStorage) und kennt einen Nur-Lesen-Modus fuer fremde Netze.
 */

import type { TycoonWeltDaten } from './tycoon-3d';
import { bezirkeVon, bezirkRahmen, CITIES, KARTE_H, KARTE_W, spielerFarbe, zeichneKarte } from './tycoon-karte';
import { AUSRUESTUNG, KLASSEN, LEVEL_XP, levelAus, SKINS, ZUEGE } from './tycoon-zuege';

export interface TycoonOptions {
  /** Gespeicherter Spielstand (JSON vom Server) oder null fuer ein neues Spiel. */
  state: any | null;
  /** Fremdes Netz ansehen: keine Aktionen, keine Wirtschaft. */
  readOnly: boolean;
  onSave: (data: any, money: number) => void;
  onReset?: () => void;
  /** Zeigt (el gesetzt) bzw. entfernt (el null) die 3D-Vorschau des Lok-Typs typ (Index in TRAINS). */
  onVorschau?: (el: HTMLElement | null, typ: number) => void;
  /** Bezirk kaufen/uebernehmen (Server); die Seite meldet Erfolg ueber handle.bezahlt() zurueck. */
  onBezirk?: (stadt: number, bezirk: number, basis: number) => void;
}

export interface TycoonHandle {
  destroy: () => void;
  /** Lesezugriff fuer die 3D-Ansicht (tycoon-3d.ts). */
  welt: () => TycoonWeltDaten;
  /** Gemeinsame Welt vom Server (Bezirke, Aktivitaet je Stadt). */
  setzeWelt: (w: any) => void;
  /** Bezirkskauf war erfolgreich: Preis abziehen. */
  bezahlt: (preis: number, text: string) => void;
  /** Geld gutschreiben (z. B. Entschaedigung fuer einen uebernommenen Bezirk). */
  gutschrift: (betrag: number, text: string) => void;
  meldung: (text: string) => void;
  /** Duell-Belohnung gutschreiben (Erfahrung + Pokale). */
  belohnung: (xp: number, pokale: number, text: string) => void;
  /** Klick an einer Stelle der 2D-Welt (KARTE_W x KARTE_H), z. B. aus der 3D-Ansicht. */
  klickWelt: (x: number, y: number) => void;
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
  /** Stoerungsarten: Gleislage wird per Nivellement geprueft, alles andere mit Fachfragen aus dem Themenquiz der Lernwelt. */
  const FEHLER_ARTEN: { n: string; thema: string | null; themaN: string }[] = [
    { n: 'Gleislagefehler (Höhe)', thema: null, themaN: 'Nivellement' },
    { n: 'Schienenfehler', thema: 'schiene', themaN: 'Schiene' },
    { n: 'Schwellenschaden', thema: 'schwellen', themaN: 'Schwellen' },
    { n: 'Verschmutzte Bettung', thema: 'bettung', themaN: 'Bettung' },
    { n: 'Spurweitenfehler', thema: 'spurweite', themaN: 'Spurweite' },
    { n: 'Lockere Kleineisen', thema: 'kleineisen', themaN: 'Kleineisen' },
  ];
  /** Fragen je Schwierigkeit (Anzahl, davon richtig). */
  const QUIZ_N = [3, 3, 4, 5], QUIZ_NEED = [2, 3, 3, 4];
  const INSPEKTION_THEMEN = [
    ['schiene', 'Schiene'], ['schwellen', 'Schwellen'], ['bettung', 'Bettung'], ['spurweite', 'Spurweite'], ['kleineisen', 'Kleineisen'],
    ['messmittel', 'Messmittel'], ['handwerkzeuge', 'Handwerkzeuge'], ['kleingeraete', 'Kleingeräte'], ['arbeitssicherheit', 'Arbeitssicherheit'],
  ];
  const modeInterval = (m: number) => MODES[m].min * 60 * (1 + Math.random() * 0.2);
  // Staedte an echten Koordinaten: siehe tycoon-karte.ts.
  const START_CITY = 0;
  const DIFF = [
    // Alle Stoerungen werden mit dem Spiel "Nivellierlatte ablesen" behoben. Mit der Stufe wachsen
    // Zahl der Ablesungen, geforderte Treffer und Lattenentfernung (= weiter Ausschnitt, schwerer).
    { n: 'Leicht', task: 'Nivellierlatte ablesen (2 Ablesungen, 1 richtig)', val: 200, share: .05, col: '#4caf7d', reads: 2, need: 1, dist: 12 },
    { n: 'Mittel', task: 'Nivellierlatte ablesen (3 Ablesungen, 2 richtig)', val: 600, share: .15, col: '#d9a520', reads: 3, need: 2, dist: 16 },
    { n: 'Schwer', task: 'Nivellierlatte ablesen (3 Ablesungen, 3 richtig)', val: 1500, share: .30, col: '#e07a3a', reads: 3, need: 3, dist: 20 },
    { n: 'Experte', task: 'Nivellierlatte ablesen (4 Ablesungen, 3 richtig)', val: 4000, share: .50, col: '#d64545', reads: 4, need: 3, dist: 24 },
  ];
  /** Zuege, Streckenklassen und Level: siehe tycoon-zuege.ts (alte Loks billig, aber wenig Miete -- Tims Spielidee). */
  const TRAINS = ZUEGE;
  const tdef = (t: any) => TRAINS[t.type ?? 1] || TRAINS[1];
  const klasse = (L: any) => KLASSEN[L.cls ?? 0] || KLASSEN[0];
  /** Tatsaechliche Geschwindigkeit: Zug und Strecke begrenzen; Fremdzuege fahren hoechstens 110 km/h. */
  const vKmh = (t: any, L: any) => Math.min(t.own ? tdef(t).kmh : 110, klasse(L).kmh);
  /** 120 km/h entsprechen CFG.trainSpeed Welteinheiten pro Sekunde. */
  const pxs = (kmh: number) => CFG.trainSpeed * kmh / 120;
  const level = () => levelAus(S.xp || 0);
  const ausbauKosten = (L: any) => {
    const n = KLASSEN[(L.cls ?? 0) + 1];
    return n ? Math.round(L.len * CFG.lineCostPerUnit * (n.bau - klasse(L).bau) * (hat('umbauzug') ? 0.8 : 1) / 10) * 10 : 0;
  };
  const pct = (f: number) => Math.round(f * 100) + ' %';
  /** Gekaufte Ausruestung vorhanden? */
  const hat = (id: string) => (S.ausr || []).includes(id);
  const skinFarbe = () => SKINS.find((k) => k.id === S.skin)?.farbe ?? null;
  /** Wartungsstau kostet nur Einnahmen: Zustand 100 % = volle Einnahmen, 0 % = 40 % (mit Werkstatt 70 %). */
  const condFaktor = (L: any) => 1 - (1 - L.cond / 100) * 0.6 * (hat('werkstatt') ? 0.5 : 1);
  /** Gemeinsame Welt vom Server (null = noch nicht geladen oder Ansehen-Modus). */
  let welt: any = null;
  /** Im Stadt-Panel ausgewaehlter Bezirk. */
  let bzWahl: { c: number; i: number } | null = null;
  const meineId = () => welt?.ich?.id ?? null;
  const bezirkVon = (c: number, b: number) => (welt?.bezirke || []).find((x: any) => x.stadt === c && x.bezirk === b);
  const istMein = (x: any) => !!x && x.ownerId === meineId();
  const istClan = (x: any) => !!x && !!welt?.ich?.clanId && x.clanId === welt.ich.clanId && !istMein(x);
  const angeschlossen = (c: number) => S.lines.some((l: any) => l.a === c || l.b === c);
  /** Darf in Stadt c gebaut werden? Eigener oder Clan-Bezirk, oder schon angeschlossen (bzw. Welt nicht geladen). */
  const praesenz = (c: number) => !welt || angeschlossen(c) || (welt.bezirke || []).some((x: any) => x.stadt === c && (istMein(x) || istClan(x)));
  /** Einnahmen der eigenen Bezirke in Stadt c pro Sekunde (nur wenn angeschlossen; Stoerung dort halbiert). */
  const bezirkRate = (c: number) => {
    if (!welt || !angeschlossen(c)) return 0;
    const meine = (welt.bezirke || []).filter((x: any) => x.stadt === c && istMein(x));
    const stoerung = S.lines.some((l: any) => l.fault && (l.a === c || l.b === c));
    return meine.reduce((a: number, x: any) => a + x.basis * 0.0015, 0) * (stoerung ? 0.5 : 1);
  };
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
      skill: [0, 0, 0, 0], xp: 0, pokale: 0, skins: ['standard'], skin: 'standard', ausr: [], mode: 0, faultIn: modeInterval(0), tut: 0, tutT: 0, faultsFixed: 0, passes: 0, anyFault: false, openedLine: false, nextId: 1 };
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
    const o1 = (rnd() * 2 - 1) * L * .18, o2 = (rnd() * 2 - 1) * L * .18;
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

  /* ---------- Erfahrung / Level ---------- */
  const addXp = (n: number) => {
    const vor = level();
    S.xp = (S.xp || 0) + n;
    const nach = level();
    if (nach <= vor) return;
    const neu = [...TRAINS.filter((z) => z.lvl === nach).map((z) => z.n), ...KLASSEN.filter((k) => k.lvl === nach).map((k) => k.n)];
    toast('⭐ Level ' + nach + '!' + (neu.length ? ' Neu: ' + neu.join(', ') : ''), 5000);
  };

  /* ---------- Spiel-Aktionen ---------- */
  const addLine = (a: number, b: number) => {
    const g = makeGeo(a, b);
    const L = { id: S.lines.length, a, b, pts: g.pts, cum: g.cum, len: g.len, color: LCOL[S.lines.length % LCOL.length], cls: 0,
      cond: 100, inF: 0, inO: 0, up: 0, rep: 0, fault: null, spawnT: rand(1.5, 4) };
    S.lines.push(L);
    return L;
  };
  /** true = gebaut; Zahl = in dieser Stadt fehlt ein Bezirk; false = sonst nicht moeglich. */
  const tryBuild = (a: number, b: number): boolean | number => {
    if (lineExists(a, b)) { toast('Diese Strecke gehört dir schon.'); return false; }
    const fehlt = [a, b].find((c) => !praesenz(c));
    if (fehlt !== undefined) { toast('In ' + CITIES[fehlt].n + ' brauchst du zuerst einen Bezirk – unten im Panel kaufen.', 4000); return fehlt; }
    const g = makeGeo(a, b), cost = lineCost(g);
    if (S.money < cost) { toast('Zu wenig Guthaben (' + fmt(cost) + ' nötig).'); return false; }
    S.money -= cost;
    addLine(a, b);
    revealNear(a, 2); revealNear(b, 2);
    addXp(15);
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
    const def = TRAINS[type], L = S.lines[id]; if (!def || !L) return;
    if (level() < def.lvl) { toast('Erst ab Level ' + def.lvl + '.'); return; }
    if (def.el && !klasse(L).el) { toast('Diese Strecke hat keine Oberleitung – erst ausbauen.'); return; }
    if (S.money < def.cost) { toast('Zu wenig Guthaben.'); return; }
    S.money -= def.cost;
    addXp(5);
    S.trains.push({ id: S.nextId++, line: id, own: true, type, dir: 1, s: 0, earned: 0, cost: 0, trips: 0 });
    toast(def.n + ' gekauft (−' + fmt(def.cost) + ')');
    save();
  };
  const upgradeLine = (id: number) => {
    const L = S.lines[id], n = KLASSEN[(L?.cls ?? 0) + 1];
    if (!L || !n) return;
    if (level() < n.lvl) { toast(n.n + ' erst ab Level ' + n.lvl + '.'); return; }
    const c = ausbauKosten(L);
    if (S.money < c) { toast('Zu wenig Guthaben (' + fmt(c) + ' nötig).'); return; }
    S.money -= c; L.rep += c; L.cls = (L.cls ?? 0) + 1; L.cond = 100;
    addXp(10 * L.cls);
    toast(CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + ' ausgebaut: ' + n.n + ' (' + n.kmh + ' km/h, −' + fmt(c) + ')');
    save();
  };
  /** Bezahlen mit Geld oder Pokalen; false, wenn es nicht reicht oder gesperrt ist. */
  const bezahle = (x: { lvl: number; preis: number; pokale: number }) => {
    if (level() < x.lvl) { toast('Erst ab Level ' + x.lvl + '.'); return false; }
    if (x.pokale) {
      if ((S.pokale || 0) < x.pokale) { toast('Zu wenig Pokale – gewinne Duelle!'); return false; }
      S.pokale -= x.pokale;
    } else {
      if (S.money < x.preis) { toast('Zu wenig Guthaben.'); return false; }
      S.money -= x.preis;
    }
    return true;
  };
  const kaufeSkin = (id: string) => {
    const k = SKINS.find((x) => x.id === id);
    if (!k) return;
    S.skins = S.skins || ['standard'];
    if (!S.skins.includes(id)) { if (!bezahle(k)) return; S.skins.push(id); toast('Lackierung „' + k.n + '“ gekauft.'); }
    S.skin = id;
    save();
  };
  const kaufeAusruestung = (id: string) => {
    const a = AUSRUESTUNG.find((x) => x.id === id);
    if (!a || hat(id) || !bezahle(a)) return;
    S.ausr = [...(S.ausr || []), id];
    addXp(10);
    toast(a.n + ' gekauft: ' + a.text);
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
    L.fault = { t: rand(.25, .75), diff, art: ri(0, FEHLER_ARTEN.length - 1) };
    S.anyFault = true;
    S.faultIn = modeInterval(S.mode) * (hat('schleifzug') ? 1.3 : 1);
    toast('⚠ ' + FEHLER_ARTEN[L.fault.art].n + ' auf ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + ' (' + DIFF[diff].n + ')');
  };
  const resolveFault = (L: any, how: string) => {
    const d = DIFF[L.fault.diff];
    // Fehlversuch kostet nichts: Stoerung bleibt einfach bestehen.
    if (how === 'self-fail') { addXp(3); toast('Nicht geschafft – die Störung bleibt. Versuch es nochmal oder beauftrage die Fremdfirma.', 4000); return; }
    if (how === 'firm' && S.money < d.val) { toast('Zu wenig Guthaben für die Fremdfirma.'); return; }
    if (how === 'firm') { S.money -= d.val; L.rep += d.val; L.cond = Math.min(100, L.cond + 10); addXp(5); toast('Fremdfirma erledigt die Störung (−' + fmt(d.val) + ')'); }
    if (how === 'self-ok') { const b = d.val * d.share * (hat('messzug') ? 1.5 : 1); S.money += b; L.cond = Math.min(100, L.cond + 20); S.skill[L.fault.diff]++; addXp(20 + 10 * L.fault.diff); toast('Selbst erledigt! Fremdkosten gespart, Bonus +' + fmt(b)); }
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
        t.s += t.dir * pxs(vKmh(t, L)) * dtReal;
        if (t.s >= L.len || t.s <= 0) { t.s = Math.max(0, Math.min(L.len, t.s)); t.dir *= -1; }
      }
      return;
    }
    if (modal) return;
    const dt = Math.min(dtReal, .1) * S.speed;
    if (!dt) return;
    S.time += dt;
    for (const L of S.lines) {
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
    // Bezirke bringen laufend Geld (nur angeschlossene Staedte; Stoerung dort halbiert).
    if (welt) {
      let r = 0;
      new Set<number>((welt.bezirke || []).filter((x: any) => istMein(x)).map((x: any) => x.stadt as number)).forEach((c) => (r += bezirkRate(c)));
      if (r > 0) { S.money += r * dt; S.bezirkSumme = (S.bezirkSumme || 0) + r * dt; }
    }
    for (const t of S.trains.slice()) {
      const L = S.lines[t.line];
      t.s += t.dir * pxs(vKmh(t, L)) * (L.fault ? CFG.faultSpeed : 1) * dt;
      if (t.s >= L.len || t.s <= 0) { t.s = Math.max(0, Math.min(L.len, t.s)); arrive(t, L); }
    }
    for (let i = popups.length - 1; i >= 0; i--) { popups[i].age += dtReal; if (popups[i].age > 1.4) popups.splice(i, 1); }
  };
  const arrive = (t: any, L: any) => {
    const p = posAt(L, t.s);
    S.passes++;
    L.cond = Math.max(0, L.cond - CFG.wearPerPass * klasse(L).wear * (t.own ? tdef(t).wear : 1.4) * (hat('stopfmaschine') ? 0.75 : 1));
    t.trips++;
    if (t.own) {
      // Keine Wartungskosten mehr: Wartungsstau und Stoerung senken nur die Einnahmen.
      const td = tdef(t), voll = L.len * CFG.ownRent * td.rent * (1 + (hat('fahrgastinfo') ? 0.1 : 0) + (hat('schaufel') ? 0.05 : 0));
      const inc = voll * condFaktor(L) * (L.fault ? CFG.faultIncome : 1);
      S.money += inc; L.inO += inc; t.earned += inc; L.verlust = (L.verlust || 0) + voll - inc;
      addXp(1);
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(inc) + ' €', col: '#e07a00', age: 0 });
      t.dir *= -1;
    } else {
      const voll = L.len * CFG.foreignFee * klasse(L).entgelt, fee = voll * condFaktor(L) * (L.fault ? CFG.faultIncome : 1);
      S.money += fee; L.inF += fee; L.verlust = (L.verlust || 0) + voll - fee;
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(fee) + ' €', col: '#2e8b57', age: 0 });
      S.trains.splice(S.trains.indexOf(t), 1);
    }
  };

  /* ---------- Layout / Eingabe ---------- */
  const layout = () => {
    W = root.clientWidth; H = root.clientHeight; dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const narrow = W < 700, aw = narrow ? W : W - 300, ah = narrow ? H - HUD_H - Math.round(H * .38) : H - HUD_H;
    k = Math.max(0.1, Math.min(aw / KARTE_W, ah / KARTE_H) * .94); ox = (aw - KARTE_W * k) / 2; oy = HUD_H + (ah - KARTE_H * k) / 2;
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
  /** fest = Klick aus der 3D-Ansicht: feste Trefferradien in Weltkoordinaten statt vom 2D-Zoom abhaengiger. */
  const hit = (p: any, fest = false) => {
    const r: any = { city: null, line: null, fault: null };
    const faultR = fest ? 22 : 18 / Math.min(1, k), lineR = fest ? 16 : 9 / Math.min(1, k);
    if (!RO) for (const L of S.lines) if (L.fault) { const q = posAt(L, L.len * L.fault.t); if (dist(p, q) < faultR) { r.fault = L.id; return r; } }
    for (let i = 0; i < CITIES.length; i++) if (S.vis[i] && dist(p, CITIES[i]) < 20) { r.city = i; return r; }
    let best = 1e9;
    for (const L of S.lines) {
      for (let i = 1; i < L.pts.length; i++) { const d = segDist(p, L.pts[i - 1], L.pts[i]); if (d < lineR && d < best) { best = d; r.line = L.id; } }
    }
    return r;
  };
  const onMove = (e: PointerEvent) => {
    hover = hit(toWorld(e));
    cv.style.cursor = (hover.city !== null || hover.line !== null || hover.fault !== null) ? 'pointer' : 'default';
  };
  const onCanvasDown = (e: PointerEvent) => klick(toWorld(e));
  const klick = (p: { x: number; y: number }, fest = false) => {
    if (modal) return;
    const h = hit(p, fest);
    if (h.fault !== null) { openFault(h.fault); return; }
    if (RO) {
      if (h.line !== null) { sel.line = h.line; } else if (h.city === null) { sel.line = null; }
      return;
    }
    if (h.city !== null) {
      if (sel.city === null) { sel.city = h.city; sel.line = null; }
      else if (sel.city === h.city) { sel.city = null; }
      else { const r = tryBuild(sel.city, h.city); if (r === true) sel.city = h.city; else if (typeof r === 'number') sel.city = r; }
      return;
    }
    if (h.line !== null) { sel.line = h.line; sel.city = null; S.openedLine = true; return; }
    sel.city = null; sel.line = null;
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { sel.city = null; sel.line = null; if (modal && modal.kind !== 'mg') closeModal(); } };
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
    ctx.fillStyle = '#bcd6e6'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k);
    zeichneKarte(ctx, undefined, 1.5 / k);
    // Stadtbezirke (echte Grenzen): Besitz farbig, freie nur als feine Linie.
    for (let i = 0; i < CITIES.length; i++) {
      if (!S.vis[i]) continue;
      bezirkeVon(i).forEach((b, j) => {
        if (!b.ringe.length) return;
        ctx.beginPath();
        b.ringe.forEach((r) => { ctx.moveTo(r[0], r[1]); for (let q = 2; q < r.length; q += 2) ctx.lineTo(r[q], r[q + 1]); ctx.closePath(); });
        const x = welt ? bezirkVon(i, j) : null;
        if (x) { ctx.fillStyle = x.clanFarbe || spielerFarbe(x.ownerId); ctx.globalAlpha = istMein(x) ? 0.75 : 0.5; ctx.fill(); ctx.globalAlpha = 1; }
        ctx.strokeStyle = 'rgba(70,70,60,.45)'; ctx.lineWidth = 0.6 / k; ctx.stroke();
      });
    }
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
        ctx.fillStyle = t.own ? (skinFarbe() ?? (i === 0 ? tdef(t).col : tdef(t).col2)) : (i === 0 ? '#2f3a46' : '#5d6b7a');
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
      if (welt) {
        const bz = bezirkeVon(i), st = (Math.PI * 2) / bz.length;
        bz.forEach((b, j) => {
          const x = bezirkVon(i, j);
          if (!x || b.ringe.length) return;   // echte Grenzen sind oben schon gezeichnet
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.arc(c.x, c.y, 22, j * st - Math.PI / 2, (j + 1) * st - Math.PI / 2); ctx.closePath();
          ctx.fillStyle = x.clanFarbe || spielerFarbe(x.ownerId); ctx.globalAlpha = istMein(x) ? 0.85 : 0.55; ctx.fill(); ctx.globalAlpha = 1;
        });
      }
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
      const care = Math.round(L.len * CFG.careCostPerUnit / 10) * 10;
      let h = '<h3 style="color:' + L.color + '">' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h3>';
      h += '<div class="mut">Länge ca. ' + Math.round(L.len * .97) + ' km</div>';
      h += '<div class="row"><span>Ausbau</span><b>' + klasse(L).n + '</b></div><div class="mut">max. ' + klasse(L).kmh + ' km/h' + (klasse(L).el ? ' · Oberleitung' : ' · ohne Oberleitung') + '</div>';
      h += '<div class="row"><span>Zustand</span><b>' + Math.round(L.cond) + ' %</b></div>' + barHTML(L.cond, condCol(L.cond));
      h += '<div class="row"><span>Trassenentgelt (Fremdzüge)</span><span class="pos">' + sgn(L.inF) + '</span></div>';
      h += '<div class="row"><span>Miete eigene Züge</span><span class="pos">' + sgn(L.inO) + '</span></div>';
      h += '<div class="row"><b>Einnahmen Strecke</b><b class="pos">' + sgn(L.inF + L.inO) + '</b></div>';
      h += '<div class="row"><span>Entgangen (Wartungsstau/Störung)</span><span class="neg">' + sgn(-(L.verlust || 0)) + '</span></div>';
      h += '<div class="mut">Zustand ' + Math.round(L.cond) + ' % → ' + Math.round(condFaktor(L) * 100) + ' % der möglichen Einnahmen. Ausgegeben für Ausbau/Reparatur: ' + fmt(L.rep) + '</div>';
      if (!RO) {
        if (L.fault) h += '<p class="neg"><b>⚠ Störung (' + DIFF[L.fault.diff].n + ')</b> – Züge fahren langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen. Klicke das rote ! auf der Strecke.</p>';
        h += '<div class="btns"><button data-act="shop" data-arg="z:' + L.id + '">🛒 Zug kaufen …</button>' + ausbauKnopf(L) + inspektionKnopf(L);
        h += '<button data-act="care" data-arg="' + L.id + '" ' + (S.money < care || L.cond >= 95 ? 'disabled' : '') + '>Pflege durch Fremdfirma (' + fmt(care) + ')</button></div>';
      }
      h += '<b>Eigene Züge (' + own.length + ')</b>';
      if (!own.length) h += '<div class="mut">' + (RO ? 'Keine.' : 'Noch keiner. Vermiete Züge, um zusätzlich Geld zu verdienen.') + '</div>';
      own.forEach((t: any, i: number) => {
        const n = t.earned;
        h += '<div class="train"><div class="row"><span>' + tdef(t).n + ' #' + (i + 1) + ' <span class="mut">(' + vKmh(t, L) + ' km/h · ' + t.trips + ' Fahrten)</span></span><b class="' + (n >= 0 ? 'pos' : 'neg') + '">' + sgn(n) + '</b></div>' +

          '<button class="sm" data-act="show" data-arg="' + (t.type ?? 1) + '">3D ansehen</button></div>';
      });
      return h;
    }
    if (sel.city !== null) return stadtHTML(sel.city);
    const own = S.trains.filter((t: any) => t.own);
    const inF = S.lines.reduce((a: number, l: any) => a + l.inF, 0), inO = S.lines.reduce((a: number, l: any) => a + l.inO, 0);
    const verlust = S.lines.reduce((a: number, l: any) => a + (l.verlust || 0), 0), bez = S.bezirkSumme || 0;
    const meineBezirke = welt ? (welt.bezirke || []).filter((x: any) => istMein(x)).length : 0;
    let h = '<h3>' + (RO ? 'Unternehmen' : 'Dein Unternehmen') + '</h3>';
    const lv = level(), von = LEVEL_XP[lv - 1], bis = LEVEL_XP[lv];
    h += '<div class="row"><span>Level</span><b>' + lv + (bis === undefined ? ' (max.)' : '') + '</b></div>';
    if (bis !== undefined) h += barHTML(((S.xp || 0) - von) / (bis - von) * 100, '#7b61ff') + '<div class="mut">' + Math.floor(S.xp || 0) + ' / ' + bis + ' Erfahrung – Fahrten, neue Strecken, Ausbau und behobene Störungen bringen Punkte.</div>';
    h += '<div class="row"><span>Strecken</span><b>' + S.lines.length + '</b></div>';
    h += '<div class="row"><span>Eigene Züge</span><b>' + own.length + '</b></div>';
    h += '<div class="row"><span>Trassenentgelt gesamt</span><span class="pos">' + sgn(inF) + '</span></div>';
    h += '<div class="row"><span>Mieteinnahmen gesamt</span><span class="pos">' + sgn(inO) + '</span></div>';
    h += '<div class="row"><span>Bezirke (' + meineBezirke + ')</span><span class="pos">' + sgn(bez) + '</span></div>';
    h += '<div class="row"><b>Einnahmen gesamt</b><b class="pos">' + sgn(inF + inO + bez) + '</b></div>';
    h += '<div class="row"><span>Entgangen durch Wartungsstau/Störungen</span><span class="neg">' + sgn(-verlust) + '</span></div>';
    h += '<div class="mut">Laufende Kosten gibt es nicht – schlechter Zustand und Störungen senken nur die Einnahmen. Selbst beheben lohnt sich!</div>';
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
      h += '<p class="mut" style="margin-top:14px">Stadt anklicken = Bezirke kaufen. Danach zweite Stadt anklicken = Strecke bauen (dort brauchst du auch einen Bezirk). Strecke anklicken = Details & Züge. Rotes ! = Störung. Mit jeder Verbindung schalten sich neue Städte frei.</p>';
      h += '<div class="btns"><button data-act="reset" class="sm">Spiel zurücksetzen</button></div>';
    }
    return h;
  };
  const uhr = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  /** Eine Bezirkszeile mit Farbe, Besitzer und Kauf-/Uebernahme-Knopf. */
  const bezirkZeile = (c: number, i: number) => {
    const b = bezirkeVon(c)[i], x = bezirkVon(c, i), farbe = x ? (x.clanFarbe || spielerFarbe(x.ownerId)) : '#d9d4c8';
    let wer = 'frei', knopf = '';
    if (!x) knopf = RO ? '' : '<button class="sm" data-act="bez" data-arg="' + c + ':' + i + '" ' + (S.money < b.basis ? 'disabled' : '') + '>Kaufen · ' + fmt(b.basis) + '</button>';
    else if (istMein(x)) { wer = 'deiner'; knopf = '<span class="pos">✓</span>'; }
    else {
      wer = x.ownerName + (x.clanKuerzel ? ' [' + x.clanKuerzel + ']' : '');
      if (istClan(x)) knopf = '<span class="mut">Clan</span>';
      else if (new Date(x.geschuetztBis).getTime() > Date.now()) knopf = '<span class="mut">🛡 bis ' + uhr(x.geschuetztBis) + '</span>';
      else if (!RO) knopf = '<button class="sm" data-act="bez" data-arg="' + c + ':' + i + '" ' + (S.money < x.basis * 3 ? 'disabled' : '') + '>Übernehmen · ' + fmt(x.basis * 3) + '</button>';
    }
    const gew = !!bzWahl && bzWahl.c === c && bzWahl.i === i;
    return '<div class="bezirk' + (gew ? ' gewaehlt' : '') + '" data-act="bzwahl" data-arg="' + c + ':' + i + '"><span class="farbpunkt" style="background:' + farbe + '"></span>' +
      '<span class="bz-n">' + b.n + ' <span class="mut">· ' + wer + '</span></span>' + knopf + '</div>';
  };
  /** Bezirksplan der Stadt als SVG (echte Grenzen), Besitz farbig, gewaehlter Bezirk umrandet. */
  const bezirkPlan = (c: number) => {
    const rahmen = bezirkRahmen(c);
    if (!rahmen) return '';
    const pad = 1.5, w = rahmen.x1 - rahmen.x0 + 2 * pad, hh = rahmen.y1 - rahmen.y0 + 2 * pad, strich = Math.max(w, hh) / 260;
    const pfad = (r: number[]) => { let d = 'M' + r[0] + ' ' + r[1]; for (let q = 2; q < r.length; q += 2) d += 'L' + r[q] + ' ' + r[q + 1]; return d + 'Z'; };
    const teile = bezirkeVon(c).map((b, i) => {
      const x = welt ? bezirkVon(c, i) : null, gew = !!bzWahl && bzWahl.c === c && bzWahl.i === i;
      const fuell = x ? (x.clanFarbe || spielerFarbe(x.ownerId)) : '#f4f1ea', deck = x ? (istMein(x) ? 0.9 : 0.65) : 1;
      return { gew, svg: '<path d="' + b.ringe.map(pfad).join('') + '" fill="' + fuell + '" fill-opacity="' + deck + '" stroke="' + (gew ? '#e4572e' : '#5a5a52') +
        '" stroke-width="' + (gew ? strich * 3.5 : strich) + '" stroke-linejoin="round" data-act="bzwahl" data-arg="' + c + ':' + i + '"><title>' + b.n + '</title></path>' };
    });
    // Gewaehlten Bezirk zuletzt zeichnen, damit sein Rand oben liegt.
    const C = CITIES[c];
    return '<svg class="bz-plan" viewBox="' + (rahmen.x0 - pad) + ' ' + (rahmen.y0 - pad) + ' ' + w + ' ' + hh + '">' +
      teile.filter((t) => !t.gew).map((t) => t.svg).join('') + teile.filter((t) => t.gew).map((t) => t.svg).join('') +
      '<circle cx="' + C.x + '" cy="' + C.y + '" r="' + strich * 4 + '" fill="#23262b"/></svg>';
  };
  /** Panel einer Stadt: Aktivitaet anderer Spieler und Bezirke (kaufen / uebernehmen). */
  const stadtHTML = (c: number) => {
    const C = CITIES[c], info = (welt?.staedte || []).find((x: any) => x.stadt === c);
    let h = '<h3>' + C.n + (C.land ? ' <span class="mut">(' + C.land + ')</span>' : '') + '</h3>';
    h += '<div class="mut">' + (info ? '💡 ' + info.spieler + ' andere Spieler mit Strecken hier' + (info.aktiv ? ', ' + info.aktiv + ' gerade aktiv' : '') : 'Hier ist noch kein anderer Spieler.') + '</div>';
    if (!welt) {
      h += '<p class="mut">' + (RO ? '' : 'Bezirke werden geladen …') + '</p>';
    } else {
      const bz = bezirkeVon(c);
      if (bzWahl && bzWahl.c !== c) bzWahl = null;
      h += '<h3 style="margin-top:10px">Bezirke (' + bz.length + ')</h3>';
      const plan = bezirkPlan(c);
      if (plan) h += plan + '<div class="mut">Bezirk im Plan antippen.</div>';
      if (bzWahl) h += '<div class="bz-wahl">' + bezirkZeile(c, bzWahl.i) + '</div>';
      bz.forEach((_b, i) => { h += bezirkZeile(c, i); });
      if (plan) h += '<div class="mut">Bezirksgrenzen: © OpenStreetMap-Mitwirkende (ODbL)</div>';
      const meine = (welt.bezirke || []).filter((x: any) => x.stadt === c && istMein(x)).length;
      if (meine) {
        h += angeschlossen(c)
          ? '<div class="mut">Deine ' + meine + ' Bezirk(e) hier bringen ' + fmt(bezirkRate(c) * 60) + ' pro Minute' + (S.lines.some((l: any) => l.fault && (l.a === c || l.b === c)) ? ' – eine Störung an der Stadt halbiert das!' : '.') + '</div>'
          : '<div class="mut">Bezirke bringen Geld, sobald eine deiner Strecken hier endet.</div>';
      }
      h += '<div class="mut">Fremde Bezirke kosten das Dreifache; der bisherige Besitzer bekommt den Grundpreis erstattet. Frisch gekaufte Bezirke sind 2 Stunden geschützt.</div>';
    }
    if (!RO) h += '<p class="mut">Klicke eine zweite Stadt an, um eine Strecke zu bauen. In beiden Städten brauchst du einen eigenen Bezirk (oder einen deines Clans), außer die Stadt ist schon an dein Netz angeschlossen.</p>';
    h += '<div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
    return h;
  };
  /** Inspektion: freiwillige Arbeit an einer Strecke (Fachfragen), bringt Zustand, Geld und Erfahrung. */
  const inspektionKnopf = (L: any, kurz = false) => {
    if (L.cond >= 95) return '';
    const warten = Math.ceil((L.inspAb || 0) - S.time);
    return warten > 0 ? '<button disabled>' + (kurz ? 'in ' : '🔧 Inspektion wieder in ') + warten + ' s</button>'
      : '<button data-act="insp" data-arg="' + L.id + '">' + (kurz ? 'Starten · +' : '🔧 Inspektion (Fachfragen): +30 % Zustand, +') + fmt(inspektionsBonus(L)) + '</button>';
  };
  const inspektionsBonus = (L: any) => Math.round(L.len * 2 / 10) * 10;
  const inspektionErgebnis = (L: any, ok: boolean) => {
    if (ok) {
      const b = inspektionsBonus(L);
      L.cond = Math.min(100, L.cond + 30); S.money += b; L.inspAb = S.time + 120; addXp(10);
      toast('🔧 Inspektion bestanden: Zustand +30 %, +' + fmt(b));
    } else {
      L.inspAb = S.time + 30; addXp(2);
      toast('Inspektion nicht bestanden – in 30 Sekunden nochmal versuchen.');
    }
  };
  /** Liste aller Arbeiten: offene Stoerungen und faellige Inspektionen. */
  const arbeitHTML = () => {
    let h = '<h2>🛠 Arbeiten</h2><div class="mut">Selbst erledigen bringt Geld und Erfahrung, Fehlversuche kosten nichts. Störungen senken die Einnahmen der Strecke und der Bezirke in den angeschlossenen Städten.</div><div class="shop-liste">';
    let n = 0;
    S.lines.forEach((L: any) => {
      const name = CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n;
      if (L.fault) {
        n++;
        const art = FEHLER_ARTEN[L.fault.art ?? 0];
        h += '<div class="shop-zug"><div class="shop-text"><b>⚠ ' + art.n + '</b><div class="mut">' + name + ' · ' + DIFF[L.fault.diff].n + ' · ' + (art.thema ? 'Fachfragen „' + art.themaN + '“' : 'Nivellierlatte ablesen') + '</div></div><button data-act="afault" data-arg="' + L.id + '">Beheben</button></div>';
      }
      if (L.cond < 95) {
        n++;
        h += '<div class="shop-zug"><div class="shop-text"><b>🔧 Inspektion</b><div class="mut">' + name + ' · Zustand ' + Math.round(L.cond) + ' % · 3 Fachfragen, +30 % Zustand</div></div>' + inspektionKnopf(L, true) + '</div>';
      }
    });
    if (!n) h += '<p class="mut">Gerade gibt es nichts zu tun – alles in Schuss!</p>';
    return h + '</div><div class="opts"><button data-act="close">Schließen</button></div>';
  };

  /* ---- Fachfragen aus dem Themenquiz der Lernwelt ---- */
  const fragenCache = new Map<string, any[]>();
  const ladeFragen = async (thema: string): Promise<any[]> => {
    if (fragenCache.has(thema)) return fragenCache.get(thema)!;
    const r = await fetch('assets/themenquiz/' + thema + '.json');
    if (!r.ok) throw new Error('Fragen nicht ladbar');
    const j = await r.json();
    // Fragen, die sich auf ein Bild beziehen, gehen hier nicht (das Spiel zeigt keine Bilder).
    const liste = (j.questions || []).filter((q: any) => Array.isArray(q.choices) && typeof q.correctIndex === 'number' && !/(Bild|Abbildung|Foto)/i.test(q.question));
    if (!liste.length) throw new Error('keine Fragen');
    fragenCache.set(thema, liste);
    return liste;
  };
  /** zweck: 'stoerung' (Stoerung auf modal.line beheben) oder 'inspektion'. */
  const startQuiz = (line: number, thema: string, themaN: string, n: number, need: number, zweck: 'stoerung' | 'inspektion') => {
    modal = { kind: 'quiz', line, zweck, themaN, laden: true };
    renderModal();
    ladeFragen(thema).then((liste) => {
      if (modal?.kind !== 'quiz' || modal.line !== line) return;
      Object.assign(modal, { laden: false, fragen: shuffle(liste.slice()).slice(0, n), i: 0, ok: 0, need: Math.min(need, n), antwort: null });
      renderModal();
    }).catch(() => {
      if (modal?.kind !== 'quiz') return;
      // Ohne Fragen: auf die Nivellierlatte ausweichen.
      if (zweck === 'stoerung') { modal = { kind: 'fault', line }; startSelf(); }
      else { closeModal(); toast('Fragen konnten nicht geladen werden.'); }
    });
  };
  const quizHTML = () => {
    const q = modal, L = S.lines[q.line];
    let h = '<h2>' + (q.zweck === 'stoerung' ? '⚠ ' + FEHLER_ARTEN[L.fault?.art ?? 0].n : '🔧 Inspektion') + ' <span class="mut">· ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</span></h2>';
    if (q.laden) return h + '<p class="mut">Fragen werden geladen …</p>';
    const f = q.fragen[q.i];
    h += '<div class="mut">Thema ' + q.themaN + ' · Frage ' + (q.i + 1) + ' / ' + q.fragen.length + ' · mind. ' + q.need + ' richtig · bisher ' + q.ok + ' richtig</div>';
    h += '<p><b>' + f.question + '</b></p><div class="opts">';
    f.choices.forEach((c: string, i: number) => {
      const kl = q.antwort === null ? '' : i === f.correctIndex ? ' class="good"' : i === q.antwort ? ' class="bad"' : '';
      h += '<button data-act="qa" data-arg="' + i + '"' + kl + (q.antwort === null ? '' : ' disabled') + '>' + c + '</button>';
    });
    h += '</div>';
    if (q.antwort !== null) {
      const richtig = q.antwort === f.correctIndex;
      h += '<div class="fb ' + (richtig ? 'good' : 'bad') + '"><b>' + (richtig ? 'Richtig!' : 'Leider falsch.') + '</b>' + (f.explanation ? '<br>' + f.explanation : '') + '</div>';
      if (f.sourceUrl) h += '<div class="mut">Quelle: <a href="' + f.sourceUrl + '" target="_blank" rel="noopener">' + (f.source || f.sourceUrl) + '</a></div>';
      h += '<div class="opts"><button data-act="qnext">' + (q.i < q.fragen.length - 1 ? 'Nächste Frage' : 'Fertig') + '</button></div>';
    }
    return h + '<div class="opts"><button data-act="close">Abbrechen' + (q.zweck === 'stoerung' ? ' (Störung bleibt)' : '') + '</button></div>';
  };
  const quizAntwort = (i: number) => {
    const q = modal; if (q.antwort !== null || q.laden) return;
    q.antwort = i;
    if (i === q.fragen[q.i].correctIndex) q.ok++;
    renderModal();
  };
  const quizWeiter = () => {
    const q = modal; if (q.antwort === null) return;
    if (q.i < q.fragen.length - 1) { q.i++; q.antwort = null; renderModal(); return; }
    const L = S.lines[q.line], ok = q.ok >= q.need;
    if (q.zweck === 'stoerung') { if (L.fault) resolveFault(L, ok ? 'self-ok' : 'self-fail'); }
    else inspektionErgebnis(L, ok);
    closeModal(); save();
  };

  /** Knopf "Strecke ausbauen" (Panel und Shop). */
  const ausbauKnopf = (L: any) => {
    const n = KLASSEN[(L.cls ?? 0) + 1];
    if (!n) return '<div class="mut">Höchste Ausbaustufe erreicht.</div>';
    if (level() < n.lvl) return '<button disabled>🔒 ' + n.n + ' ab Level ' + n.lvl + '</button>';
    const c = ausbauKosten(L);
    return '<button data-act="upg" data-arg="' + L.id + '" ' + (S.money < c ? 'disabled' : '') + '>Ausbauen → ' + n.n + ' (' + n.kmh + ' km/h) · ' + fmt(c) + '</button>';
  };
  const updateHUD = () => {
    const m = $('#money'); m.textContent = fmt(S.money); m.classList.toggle('neg', S.money < 0);
    $('#day').textContent = 'Tag ' + (Math.floor(S.time / CFG.daySec) + 1);
    const lvEl = $('#lvl');
    if (lvEl) lvEl.textContent = '⭐ Level ' + level() + ' · 🏆 ' + (S.pokale || 0);
    root.querySelectorAll('#speeds button').forEach((b: any) => b.classList.toggle('on', +b.dataset.arg === S.speed));
    const h = panelHTML();
    if (h !== lastPanel) { $('#panel').innerHTML = h; lastPanel = h; }
    tutorial();
  };

  /* ---------- Tutorial ---------- */
  const TUT = [
    { t: 'Willkommen! Klicke Berlin an und kaufe rechts einen Bezirk. Dann klicke eine zweite Stadt an, kaufe auch dort einen Bezirk und klicke wieder Berlin → Strecke wird gebaut.', ok: () => S.lines.length > 0 },
    { t: 'Gebaut! Fremdzüge nutzen deine Strecke und zahlen Trassenentgelt. Klicke die Strecke an für Details.', ok: () => S.openedLine },
    { t: 'Kaufe jetzt einen eigenen Zug: „🛒 Zug kaufen“ bei der Strecke oder oben im Shop.', ok: () => S.trains.some((t: any) => t.own) },
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
  const closeModal = () => { modal = null; $('#modal').style.display = 'none'; opts.onVorschau?.(null, 0); };
  const renderModal = () => {
    const box = $('#mcard'); $('#modal').style.display = 'flex';
    box.className = 'card' + (modal.kind === 'shop' ? ' breit' : '');
    if (modal.kind === 'shop') { box.innerHTML = shopHTML(); opts.onVorschau?.($('#lok3d'), modal.ansicht ?? 1); return; }
    if (modal.kind === 'arbeit') { box.innerHTML = arbeitHTML(); return; }
    if (modal.kind === 'quiz') { box.innerHTML = quizHTML(); return; }
    const L = S.lines[modal.line];
    if (modal.kind === 'buy' || modal.kind === 'show') {
      const td = TRAINS[modal.typ];
      let h = '<h2>' + td.n + '</h2><div class="lok3d" id="lok3d"></div>';
      h += '<div class="row"><span>Höchstgeschwindigkeit</span><b>' + td.kmh + ' km/h' + (L && klasse(L).kmh < td.kmh ? ' (auf dieser Strecke ' + klasse(L).kmh + ')' : '') + '</b></div>';
      h += '<div class="row"><span>Miete</span><b>' + Math.round(td.rent * 100) + ' %</b></div>';
      h += '<div class="row"><span>Gleisverschleiß</span><b>' + Math.round(td.wear * 100) + ' %</b></div>';
      h += '<div class="opts">';
      if (modal.kind === 'buy') h += '<div class="mut">Strecke ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</div><button data-act="buyok" ' + (S.money < td.cost ? 'disabled' : '') + '>Jetzt kaufen (' + fmt(td.cost) + ')</button>';
      h += '<button data-act="close">' + (modal.kind === 'buy' ? (modal.zurueck ? 'Zurück zum Shop' : 'Abbrechen') : 'Schließen') + '</button></div>';
      box.innerHTML = h;
      opts.onVorschau?.($('#lok3d'), modal.typ);
      return;
    }
    if (modal.kind === 'fault') {
      const f = L.fault, d = DIFF[f.diff], can = unlocked(f.diff), art = FEHLER_ARTEN[f.art ?? 0];
      const aufgabe = art.thema ? 'Fachfragen „' + art.themaN + '“ (' + QUIZ_N[f.diff] + ' Fragen, mind. ' + QUIZ_NEED[f.diff] + ' richtig)' : d.task;
      box.innerHTML = '<h2>⚠ ' + art.n + ': ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h2>' +
        '<p><span class="tag" style="background:' + d.col + '">' + d.n + '</span> &nbsp;Aufgabe: <b>' + aufgabe + '</b><br>Auftragswert: <b>' + fmt(d.val) + '</b></p>' +
        '<p class="mut">Solange die Störung besteht, fahren die Züge langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen; Bezirke in den Städten der Strecke nur die Hälfte.</p>' +
        '<div class="opts">' +
        '<button data-act="firm" ' + (S.money < d.val ? 'disabled' : '') + '>Fremdfirma beauftragen (−' + fmt(d.val) + ')</button>' +
        '<button data-act="self" ' + (can ? '' : 'disabled') + '>Selbst erledigen – spart ' + fmt(d.val) + ' + Bonus ' + fmt(d.val * d.share) + ' (' + Math.round(d.share * 100) + ' %)</button>' +
        (can ? '' : '<div class="mut">🔒 Frei nach ' + CFG.unlockNeed + ' geschafften „' + DIFF[f.diff - 1].n + '“-Aufgaben (' + S.skill[f.diff - 1] + '/' + CFG.unlockNeed + ').</div>') +
        '<div class="mut">Ein Fehlversuch kostet nichts – die Störung bleibt dann einfach bestehen.</div>' +
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

  /** Shop: Zuege kaufen (nach Level freigeschaltet) und Strecken ausbauen. */
  const shopHTML = () => {
    const lv = level();
    let h = '<h2>🛒 Shop <span class="mut">· Level ' + lv + ' · Guthaben ' + fmt(S.money) + '</span></h2>';
    h += '<div class="tabs"><button data-act="stab" data-arg="z" class="sm' + (modal.tab === 'z' ? ' on' : '') + '">Züge</button>' +
      '<button data-act="stab" data-arg="s" class="sm' + (modal.tab === 's' ? ' on' : '') + '">Strecken ausbauen</button>' +
      '<button data-act="stab" data-arg="a" class="sm' + (modal.tab === 'a' ? ' on' : '') + '">Ausrüstung</button>' +
      '<button data-act="stab" data-arg="k" class="sm' + (modal.tab === 'k' ? ' on' : '') + '">Lackierungen</button></div>';
    /** Preis-/Sperr-Knopf fuer Skins und Ausruestung. */
    const kaufKnopf = (act: string, id: string, x: { lvl: number; preis: number; pokale: number }, besessen: boolean, aktiv = false) => {
      if (aktiv) return '<button disabled>✓ aktiv</button>';
      if (besessen) return act === 'skin' ? '<button data-act="skin" data-arg="' + id + '">Benutzen</button>' : '<button disabled>✓ gekauft</button>';
      if (lv < x.lvl) return '<button disabled>🔒 Level ' + x.lvl + '</button>';
      const preis = x.pokale ? x.pokale + ' 🏆' : fmt(x.preis), geht = x.pokale ? (S.pokale || 0) >= x.pokale : S.money >= x.preis;
      return '<button data-act="' + act + '" data-arg="' + id + '" ' + (geht ? '' : 'disabled') + '>' + preis + '</button>';
    };
    if (modal.tab === 'a' || modal.tab === 'k') {
      h += '<div class="mut">🏆 Pokale gibt es für Duelle (Reiter „Duelle“ über dem Spiel). Du hast ' + (S.pokale || 0) + ' 🏆.</div><div class="shop-liste">';
      if (modal.tab === 'a') {
        AUSRUESTUNG.forEach((a) => {
          h += '<div class="shop-zug' + (lv < a.lvl && !hat(a.id) ? ' zu' : '') + '"><div><b>' + a.n + '</b><div class="mut">' + a.text + '</div></div>' + kaufKnopf('ausr', a.id, a, hat(a.id)) + '</div>';
        });
      } else {
        SKINS.forEach((k) => {
          const hatSkin = (S.skins || []).includes(k.id);
          h += '<div class="shop-zug' + (lv < k.lvl && !hatSkin ? ' zu' : '') + '"><div><b><span class="farbpunkt" style="background:' + (k.farbe ?? 'linear-gradient(90deg,#ff7a00,#2e86ab)') + '"></span>' + k.n + '</b>' +
            '<div class="mut">Gilt für alle eigenen Züge.</div></div>' + kaufKnopf('skin', k.id, k, hatSkin, S.skin === k.id) + '</div>';
        });
      }
      h += '</div><div class="opts"><button data-act="close">Schließen</button></div>';
      return h;
    }
    if (!S.lines.length) {
      h += '<p class="mut">Baue zuerst eine Strecke: Stadt anklicken, dann eine zweite Stadt.</p>';
    } else if (modal.tab === 'z') {
      if (!S.lines[modal.line]) modal.line = S.lines[0].id;
      const L = S.lines[modal.line], K = klasse(L);
      h += '<label class="shop-wahl">Zug einsetzen auf <select id="shopLine">' + S.lines.map((l: any) =>
        '<option value="' + l.id + '"' + (l.id === L.id ? ' selected' : '') + '>' + CITIES[l.a].n + ' ⇄ ' + CITIES[l.b].n + ' (' + klasse(l).n + ', ' + klasse(l).kmh + ' km/h)</option>').join('') + '</select></label>';
      if (modal.ansicht === undefined) modal.ansicht = 1;
      h += '<div class="lok3d" id="lok3d"></div><div class="shop-ansicht" id="ansichtName">' + TRAINS[modal.ansicht].n + ' · bis ' + TRAINS[modal.ansicht].kmh + ' km/h</div>';
      h += '<div class="shop-liste">';
      TRAINS.map((z, i) => ({ z, i })).sort((a, b) => a.z.lvl - b.z.lvl || a.z.cost - b.z.cost).forEach(({ z, i }) => {
        const zu = lv < z.lvl, ohneOL = z.el && !K.el, eff = Math.min(z.kmh, K.kmh);
        h += '<div class="shop-zug' + (zu ? ' zu' : '') + (i === modal.ansicht ? ' gewaehlt' : '') + '" data-zug="' + i + '">' +
          '<button class="sm auge" data-act="sieh" data-arg="' + i + '" title="In 3D ansehen">👁</button><div class="shop-text"><b>' + z.n + '</b>' + (z.el ? ' <span class="tag" style="background:#2e86ab">⚡ elektrisch</span>' : '') +
          '<div class="mut">bis ' + z.kmh + ' km/h' + (eff < z.kmh ? ' (hier ' + eff + ')' : '') + ' · Miete ' + pct(z.rent) + ' · Gleisverschleiß ' + pct(z.wear) + ' · ' + z.len + ' Fahrzeuge</div></div>';
        h += zu ? '<button disabled>🔒 Level ' + z.lvl + '</button>'
          : ohneOL ? '<button disabled title="Strecke zuerst elektrifizieren (Hauptbahn)">braucht Oberleitung</button>'
          : '<button data-act="pick" data-arg="' + L.id + ':' + i + ':shop" ' + (S.money < z.cost ? 'disabled' : '') + '>' + fmt(z.cost) + '</button>';
        h += '</div>';
      });
      h += '</div>';
    } else {
      h += '<div class="shop-liste">';
      KLASSEN.forEach((k) => {
        h += '<div class="shop-zug' + (lv < k.lvl ? ' zu' : '') + '"><div><b>' + k.n + '</b><div class="mut">max. ' + k.kmh + ' km/h · ' + (k.el ? 'Oberleitung' : 'ohne Oberleitung') +
          ' · Verschleiß ' + pct(k.wear) + ' · Trassenentgelt ' + pct(k.entgelt) + '</div></div><span class="mut">' + (lv < k.lvl ? '🔒 ab Level ' + k.lvl : '✓ frei') + '</span></div>';
      });
      h += '</div><h3>Deine Strecken</h3><div class="shop-liste">';
      S.lines.forEach((l: any) => {
        h += '<div class="shop-zug"><div><b>' + CITIES[l.a].n + ' ⇄ ' + CITIES[l.b].n + '</b><div class="mut">' + klasse(l).n + ' · ' + klasse(l).kmh + ' km/h · Zustand ' + Math.round(l.cond) + ' %</div></div>' + ausbauKnopf(l) + '</div>';
      });
      h += '</div>';
    }
    h += '<div class="opts"><button data-act="close">Schließen</button></div>';
    return h;
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
      const L = S.lines[modal.line];
      if (L.fault) resolveFault(L, g.ok >= g.need ? 'self-ok' : 'self-fail');
      closeModal(); save();
    }
  };

  /* ---------- Klick-Aktionen ---------- */
  const onActionDown = (e: PointerEvent) => {
    const b = (e.target as HTMLElement).closest('[data-act]') as HTMLButtonElement | null;
    if (!b || b.disabled) return;
    const a = b.dataset['act'], arg = b.dataset['arg'];
    if (RO && a !== 'show' && a !== 'close' && a !== 'bzwahl') return;
    if (a === 'speed') S.speed = +arg!;
    else if (a === 'mode') { S.mode = +arg!; S.faultIn = Math.min(S.faultIn, modeInterval(S.mode)); save(); }
    else if (a === 'buy') { const [lid, ty] = arg!.split(':'); buyTrain(+lid, ty === undefined ? 1 : +ty); }
    else if (a === 'care') careLine(+arg!);
    else if (a === 'pick') { const [lid, ty, von] = arg!.split(':'); modal = { kind: 'buy', line: +lid, typ: +ty, zurueck: von === 'shop' }; renderModal(); }
    else if (a === 'shop') { const [tab, lid] = (arg || 'z:').split(':'); modal = { kind: 'shop', tab, line: lid ? +lid : sel.line }; renderModal(); }
    else if (a === 'stab') { modal.tab = arg; renderModal(); }
    else if (a === 'sieh' && modal?.kind === 'shop') {
      // Nur den Betrachter umschalten, nicht den ganzen Shop neu zeichnen.
      modal.ansicht = +arg!;
      root.querySelectorAll('.shop-zug.gewaehlt').forEach((e) => e.classList.remove('gewaehlt'));
      root.querySelector('.shop-zug[data-zug="' + arg + '"]')?.classList.add('gewaehlt');
      const n = $('#ansichtName'); if (n) n.textContent = TRAINS[modal.ansicht].n + ' · bis ' + TRAINS[modal.ansicht].kmh + ' km/h';
      opts.onVorschau?.($('#lok3d'), modal.ansicht);
    }
    else if (a === 'skin') { kaufeSkin(arg!); renderModal(); }
    else if (a === 'ausr') { kaufeAusruestung(arg!); renderModal(); }
    else if (a === 'upg') { upgradeLine(+arg!); if (modal?.kind === 'shop') renderModal(); }
    else if (a === 'show') { modal = { kind: 'show', line: sel.line, typ: +arg! }; renderModal(); }
    else if (a === 'buyok') { const m = modal; closeModal(); buyTrain(m.line, m.typ); }
    else if (a === 'firm') { resolveFault(S.lines[modal.line], 'firm'); closeModal(); save(); }
    else if (a === 'self') {
      const L = S.lines[modal.line], art = FEHLER_ARTEN[L.fault.art ?? 0];
      if (art.thema) startQuiz(L.id, art.thema, art.themaN, QUIZ_N[L.fault.diff], QUIZ_NEED[L.fault.diff], 'stoerung');
      else startSelf();
    }
    else if (a === 'qa') quizAntwort(+arg!);
    else if (a === 'qnext') quizWeiter();
    else if (a === 'arbeiten') { modal = { kind: 'arbeit' }; renderModal(); }
    else if (a === 'afault') { modal = { kind: 'fault', line: +arg! }; renderModal(); }
    else if (a === 'insp') {
      const L = S.lines[+arg!], [thema, themaN] = INSPEKTION_THEMEN[ri(0, INSPEKTION_THEMEN.length - 1)];
      if (L && S.time >= (L.inspAb || 0)) startQuiz(L.id, thema, themaN, 3, 2, 'inspektion');
    }
    else if (a === 'stadtzu') { sel.city = null; bzWahl = null; }
    else if (a === 'bzwahl') { const [c, i] = arg!.split(':').map(Number); bzWahl = bzWahl && bzWahl.c === c && bzWahl.i === i ? null : { c, i }; }
    else if (a === 'bez') {
      const [c, b] = arg!.split(':').map(Number), x = bezirkVon(c, b), basis = bezirkeVon(c)[b].basis, preis = x ? x.basis * 3 : basis;
      if (S.money < preis) toast('Zu wenig Guthaben (' + fmt(preis) + ' nötig).');
      else opts.onBezirk?.(c, b, basis);
    }
    else if (a === 'submit') submitReading();
    else if (a === 'next') nextReading();
    else if (a === 'close') {
      if (modal?.kind === 'buy' && modal.zurueck) { opts.onVorschau?.(null, 0); modal = { kind: 'shop', tab: 'z', line: modal.line, ansicht: modal.typ }; renderModal(); }
      else closeModal();
    }
    else if (a === 'reset') { if (confirm('Spielstand wirklich löschen?')) { opts.onReset?.(); fresh(); sel = { city: null, line: null }; tutStart = 0; } }
  };
  root.addEventListener('pointerdown', onActionDown);
  const onChange = (e: Event) => {
    const el = e.target as HTMLSelectElement;
    if (el.id === 'shopLine' && modal?.kind === 'shop') { modal.line = +el.value; renderModal(); }
  };
  root.addEventListener('change', onChange);
  const onEnter = (e: KeyboardEvent) => { if (e.key === 'Enter' && modal && modal.kind === 'mg') { e.preventDefault(); if (modal.mg.fb) nextReading(); else submitReading(); } };
  root.addEventListener('keydown', onEnter);

  /* ---------- Toast / Speichern ---------- */
  let toastT: any;
  const toast = (t: string, ms = 2600) => { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), ms); };
  const serialize = () => ({
    money: S.money, bezirkSumme: S.bezirkSumme, time: S.time, vis: S.vis, skill: S.skill, xp: S.xp, pokale: S.pokale, skins: S.skins, skin: S.skin, ausr: S.ausr, mode: S.mode, faultIn: S.faultIn, tut: S.tut, faultsFixed: S.faultsFixed, passes: S.passes,
    anyFault: S.anyFault, openedLine: S.openedLine, nextId: S.nextId,
    lines: S.lines.map((l: any) => ({ a: l.a, b: l.b, cond: l.cond, inF: l.inF, inO: l.inO, up: l.up, rep: l.rep, fault: l.fault, color: l.color, cls: l.cls, verlust: l.verlust, inspAb: l.inspAb })),
    own: S.trains.filter((t: any) => t.own),
  });
  const save = () => { if (RO || !alive) return; opts.onSave(serialize(), S.money); };
  const load = (d: any) => {
    try {
      if (!d || !Array.isArray(d.lines)) return false;
      fresh();
      // vis auf die aktuelle Staedteliste bringen (alte Staende kennen weniger Staedte).
      Object.assign(S, { money: Math.max(0, d.money || 0), bezirkSumme: d.bezirkSumme || 0, time: d.time, vis: CITIES.map((_, i) => !!d.vis?.[i]), skill: d.skill, mode: d.mode ?? 0, faultIn: d.faultIn ?? modeInterval(d.mode ?? 0), tut: d.tut, faultsFixed: d.faultsFixed, passes: d.passes, anyFault: d.anyFault, openedLine: d.openedLine, nextId: d.nextId });
      d.lines.forEach((o: any) => { const L: any = addLine(o.a, o.b); Object.assign(L, { cond: o.cond, inF: o.inF, inO: o.inO, up: o.up, rep: o.rep, fault: o.fault, color: o.color, cls: o.cls ?? 1, verlust: o.verlust || 0, inspAb: o.inspAb || 0 }); });
      S.trains = d.own || [];
      // Alte Staende ohne Erfahrung: aus dem bisherigen Fortschritt schaetzen. Alte Strecken gelten als Hauptbahn (cls 1, s. o.).
      S.pokale = d.pokale ?? 0; S.skins = d.skins ?? ['standard']; S.skin = d.skin ?? 'standard'; S.ausr = d.ausr ?? [];
      S.xp = d.xp ?? (S.lines.length * 15 + (S.faultsFixed || 0) * 10 + S.trains.reduce((a: number, t: any) => a + (t.trips || 0), 0));
      // Einmalig nach dem Staedte-Ausbau: Nachbarn bestehender Strecken aufdecken.
      if ((d.vis?.length ?? 0) < CITIES.length) S.lines.forEach((L: any) => { revealNear(L.a, 2); revealNear(L.b, 2); });
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
    welt: () => ({ S, sel, CITIES, DIFF, posAt, skin: skinFarbe(), welt }),
    setzeWelt: (w: any) => { welt = w; },
    bezahlt: (preis: number, text: string) => { S.money = Math.max(0, S.money - preis); addXp(8); toast(text, 3500); save(); },
    gutschrift: (betrag: number, text: string) => { S.money += betrag; toast(text + ' +' + fmt(betrag), 5000); save(); },
    meldung: (text: string) => toast(text, 4000),
    belohnung: (xp: number, pokale: number, text: string) => {
      S.pokale = (S.pokale || 0) + pokale;
      toast(text + ' +' + pokale + ' 🏆, +' + xp + ' Erfahrung', 4000);
      addXp(xp);
      save();
    },
    klickWelt: (x: number, y: number) => klick({ x, y }, true),
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
      root.removeEventListener('change', onChange);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
    },
  };
}
