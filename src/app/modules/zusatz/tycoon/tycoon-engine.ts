/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gleisbau Tycoon -- Spiel-Engine (Canvas). Portiert aus der Einzeldatei-Demo.
 * Haengt an einem Wurzel-Element (siehe tycoon.page.html), speichert ueber Callbacks
 * (Server statt localStorage) und kennt einen Nur-Lesen-Modus fuer fremde Netze.
 */

import type { TycoonWeltDaten } from './tycoon-3d';
import { CITIES, KARTE_H, KARTE_W, spielerFarbe, zeichneKarte } from './tycoon-karte';
import { BUNDESLAENDER, Gebiet, GEBIET_QUELLE, GEBIET_STADT, gebietAn, gebietMitId, gebietVonStadt, LAND_NAMEN, stelleErlaubt, umrandeGebiet, zeichneGebiete } from './tycoon-gebiete';
import { HOEHEN_QUELLE, ladeHoehen, reliefBild } from './tycoon-hoehen';
import { HOEHEN } from './tycoon-hoehen-meta';
import { AUSRUESTUNG, KLASSEN, KOHLELAGER, LEVEL_XP, levelAus, OBERLEITUNG, SKINS, upgradePreis, ZUEGE, ZUG_FARBEN, ZUG_UPGRADES } from './tycoon-zuege';

export interface TycoonOptions {
  /** Gespeicherter Spielstand (JSON vom Server) oder null fuer ein neues Spiel. */
  state: any | null;
  /** Fremdes Netz ansehen: keine Aktionen, keine Wirtschaft. */
  readOnly: boolean;
  onSave: (data: any, money: number) => void;
  onReset?: () => void;
  /** Zeigt (el gesetzt) bzw. entfernt (el null) die 3D-Vorschau des Lok-Typs typ (Index in TRAINS). */
  onVorschau?: (el: HTMLElement | null, typ: number, farbe?: string | null, extraWagen?: boolean) => void;
  /** Gebiet (Landkreis/Bezirk) kaufen/uebernehmen (Server); die Seite meldet Erfolg ueber handle.bezahlt() zurueck. */
  onGebiet?: (gebiet: number, basis: number) => void;
  /** Neue Strecke gebaut (Server verteilt den Clan-Bonus). */
  onVerbindung?: (a: number, b: number) => void;
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
  gutschrift: (betrag: number, text: string, xp?: number) => void;
  meldung: (text: string) => void;
  /** Duell-Belohnung gutschreiben (Erfahrung + Pokale). */
  belohnung: (xp: number, pokale: number, text: string) => void;
  /** Klick an einer Stelle der 2D-Welt (KARTE_W x KARTE_H), z. B. aus der 3D-Ansicht. */
  klickWelt: (x: number, y: number) => void;
  /** Zeiger bewegt sich ueber diese Stelle der 2D-Welt (3D-Ansicht): verlaengert eine gerade gezeichnete Strecke. */
  zeigerWelt: (x: number, y: number) => void;
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
  const hatUpg = (t: any, id: string) => (t.upg || []).includes(id);
  /** Dampflok ohne Kohlelager in einer Endstadt der Strecke. */
  const kohleMangel = (t: any, L: any) => !!t.own && !!tdef(t).kohle && !(S.lager || []).some((c: number) => c === L.a || c === L.b);
  const vKmh = (t: any, L: any) => Math.round(Math.min(t.own ? tdef(t).kmh * (hatUpg(t, 'leistung') ? 1.1 : 1) : 110, klasse(L).kmh) * (kohleMangel(t, L) ? 0.8 : 1));
  /** Mietfaktor eines eigenen Zuges durch Upgrades. */
  const upgMiete = (t: any) => 1 + (hatUpg(t, 'komfort') ? 0.15 : 0) + (hatUpg(t, 'zusatzwagen') ? 0.2 : 0) + (hatUpg(t, 'wlan') ? 0.1 : 0);
  const zugFarbe = (t: any) => ZUG_FARBEN.find((f) => f.id === t.farbe)?.farbe ?? null;
  const olKosten = (L: any) => Math.round((L.len * OBERLEITUNG.proEinheit) / 10) * 10;
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
  /** Besitz je Gebiet (Server-Tabelle tycoon_bezirke mit stadt = GEBIET_STADT), beim Laden der Welt neu aufgebaut. */
  let besitzNach = new Map<number, any>();
  /** Aendert sich mit Besitz/Clan -- die Karten zeichnen ihre Gebietsflaechen dann neu. */
  let gebietSchluessel = '';
  const meineId = () => welt?.ich?.id ?? null;
  const besitz = (id: number | undefined) => (id === undefined ? undefined : besitzNach.get(id));
  const istMein = (x: any) => !!x && x.ownerId === meineId();
  const istClan = (x: any) => !!x && !!welt?.ich?.clanId && x.clanId === welt.ich.clanId && !istMein(x);
  /** Ueber dieses Gebiet darf gebaut werden: eigenes oder eines Clan-Mitglieds, das in den letzten 7 Tagen gespielt hat (ohne Serverdaten keine Sperre). */
  const erlaubt = (g: Gebiet) => { if (!welt) return true; const x = besitz(g.id); return istMein(x) || (istClan(x) && !!x.aktiv); };
  /** Fuellfarbe eines Gebiets auf den Karten (Besitzer- bzw. Clanfarbe). */
  const gebietFarbe = (g: Gebiet) => { const x = besitz(g.id); return x ? { farbe: x.clanFarbe || spielerFarbe(x.ownerId), deckung: istMein(x) ? 0.68 : 0.45 } : null; };
  /** Strecken anderer Clan-Mitglieder (vom Server) als {a, b}. */
  const clanStrecken = (): { a: number; b: number }[] => (welt?.clanStrecken || []).map((l: number[]) => ({ a: l[0], b: l[1] }));
  /** Gebiet ist angeschlossen: eine eigene Strecke fuehrt hindurch oder eine Strecke eines Clan-Mitglieds endet darin. */
  const angeschlossen = (id: number) => S.lines.some((l: any) => l.gebiete.includes(id))
    || clanStrecken().some((l) => gebietVonStadt(l.a)?.id === id || gebietVonStadt(l.b)?.id === id);
  const eigenerBezirk = (c: number) => istMein(besitz(gebietVonStadt(c)?.id));
  /** Aktives Clan-Mitglied (in den letzten 7 Tagen gespielt), dem das Gebiet der Stadt c gehoert. */
  const clanArbeiter = (c: number): string[] => { const x = besitz(gebietVonStadt(c)?.id); return istClan(x) && x.aktiv ? [x.ownerName] : []; };
  /** Darf in Stadt c eine Strecke beginnen/enden? Nur wenn ihr Gebiet dir oder einem aktiven Clan-Mitglied gehoert. */
  const praesenz = (c: number) => { const g = gebietVonStadt(c); return !welt || (!!g && erlaubt(g)); };
  /** Clan-Verbindung: eine eigene Strecke durch dieses Gebiet fuehrt auch ueber Gebiete von Clan-Mitgliedern. */
  const clanBonus = (id: number) => !!welt?.ich?.clanId && S.lines.some((l: any) => l.gebiete.includes(id) && l.gebiete.some((o: number) => istClan(besitz(o))));
  /** Einnahmen eines eigenen Gebiets pro Sekunde (nur angeschlossen; Clan-Verbindung +25 %, Stoerung auf einer Strecke hindurch halbiert). */
  const gebietRate = (id: number) => {
    const x = besitz(id);
    if (!welt || !istMein(x) || !angeschlossen(id)) return 0;
    const stoerung = S.lines.some((l: any) => l.fault && l.gebiete.includes(id));
    return x.basis * 0.0015 * (stoerung ? 0.5 : 1) * (clanBonus(id) ? 1.25 : 1);
  };
  const meineGebiete = (): number[] => [...besitzNach.values()].filter(istMein).map((x) => x.bezirk);
  /** Wem gehoert's, als Text. */
  const besitzerText = (x: any) => !x ? 'frei' : istMein(x) ? 'deins' : x.ownerName + (x.clanKuerzel ? ' [' + x.clanKuerzel + ']' : '');
  const gebietArt = (g: Gebiet) => ['Landkreis', 'Kreisfreie Stadt', 'Bezirk', 'Region'][g.typ] + ' · ' + (g.land === 'DE' ? BUNDESLAENDER[g.bl] : LAND_NAMEN[g.land] ?? g.land);
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
  let sel: any = { city: null, line: null, gebiet: null };
  let hover: any = { city: null, line: null, fault: null, gebiet: null };
  /**
   * Strecke wird gerade gezeichnet: Startstadt, Punkte bis hierher (nur ueber erlaubte Gebiete), Zielstadt sobald
   * erreicht, letzte nicht erlaubte Stelle (rot angezeigt) und ein Zaehler, damit die 3D-Ansicht neu zeichnet.
   */
  let zeichnung: { von: number; pts: { x: number; y: number }[]; ziel: number | null; fehl: { x: number; y: number } | null; ver: number } | null = null;
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
    return mitLaenge(pts);
  };
  const mitLaenge = (pts: any[]) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    return { pts, cum, len: cum[cum.length - 1] };
  };
  /**
   * Gezeichnete Strecke: Kontrollpunkte (flach x0,y0,x1,y1,..., so im Spielstand) zu einer glatten Linie.
   * Erst auf hoechstens 4 Einheiten Abstand auffuellen (sonst schneidet die Glaettung Kurven ab und verlaesst
   * schmale Gebiete), dann zweimal Chaikin; Anfang und Ende bleiben fest.
   */
  const geoAusPunkten = (p: number[]) => {
    let pts: { x: number; y: number }[] = [{ x: p[0], y: p[1] }];
    for (let i = 2; i < p.length; i += 2) {
      const a = pts[pts.length - 1], b = { x: p[i], y: p[i + 1] }, n = Math.max(1, Math.ceil(dist(a, b) / 4));
      for (let k = 1; k <= n; k++) pts.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
    }
    for (let n = 0; n < 2; n++) {
      const o = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        o.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
      }
      o.push(pts[pts.length - 1]);
      pts = o;
    }
    return mitLaenge(pts);
  };
  /** Gezeichnete Punkte fuer den Spielstand ausduennen (Douglas-Peucker, 0,4 Einheiten), auf 0,1 gerundet. */
  const duenneAus = (pts: { x: number; y: number }[]): number[] => {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, b] = st.pop()!; let max = 0, idx = -1;
      for (let i = a + 1; i < b; i++) { const d = segDist(pts[i], pts[a], pts[b]); if (d > max) { max = d; idx = i; } }
      if (max > 0.4) { keep[idx] = 1; st.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => keep[i]).flatMap((q) => [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10]);
  };
  /**
   * Ids der Gebiete, durch die eine Linie fuehrt: die der beiden Endstaedte immer, sonst nur mit mind. 2 Einheiten
   * Linie darin (nur die Grenze streifen zaehlt nicht).
   */
  const gebieteEntlang = (pts: { x: number; y: number }[]): number[] => {
    const n = new Map<number, number>(), schritt = mitLaenge(pts).len / Math.max(1, pts.length - 1);
    pts.forEach((q) => { const g = gebietAn(q.x, q.y); if (g) n.set(g.id, (n.get(g.id) || 0) + 1); });
    const enden = [pts[0], pts[pts.length - 1]].map((q) => gebietAn(q.x, q.y)?.id);
    return [...n].filter(([id, c]) => enden.includes(id) || c * schritt >= 2).map(([id]) => id);
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
  /** p = gezeichnete Kontrollpunkte; ohne (alte Spielstaende) wird die fruehere geschwungene Verbindung erzeugt. */
  const addLine = (a: number, b: number, p?: number[]) => {
    const g = p && p.length >= 4 ? geoAusPunkten(p) : makeGeo(a, b);
    const L = { id: S.lines.length, a, b, p: p && p.length >= 4 ? p : undefined, pts: g.pts, cum: g.cum, len: g.len, gebiete: gebieteEntlang(g.pts),
      color: LCOL[S.lines.length % LCOL.length], cls: 0, ol: false, cond: 100, inF: 0, inO: 0, up: 0, rep: 0, fault: null, spawnT: rand(1.5, 4) };
    S.lines.push(L);
    return L;
  };

  /* ---------- Strecke zeichnen ---------- */
  /** Neuer Punkt erst ab diesem Abstand zum letzten (Welteinheiten). */
  const PUNKT_ABSTAND = 2.5;
  const MAX_PUNKTE = 900;
  /** Erlaubt-Pruefung entlang einer Strecke in kleinen Schritten; liefert den Anteil (0..1), bis zu dem alles erlaubt ist. */
  const erlaubtBis = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const n = Math.max(1, Math.ceil(dist(a, b) / 0.8));
    for (let i = 1; i <= n; i++) if (!stelleErlaubt(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, erlaubt)) return (i - 1) / n;
    return 1;
  };
  const starteZeichnen = (c: number) => {
    if (S.lines.length >= 80) { toast('Mehr als 80 Strecken gehen nicht.'); return; }
    if (!praesenz(c)) { toast('Das Gebiet von ' + CITIES[c].n + ' gehört weder dir noch einem aktiven Clan-Mitglied – kauf es zuerst.', 4500); return; }
    zeichnung = { von: c, pts: [{ x: CITIES[c].x, y: CITIES[c].y }], ziel: null, fehl: null, ver: 0 };
    sel = { city: null, line: null, gebiet: null };
    toast('Fahre jetzt über deine Gebiete bis zur Zielstadt – die Strecke folgt dem Zeiger.', 4500);
  };
  /** Zeiger steht an p: Strecke dorthin verlaengern (so weit erlaubt), an einer Zielstadt einrasten, beim Zurueckfahren kuerzen. */
  const zeichneZu = (p: { x: number; y: number }, fest = false) => {
    const z = zeichnung;
    if (!z) return;
    const vorher = z.pts.length + ':' + z.ziel + ':' + !!z.fehl;
    // Zurueck ueber die eigene Linie: dort abschneiden.
    for (let i = 0; i < z.pts.length - 4; i++) if (dist(z.pts[i], p) < 2) { z.pts.length = i + 1; break; }
    let letzter = z.pts[z.pts.length - 1];
    const radius = fest ? 10 : Math.max(8, 16 / k);
    const ziel = CITIES.findIndex((c, i) => i !== z.von && S.vis[i] && dist(c, p) < radius);
    z.ziel = null;
    if (ziel >= 0 && praesenz(ziel) && erlaubtBis(letzter, CITIES[ziel]) === 1) { z.ziel = ziel; z.fehl = null; }
    else if (dist(letzter, p) >= PUNKT_ABSTAND && z.pts.length < MAX_PUNKTE) {
      const f = erlaubtBis(letzter, p);
      if (f === 1) { z.pts.push({ x: p.x, y: p.y }); z.fehl = null; }
      else {
        // Bis an die Grenze heranfahren, Rest rot anzeigen.
        const q = { x: letzter.x + (p.x - letzter.x) * f, y: letzter.y + (p.y - letzter.y) * f };
        if (dist(letzter, q) >= 0.8) { z.pts.push(q); letzter = q; }
        z.fehl = { x: p.x, y: p.y };
      }
    } else if (z.fehl && dist(letzter, p) < PUNKT_ABSTAND) z.fehl = null;
    if (z.pts.length + ':' + z.ziel + ':' + !!z.fehl !== vorher || z.fehl) z.ver++;
  };
  const zeichnungLaenge = (z: NonNullable<typeof zeichnung>) => {
    let l = 0;
    for (let i = 1; i < z.pts.length; i++) l += dist(z.pts[i - 1], z.pts[i]);
    return l + (z.ziel !== null ? dist(z.pts[z.pts.length - 1], CITIES[z.ziel]) : 0);
  };
  /** Kontrollpunkte der fertigen Zeichnung (bis zur Zielstadt). */
  const zeichnungPunkte = (z: NonNullable<typeof zeichnung>) => duenneAus([...z.pts, { x: CITIES[z.ziel!].x, y: CITIES[z.ziel!].y }]);
  const baueZeichnung = () => {
    const z = zeichnung;
    if (!z || z.ziel === null) return;
    const a = z.von, b = z.ziel;
    if (lineExists(a, b)) { toast('Die Strecke ' + CITIES[a].n + ' ⇄ ' + CITIES[b].n + ' gehört dir schon.'); return; }
    if (!praesenz(b)) { toast('Das Gebiet von ' + CITIES[b].n + ' gehört weder dir noch einem aktiven Clan-Mitglied.', 4500); return; }
    const p = zeichnungPunkte(z), cost = lineCost(geoAusPunkten(p));
    if (S.money < cost) { toast('Zu wenig Guthaben (' + fmt(cost) + ' nötig).'); return; }
    S.money -= cost;
    addLine(a, b, p);
    revealNear(a, 2); revealNear(b, 2);
    addXp(15);
    opts.onVerbindung?.(a, b);
    toast('Strecke ' + CITIES[a].n + ' ⇄ ' + CITIES[b].n + ' gebaut (−' + fmt(cost) + ')');
    zeichnung = null;
    sel = { city: null, line: S.lines.length - 1, gebiet: null };
    save();
  };
  /** Ein Stueck zuruecknehmen (Knopf). */
  const zeichnungZurueck = () => {
    const z = zeichnung;
    if (!z) return;
    let l = 0;
    while (z.pts.length > 1 && l < 25) { l += dist(z.pts[z.pts.length - 1], z.pts[z.pts.length - 2]); z.pts.pop(); }
    z.ziel = null; z.fehl = null; z.ver++;
  };
  const spawnForeign = (L: any) => {
    const dir = Math.random() < .5 ? 1 : -1;
    S.trains.push({ id: S.nextId++, line: L.id, own: false, dir, s: dir > 0 ? 0 : L.len, earned: 0, cost: 0, trips: 0 });
  };
  const buyTrain = (id: number, type = 1, farbe = 'werk') => {
    const def = TRAINS[type], L = S.lines[id]; if (!def || !L) return;
    if (level() < def.lvl) { toast('Erst ab Level ' + def.lvl + '.'); return; }
    if (def.el && !L.ol) { toast('Diese Strecke hat keine Oberleitung – erst bauen.'); return; }
    const fp = ZUG_FARBEN.find((f) => f.id === farbe)?.preis ?? 0;
    if (S.money < def.cost + fp) { toast('Zu wenig Guthaben.'); return; }
    S.money -= def.cost + fp;
    addXp(5);
    S.trains.push({ id: S.nextId++, line: id, own: true, type, dir: 1, s: 0, earned: 0, cost: 0, trips: 0, farbe, upg: [] });
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
  const baueOberleitung = (id: number) => {
    const L = S.lines[id];
    if (!L || L.ol) return;
    if (level() < OBERLEITUNG.lvl) { toast('Oberleitung erst ab Level ' + OBERLEITUNG.lvl + '.'); return; }
    const c = olKosten(L);
    if (S.money < c) { toast('Zu wenig Guthaben (' + fmt(c) + ' nötig).'); return; }
    S.money -= c; L.rep += c; L.ol = true; addXp(10);
    toast('⚡ Oberleitung ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + ' gebaut (−' + fmt(c) + ')');
    save();
  };
  const baueKohlelager = (c: number) => {
    S.lager = S.lager || [];
    if (S.lager.includes(c)) return;
    if (!praesenz(c)) { toast('In ' + CITIES[c].n + ' arbeitet weder du noch dein Clan.'); return; }
    if (S.money < KOHLELAGER.preis) { toast('Zu wenig Guthaben.'); return; }
    S.money -= KOHLELAGER.preis; S.lager.push(c); addXp(10);
    toast('🏭 Kohlelager in ' + CITIES[c].n + ' gebaut (−' + fmt(KOHLELAGER.preis) + ')');
    save();
  };
  const zugVon = (id: number) => S.trains.find((t: any) => t.own && t.id === id);
  const faerbeZug = (id: number, farbe: string) => {
    const t = zugVon(id), f = ZUG_FARBEN.find((x) => x.id === farbe);
    if (!t || !f || (t.farbe ?? 'werk') === farbe) return;
    if (S.money < f.preis) { toast('Zu wenig Guthaben.'); return; }
    S.money -= f.preis; t.farbe = farbe;
    toast('🎨 Neu lackiert: ' + f.n + (f.preis ? ' (−' + fmt(f.preis) + ')' : ''));
    save();
  };
  const ruesteNach = (id: number, upg: string) => {
    const t = zugVon(id), u = ZUG_UPGRADES.find((x) => x.id === upg);
    if (!t || !u || hatUpg(t, upg)) return;
    if (level() < u.lvl) { toast('Erst ab Level ' + u.lvl + '.'); return; }
    const p = upgradePreis(tdef(t).cost, u.faktor);
    if (S.money < p) { toast('Zu wenig Guthaben.'); return; }
    S.money -= p; t.upg = [...(t.upg || []), upg]; addXp(5);
    toast('🔧 ' + u.n + ' eingebaut (−' + fmt(p) + ')');
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
    // Gebiete bringen laufend Geld (nur angeschlossene; Stoerung auf einer Strecke hindurch halbiert).
    if (welt) {
      let r = 0;
      meineGebiete().forEach((id) => (r += gebietRate(id)));
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
    L.cond = Math.max(0, L.cond - CFG.wearPerPass * klasse(L).wear * (t.own ? tdef(t).wear * (hatUpg(t, 'drehgestell') ? 0.7 : 1) : 1.4) * (hat('stopfmaschine') ? 0.75 : 1));
    t.trips++;
    if (t.own) {
      // Keine Wartungskosten mehr: Wartungsstau und Stoerung senken nur die Einnahmen.
      const td = tdef(t), voll = L.len * CFG.ownRent * td.rent * upgMiete(t) * (1 + (hat('fahrgastinfo') ? 0.1 : 0) + (hat('schaufel') ? 0.05 : 0)) * (kohleMangel(t, L) ? 0.6 : 1);
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
    const r: any = { city: null, line: null, fault: null, gebiet: null };
    const faultR = fest ? 22 : 18 / Math.min(1, k), lineR = fest ? 16 : 9 / Math.min(1, k);
    if (!RO) for (const L of S.lines) if (L.fault) { const q = posAt(L, L.len * L.fault.t); if (dist(p, q) < faultR) { r.fault = L.id; return r; } }
    for (let i = 0; i < CITIES.length; i++) if (S.vis[i] && dist(p, CITIES[i]) < (fest ? 20 : Math.max(12, 16 / k))) { r.city = i; return r; }
    let best = 1e9;
    for (const L of S.lines) {
      for (let i = 1; i < L.pts.length; i++) { const d = segDist(p, L.pts[i - 1], L.pts[i]); if (d < lineR && d < best) { best = d; r.line = L.id; } }
    }
    if (r.line === null) r.gebiet = gebietAn(p.x, p.y)?.id ?? null;
    return r;
  };
  /** Touch/Stift zeichnet nur bei aufgesetztem Finger, die Maus schon beim Bewegen (ohne Taste). */
  let fingerZeichnet = false;
  const onMove = (e: PointerEvent) => {
    const p = toWorld(e);
    hover = hit(p);
    if (zeichnung && (e.pointerType === 'mouse' ? e.buttons === 0 : fingerZeichnet)) zeichneZu(p);
    cv.style.cursor = zeichnung ? 'crosshair' : (hover.city !== null || hover.line !== null || hover.fault !== null) ? 'pointer' : 'default';
  };
  const onCanvasDown = (e: PointerEvent) => { fingerZeichnet = e.pointerType !== 'mouse'; klick(toWorld(e)); };
  const onCanvasUp = () => { fingerZeichnet = false; };
  const klick = (p: { x: number; y: number }, fest = false) => {
    if (modal) return;
    const h = hit(p, fest);
    if (zeichnung && !RO) {
      // Zeichnen: Zielstadt antippen = bauen, sonst wird die Strecke bis hierher verlaengert.
      zeichneZu(h.city !== null ? CITIES[h.city] : p, fest);
      if (h.city !== null && h.city === zeichnung.ziel) baueZeichnung();
      else if (h.city !== null && h.city !== zeichnung.von) toast('Bis ' + CITIES[h.city].n + ' kommst du nicht nur über deine Gebiete – kauf die fehlenden oder bau drumherum.', 4500);
      return;
    }
    if (h.fault !== null) { openFault(h.fault); return; }
    if (RO) {
      if (h.line !== null) { sel.line = h.line; } else if (h.city === null) { sel.line = null; }
      return;
    }
    if (h.city !== null) { sel = { city: sel.city === h.city ? null : h.city, line: null, gebiet: null }; return; }
    if (h.line !== null) { sel = { city: null, line: h.line, gebiet: null }; S.openedLine = true; return; }
    sel = { city: null, line: null, gebiet: h.gebiet !== null && sel.gebiet !== h.gebiet ? h.gebiet : null };
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (zeichnung) { zeichnung = null; return; }
    sel = { city: null, line: null, gebiet: null };
    if (modal && modal.kind !== 'mg') closeModal();
  };
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerdown', onCanvasDown);
  window.addEventListener('pointerup', onCanvasUp);
  window.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => layout());
  ro.observe(root);

  /* ---------- Zeichnen ---------- */
  /** Hintergrundkarte (Meer, Relief, Grenzen) einmal vorrendern statt jedes Bild neu zu zeichnen. */
  const KB = { x0: -300, y0: -250, x1: KARTE_W + 300, y1: KARTE_H + 250 }, KB_S = 1.2;
  let kartenBild: HTMLCanvasElement | null = null, kartenMitRelief = false;
  const holeKartenBild = () => {
    const rel = reliefBild();
    if (kartenBild && (kartenMitRelief || !rel)) return kartenBild;
    const c = document.createElement('canvas');
    c.width = Math.round((KB.x1 - KB.x0) * KB_S); c.height = Math.round((KB.y1 - KB.y0) * KB_S);
    const g = c.getContext('2d')!;
    g.scale(KB_S, KB_S); g.translate(-KB.x0, -KB.y0);
    zeichneKarte(g, undefined, 1.4, rel ? { bild: rel, x0: HOEHEN.x0, y0: HOEHEN.y0, w: HOEHEN.breite * HOEHEN.zelle, h: HOEHEN.hoehe * HOEHEN.zelle } : null, KB);
    kartenBild = c; kartenMitRelief = !!rel;
    return c;
  };
  /** Gebietsflaechen und Grenzen ebenfalls vorrendern; neu nur bei anderem Besitz oder anderer Kartengroesse. */
  let gebietsBild: HTMLCanvasElement | null = null, gebietsBildFuer = '';
  const holeGebietsBild = () => {
    const key = gebietSchluessel + '|' + k.toFixed(3);
    if (gebietsBild && gebietsBildFuer === key) return gebietsBild;
    const c = gebietsBild || document.createElement('canvas');
    c.width = Math.round((KB.x1 - KB.x0) * KB_S); c.height = Math.round((KB.y1 - KB.y0) * KB_S);
    const g = c.getContext('2d')!;
    g.scale(KB_S, KB_S); g.translate(-KB.x0, -KB.y0);
    // Linien in Bildschirmpixeln etwa gleich dick, egal wie gross die Karte gerade ist.
    zeichneGebiete(g, { farbe: gebietFarbe, linie: 1.4 / Math.max(0.3, k), namen: true });
    gebietsBild = c; gebietsBildFuer = key;
    return c;
  };
  ladeHoehen();
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
    ctx.drawImage(holeKartenBild(), KB.x0, KB.y0, KB.x1 - KB.x0, KB.y1 - KB.y0);
    // Gebiete (Landkreise, Bezirke): Besitz farbig, Kreis-, Landes- und Staatsgrenzen.
    ctx.drawImage(holeGebietsBild(), KB.x0, KB.y0, KB.x1 - KB.x0, KB.y1 - KB.y0);
    const hg = zeichnung || hover.gebiet === null || hover.gebiet === sel.gebiet ? null : gebietMitId(hover.gebiet);
    if (hg) umrandeGebiet(ctx, hg, 'rgba(228,87,46,.55)', 1.6 / k);
    const sg = sel.gebiet !== null ? gebietMitId(sel.gebiet) : null;
    if (sg) { umrandeGebiet(ctx, sg, '#fff', 4.5 / k); umrandeGebiet(ctx, sg, '#e4572e', 2.5 / k); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const L of S.lines) {
      const on = sel.line === L.id || hover.line === L.id;
      path(L.pts);
      if (on) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 14; ctx.stroke(); }
      path(L.pts); ctx.strokeStyle = L.color; ctx.lineWidth = 7; ctx.stroke();
      path(L.pts); ctx.strokeStyle = L.cond < 25 ? '#ff2d2d' : L.cond < 50 ? '#ffb347' : '#fff';
      ctx.lineWidth = 2.2; ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (zeichnung) {
      // Gezeichnete Strecke: erlaubter Teil dunkel, an der Zielstadt eingerastet; nicht erlaubter Rest rot gestrichelt.
      const z = zeichnung, ende = z.pts[z.pts.length - 1];
      const pts = z.ziel !== null ? [...z.pts, CITIES[z.ziel]] : z.pts;
      if (pts.length > 1) {
        path(pts); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 9; ctx.stroke();
        path(pts); ctx.strokeStyle = z.ziel !== null ? '#2e8b57' : '#23262b'; ctx.lineWidth = 5; ctx.stroke();
      }
      if (z.fehl) {
        ctx.beginPath(); ctx.moveTo(ende.x, ende.y); ctx.lineTo(z.fehl.x, z.fehl.y);
        ctx.strokeStyle = 'rgba(192,57,43,.85)'; ctx.lineWidth = 4; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
      }
      const c = Math.round(zeichnungLaenge(z) * CFG.lineCostPerUnit / 10) * 10, at = z.ziel !== null ? CITIES[z.ziel] : z.fehl ?? ende;
      label(at.x, at.y - 24, (z.ziel !== null ? '✓ ' : '') + fmt(c), S.money >= c ? '#23262b' : '#c0392b');
    }
    for (const t of S.trains) {
      const L = S.lines[t.line]; if (!L) continue;
      const n = t.own ? tdef(t).len + (hatUpg(t, 'zusatzwagen') ? 1 : 0) : 3;
      for (let i = 0; i < n; i++) {
        const s = t.s - t.dir * i * 11;
        if (s < 0 || s > L.len) continue;
        const p = posAt(L, s);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
        ctx.fillStyle = t.own ? (zugFarbe(t) ?? skinFarbe() ?? (i === 0 ? tdef(t).col : tdef(t).col2)) : (i === 0 ? '#2f3a46' : '#5d6b7a');
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
      const isSel = sel.city === i || zeichnung?.von === i || zeichnung?.ziel === i, isHov = hover.city === i;
      // Beim Zeichnen: moegliche Zielstaedte (Gebiet gehoert dir/deinem Clan) gruen markieren.
      if (zeichnung && i !== zeichnung.von && praesenz(i)) { ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, 7); ctx.fillStyle = 'rgba(46,139,87,.35)'; ctx.fill(); }
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
    if (zeichnung && !RO) return zeichnungHTML();
    if (sel.line !== null && S.lines[sel.line]) {
      const L = S.lines[sel.line];
      const own = S.trains.filter((t: any) => t.own && t.line === L.id);
      const care = Math.round(L.len * CFG.careCostPerUnit / 10) * 10;
      let h = '<h3 style="color:' + L.color + '">' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h3>';
      h += '<div class="mut">Länge ca. ' + Math.round(L.len * .97) + ' km</div>';
      h += '<div class="row"><span>Ausbau</span><b>' + klasse(L).n + '</b></div><div class="mut">max. ' + klasse(L).kmh + ' km/h' + (L.ol ? ' · ⚡ Oberleitung' : ' · ohne Oberleitung') + '</div>';
      h += '<div class="row"><span>Zustand</span><b>' + Math.round(L.cond) + ' %</b></div>' + barHTML(L.cond, condCol(L.cond));
      h += '<div class="row"><span>Trassenentgelt (Fremdzüge)</span><span class="pos">' + sgn(L.inF) + '</span></div>';
      h += '<div class="row"><span>Miete eigene Züge</span><span class="pos">' + sgn(L.inO) + '</span></div>';
      h += '<div class="row"><b>Einnahmen Strecke</b><b class="pos">' + sgn(L.inF + L.inO) + '</b></div>';
      h += '<div class="row"><span>Entgangen (Wartungsstau/Störung)</span><span class="neg">' + sgn(-(L.verlust || 0)) + '</span></div>';
      h += '<div class="mut">Zustand ' + Math.round(L.cond) + ' % → ' + Math.round(condFaktor(L) * 100) + ' % der möglichen Einnahmen. Ausgegeben für Ausbau/Reparatur: ' + fmt(L.rep) + '</div>';
      if (!RO) {
        if (L.fault) h += '<p class="neg"><b>⚠ Störung (' + DIFF[L.fault.diff].n + ')</b> – Züge fahren langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen. Klicke das rote ! auf der Strecke.</p>';
        h += '<div class="btns"><button data-act="shop" data-arg="z:' + L.id + '">🛒 Zug kaufen …</button>' + ausbauKnopf(L) + olKnopf(L) + inspektionKnopf(L);
        h += '<button data-act="care" data-arg="' + L.id + '" ' + (S.money < care || L.cond >= 95 ? 'disabled' : '') + '>Pflege durch Fremdfirma (' + fmt(care) + ')</button></div>';
      }
      h += '<b>Eigene Züge (' + own.length + ')</b>';
      if (!own.length) h += '<div class="mut">' + (RO ? 'Keine.' : 'Noch keiner. Vermiete Züge, um zusätzlich Geld zu verdienen.') + '</div>';
      own.forEach((t: any, i: number) => {
        const n = t.earned;
        h += '<div class="train"><div class="row"><span>' + tdef(t).n + ' #' + (i + 1) + ' <span class="mut">(' + vKmh(t, L) + ' km/h · ' + t.trips + ' Fahrten)</span></span><b class="' + (n >= 0 ? 'pos' : 'neg') + '">' + sgn(n) + '</b></div>' +

          (kohleMangel(t, L) ? '<div class="neg">⚠ Kohlemangel: Kohlelager in ' + CITIES[L.a].n + ' oder ' + CITIES[L.b].n + ' bauen (Stadt anklicken).</div>' : '') +
          (RO ? '<button class="sm" data-act="show" data-arg="' + (t.type ?? 1) + '">3D ansehen</button>' : '<button class="sm" data-act="werk" data-arg="' + t.id + '">🔧 Werkstatt: Farbe & Upgrades</button>') + '</div>';
      });
      return h;
    }
    if (sel.city !== null) return stadtHTML(sel.city);
    if (sel.gebiet !== null && gebietMitId(sel.gebiet)) return gebietHTML(sel.gebiet);
    const own = S.trains.filter((t: any) => t.own);
    const inF = S.lines.reduce((a: number, l: any) => a + l.inF, 0), inO = S.lines.reduce((a: number, l: any) => a + l.inO, 0);
    const verlust = S.lines.reduce((a: number, l: any) => a + (l.verlust || 0), 0), bez = S.bezirkSumme || 0;
    const meineBezirke = welt ? meineGebiete().length : 0;
    let h = '<h3>' + (RO ? 'Unternehmen' : 'Dein Unternehmen') + '</h3>';
    const lv = level(), von = LEVEL_XP[lv - 1], bis = LEVEL_XP[lv];
    h += '<div class="row"><span>Level</span><b>' + lv + (bis === undefined ? ' (max.)' : '') + '</b></div>';
    if (bis !== undefined) h += barHTML(((S.xp || 0) - von) / (bis - von) * 100, '#7b61ff') + '<div class="mut">' + Math.floor(S.xp || 0) + ' / ' + bis + ' Erfahrung – Fahrten, neue Strecken, Ausbau und behobene Störungen bringen Punkte.</div>';
    h += '<div class="row"><span>Strecken</span><b>' + S.lines.length + '</b></div>';
    h += '<div class="row"><span>Eigene Züge</span><b>' + own.length + '</b></div>';
    h += '<div class="row"><span>Trassenentgelt gesamt</span><span class="pos">' + sgn(inF) + '</span></div>';
    h += '<div class="row"><span>Mieteinnahmen gesamt</span><span class="pos">' + sgn(inO) + '</span></div>';
    h += '<div class="row"><span>Gebiete (' + meineBezirke + ')</span><span class="pos">' + sgn(bez) + '</span></div>';
    h += '<div class="row"><b>Einnahmen gesamt</b><b class="pos">' + sgn(inF + inO + bez) + '</b></div>';
    h += '<div class="row"><span>Entgangen durch Wartungsstau/Störungen</span><span class="neg">' + sgn(-verlust) + '</span></div>';
    h += '<div class="mut">' + HOEHEN_QUELLE + ' · Karte: Natural Earth · ' + GEBIET_QUELLE + '</div>';
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
      h += '<p class="mut" style="margin-top:14px">Gebiet (Landkreis, Bezirk) auf der Karte anklicken = kaufen. Stadt anklicken → „Strecke zeichnen“ und über deine Gebiete bis zur nächsten Stadt fahren. Strecke anklicken = Details & Züge. Rotes ! = Störung. Mit jeder Verbindung schalten sich neue Städte frei.</p>';
      h += '<div class="btns"><button data-act="reset" class="sm">Spiel zurücksetzen</button></div>';
    }
    return h;
  };
  const uhr = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  /** Eine Gebietszeile mit Farbe, Besitzer und Kauf-/Uebernahme-Knopf (antippen = auf der Karte auswaehlen). */
  const gebietZeile = (g: Gebiet) => {
    const x = besitz(g.id), farbe = x ? (x.clanFarbe || spielerFarbe(x.ownerId)) : '#d9d4c8';
    let knopf = '';
    if (!x) knopf = RO ? '' : '<button class="sm" data-act="gkauf" data-arg="' + g.id + '" ' + (S.money < g.basis ? 'disabled' : '') + '>Kaufen · ' + fmt(g.basis) + '</button>';
    else if (istMein(x)) knopf = '<span class="pos">✓</span>';
    else if (istClan(x)) knopf = '<span class="mut">Clan' + (x.aktiv ? '' : ' (inaktiv)') + '</span>';
    else if (new Date(x.geschuetztBis).getTime() > Date.now()) knopf = '<span class="mut">🛡 bis ' + uhr(x.geschuetztBis) + '</span>';
    else if (!RO) knopf = '<button class="sm" data-act="gkauf" data-arg="' + g.id + '" ' + (S.money < x.basis * 3 ? 'disabled' : '') + '>Übernehmen · ' + fmt(x.basis * 3) + '</button>';
    return '<div class="bezirk' + (sel.gebiet === g.id ? ' gewaehlt' : '') + '" data-act="gwahl" data-arg="' + g.id + '"><span class="farbpunkt" style="background:' + farbe + '"></span>' +
      '<span class="bz-n">' + g.n + ' <span class="mut">· ' + besitzerText(x) + '</span></span>' + knopf + '</div>';
  };
  /** Einnahmen-Hinweis fuer ein eigenes Gebiet. */
  const gebietEinnahmen = (g: Gebiet) => {
    if (!istMein(besitz(g.id))) return '';
    if (!angeschlossen(g.id)) return '<div class="mut">Bringt Geld, sobald eine deiner Strecken hindurchführt.</div>';
    const stoerung = S.lines.some((l: any) => l.fault && l.gebiete.includes(g.id));
    return '<div class="mut">Bringt ' + fmt(gebietRate(g.id) * 60) + ' pro Minute' + (stoerung ? ' – eine Störung auf einer Strecke hier halbiert das!' : '') +
      (clanBonus(g.id) ? ' (🤝 +25 % Clan-Verbindung)' : '') + '.</div>';
  };
  /** Panel eines Gebiets (auf der Karte angeklickt). */
  const gebietHTML = (id: number) => {
    const g = gebietMitId(id);
    if (!g) return '';
    let h = '<h3>' + g.n + '</h3><div class="mut">' + gebietArt(g) + ' · ca. ' + g.f.toLocaleString('de-DE') + ' km²</div>';
    if (!welt) h += '<p class="mut">' + (RO ? '' : 'Besitz wird geladen …') + '</p>';
    else {
      h += gebietZeile(g) + gebietEinnahmen(g);
      if (g.staedte.length) h += '<div class="row"><span>Städte</span><b>' + g.staedte.map((c) => CITIES[c].n).join(', ') + '</b></div>';
      const durch = S.lines.filter((l: any) => l.gebiete.includes(g.id));
      if (durch.length) h += '<div class="mut">Deine Strecken hier: ' + durch.map((l: any) => CITIES[l.a].n + ' ⇄ ' + CITIES[l.b].n).join(', ') + '</div>';
      if (!RO) h += '<div class="mut">Strecken darfst du nur über eigene Gebiete zeichnen (oder über die von aktiven Clan-Mitgliedern). Fremde Gebiete kosten das Dreifache; der bisherige Besitzer bekommt den Grundpreis erstattet. Frisch gekaufte Gebiete sind 2 Stunden geschützt.</div>';
    }
    h += '<div class="mut">' + GEBIET_QUELLE + '</div><div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
    return h;
  };
  /** Panel einer Stadt: Aktivitaet anderer Spieler, ihr Gebiet und "Strecke zeichnen". */
  const stadtHTML = (c: number) => {
    const C = CITIES[c], info = (welt?.staedte || []).find((x: any) => x.stadt === c), g = gebietVonStadt(c);
    let h = '<h3>' + C.n + (C.land ? ' <span class="mut">(' + C.land + ')</span>' : '') + '</h3>';
    h += '<div class="mut">' + (info ? '💡 ' + info.spieler + ' andere Spieler mit Strecken hier' + (info.aktiv ? ', ' + info.aktiv + ' gerade aktiv' : '') : 'Hier ist noch kein anderer Spieler.') + '</div>';
    if (!welt) {
      h += '<p class="mut">' + (RO ? '' : 'Gebiete werden geladen …') + '</p>';
    } else {
      if (g) h += '<h3 style="margin-top:10px">Gebiet</h3>' + gebietZeile(g) + gebietEinnahmen(g);
      const team = clanArbeiter(c), ich = eigenerBezirk(c);
      if (team.length || ich) h += '<div class="row"><span>Hier arbeitet</span><b>' + (ich ? 'du' : team.join(', ')) + '</b></div>';
      if (!RO) {
        h += '<div class="btns"><button data-act="zeichne" data-arg="' + c + '" ' + (praesenz(c) ? '' : 'disabled') + '>🛤 Strecke von hier zeichnen</button></div>';
        h += '<div class="mut">' + (praesenz(c) ? 'Die Strecke folgt deinem Zeiger und geht nur über deine Gebiete (und die aktiver Clan-Mitglieder). Je länger, desto teurer.'
          : '✗ Für Strecken von und nach ' + C.n + ' muss dir (oder einem aktiven Clan-Mitglied) das Gebiet gehören.') + '</div>';
      }
      if ((S.lager || []).includes(c)) h += '<div class="pos">🏭 Dein Kohlelager versorgt Dampfloks auf allen Strecken nach ' + C.n + '.</div>';
      else if (!RO) h += '<div class="btns"><button data-act="lager" data-arg="' + c + '" ' + (S.money < KOHLELAGER.preis || !praesenz(c) ? 'disabled' : '') + '>🏭 Kohlelager bauen · ' + fmt(KOHLELAGER.preis) + '</button></div><div class="mut">' + KOHLELAGER.text + '</div>';
    }
    if (!RO) h += '<p class="mut">Weitere Gebiete kaufst du, indem du sie auf der Karte anklickst. Clan-Mitglieder bekommen Erfahrung, wenn du eine Strecke in ihre Städte baust, und deine Gebiete bringen 25 % mehr, wenn deine Strecke auch über Gebiete deines Clans führt.</p>';
    h += '<div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
    return h;
  };
  /** Panel waehrend eine Strecke gezeichnet wird. */
  const zeichnungHTML = () => {
    const z = zeichnung!, len = zeichnungLaenge(z), c = Math.round(len * CFG.lineCostPerUnit / 10) * 10;
    let h = '<h3>🛤 Strecke zeichnen</h3>';
    h += '<div class="row"><span>Von</span><b>' + CITIES[z.von].n + '</b></div>';
    h += '<div class="row"><span>Nach</span><b>' + (z.ziel !== null ? CITIES[z.ziel].n : '–') + '</b></div>';
    h += '<div class="row"><span>Länge</span><b>ca. ' + Math.round(len * 0.97) + ' km</b></div>';
    h += '<div class="row"><span>Kosten</span><b class="' + (S.money >= c ? '' : 'neg') + '">' + fmt(c) + '</b></div>';
    if (z.fehl) {
      // Erste nicht erlaubte Stelle zwischen Linienende und Zeiger: welches Gebiet versperrt den Weg?
      const a = z.pts[z.pts.length - 1], f = z.fehl, n = Math.max(1, Math.ceil(dist(a, f) / 0.8));
      let g: Gebiet | null = null, meer = false;
      for (let i = 1; i <= n && !g && !meer; i++) {
        const x = a.x + (f.x - a.x) * i / n, y = a.y + (f.y - a.y) * i / n;
        if (stelleErlaubt(x, y, erlaubt)) continue;
        g = gebietAn(x, y); meer = !g;
      }
      const x = g ? besitz(g.id) : null;
      h += '<p class="neg">' + (g ? g.n + (x ? ' gehört ' + besitzerText(x) + (istClan(x) ? ' (seit über 7 Tagen nicht gespielt)' : '') : ' gehört noch niemandem') + ' – kauf es oder bau drumherum.'
        : 'Hier geht keine Strecke (Meer).') + '</p>';
      if (g) h += gebietZeile(g);
    }
    if (z.ziel !== null && lineExists(z.von, z.ziel)) h += '<p class="neg">Diese Verbindung hast du schon.</p>';
    h += '<div class="btns">';
    if (z.ziel !== null) h += '<button data-act="zbau" ' + (S.money < c || lineExists(z.von, z.ziel) ? 'disabled' : '') + '>✅ Bauen · ' + fmt(c) + '</button>';
    h += '<button class="sm" data-act="zzurueck" ' + (z.pts.length > 1 ? '' : 'disabled') + '>↶ Stück zurück</button><button class="sm" data-act="zab">Abbrechen</button></div>';
    h += '<div class="mut">Maus: einfach bewegen, die Strecke folgt dem Zeiger (Klick setzt einen Punkt). Handy: mit dem Finger ziehen, mit zwei Fingern die Karte verschieben. ' +
      'Zurück über die eigene Linie fahren kürzt sie. An einer grün markierten Stadt rastet die Strecke ein – Stadt antippen oder „Bauen“. Esc = Abbrechen.</div>';
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
    let h = '<h2>🛠 Arbeiten</h2><div class="mut">Selbst erledigen bringt Geld und Erfahrung, Fehlversuche kosten nichts. Störungen senken die Einnahmen der Strecke und deiner Gebiete entlang der Strecke.</div><div class="shop-liste">';
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

  /** Knopf "Oberleitung bauen" (Panel und Shop). */
  const olKnopf = (L: any) => {
    if (L.ol) return '';
    if (level() < OBERLEITUNG.lvl) return '<button disabled>🔒 Oberleitung ab Level ' + OBERLEITUNG.lvl + '</button>';
    const c = olKosten(L);
    return '<button data-act="ol" data-arg="' + L.id + '" ' + (S.money < c ? 'disabled' : '') + '>⚡ Oberleitung bauen · ' + fmt(c) + '</button>';
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
    { t: 'Willkommen! Klicke Berlin an und kaufe sein Gebiet (Bezirk Mitte). Kaufe dann eine Kette von Gebieten (auf der Karte anklicken) bis zu einer anderen Stadt, z. B. über Brandenburg nach Leipzig. Danach bei Berlin „Strecke zeichnen“ und mit dem Zeiger über deine Gebiete bis zur Zielstadt fahren.', ok: () => S.lines.length > 0 },
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
    if (modal.kind === 'werkstatt') { box.innerHTML = werkstattHTML(); const t = zugVon(modal.zug); if (t) opts.onVorschau?.($('#lok3d'), t.type ?? 1, zugFarbe(t) ?? skinFarbe(), hatUpg(t, 'zusatzwagen')); return; }
    if (modal.kind === 'buy' || modal.kind === 'show') {
      const td = TRAINS[modal.typ], kf = ZUG_FARBEN.find((f) => f.id === (modal.farbe || 'werk'))!;
      let h = '<h2>' + td.n + '</h2><div class="lok3d" id="lok3d"></div>';
      if (modal.kind === 'buy') h += '<div class="mut">Lackierung wählen:</div>' + farbKnoepfe('kfarbe', kf.id);
      h += '<div class="row"><span>Höchstgeschwindigkeit</span><b>' + td.kmh + ' km/h' + (L && klasse(L).kmh < td.kmh ? ' (auf dieser Strecke ' + klasse(L).kmh + ')' : '') + '</b></div>';
      h += '<div class="row"><span>Miete</span><b>' + Math.round(td.rent * 100) + ' %</b></div>';
      h += '<div class="row"><span>Gleisverschleiß</span><b>' + Math.round(td.wear * 100) + ' %</b></div>';
      h += '<div class="opts">';
      if (modal.kind === 'buy') h += '<div class="mut">Strecke ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + (td.kohle ? ' · Dampflok: braucht ein Kohlelager in einer der beiden Städte' : '') + '</div><button data-act="buyok" ' + (S.money < td.cost + kf.preis ? 'disabled' : '') + '>Jetzt kaufen (' + fmt(td.cost + kf.preis) + (kf.preis ? ', davon Lack ' + fmt(kf.preis) : '') + ')</button>';
      h += '<button data-act="close">' + (modal.kind === 'buy' ? (modal.zurueck ? 'Zurück zum Shop' : 'Abbrechen') : 'Schließen') + '</button></div>';
      box.innerHTML = h;
      opts.onVorschau?.($('#lok3d'), modal.typ, modal.kind === 'buy' ? kf.farbe ?? skinFarbe() : skinFarbe());
      return;
    }
    if (modal.kind === 'fault') {
      const f = L.fault, d = DIFF[f.diff], can = unlocked(f.diff), art = FEHLER_ARTEN[f.art ?? 0];
      const aufgabe = art.thema ? 'Fachfragen „' + art.themaN + '“ (' + QUIZ_N[f.diff] + ' Fragen, mind. ' + QUIZ_NEED[f.diff] + ' richtig)' : d.task;
      box.innerHTML = '<h2>⚠ ' + art.n + ': ' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + '</h2>' +
        '<p><span class="tag" style="background:' + d.col + '">' + d.n + '</span> &nbsp;Aufgabe: <b>' + aufgabe + '</b><br>Auftragswert: <b>' + fmt(d.val) + '</b></p>' +
        '<p class="mut">Solange die Störung besteht, fahren die Züge langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen; deine Gebiete entlang der Strecke nur die Hälfte.</p>' +
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

  /** Farbfelder (Kaufdialog und Werkstatt). */
  const farbKnoepfe = (act: string, aktiv: string) => '<div class="farbwahl-zug">' + ZUG_FARBEN.map((f) =>
    '<button class="farbfeld' + (f.id === aktiv ? ' on' : '') + '" data-act="' + act + '" data-arg="' + f.id + '" title="' + f.n + (f.preis ? ' (' + fmt(f.preis) + ')' : '') + '" style="background:' +
    (f.farbe ?? 'linear-gradient(135deg,#ff7a00 50%,#2e86ab 50%)') + '"></button>').join('') + '</div>';
  /** Werkstatt eines eigenen Zuges: Lackierung und Upgrades. */
  const werkstattHTML = () => {
    const t = zugVon(modal.zug);
    if (!t) return '<p>Zug nicht gefunden.</p><div class="opts"><button data-act="close">Schließen</button></div>';
    const td = tdef(t), L = S.lines[t.line], lv = level(), aktiv = t.farbe ?? 'werk';
    let h = '<h2>🔧 Werkstatt · ' + td.n + '</h2><div class="mut">' + CITIES[L.a].n + ' ⇄ ' + CITIES[L.b].n + ' · ' + vKmh(t, L) + ' km/h · ' + t.trips + ' Fahrten</div>';
    h += '<div class="lok3d" id="lok3d"></div>';
    h += '<h3>Lackierung</h3>' + farbKnoepfe('zfarbe', aktiv) + '<div class="mut">Aktuell: ' + ZUG_FARBEN.find((f) => f.id === aktiv)!.n + '. Neulackieren kostet je nach Farbe ' + fmt(400) + '–' + fmt(600) + ', Werkslack ist kostenlos.</div>';
    h += '<h3>Upgrades</h3><div class="shop-liste">';
    ZUG_UPGRADES.forEach((u) => {
      const p = upgradePreis(td.cost, u.faktor), drin = hatUpg(t, u.id);
      h += '<div class="shop-zug' + (lv < u.lvl && !drin ? ' zu' : '') + '"><div class="shop-text"><b>' + u.n + '</b><div class="mut">' + u.text + '</div></div>' +
        (drin ? '<button disabled>✓ eingebaut</button>' : lv < u.lvl ? '<button disabled>🔒 Level ' + u.lvl + '</button>'
          : '<button data-act="zupg" data-arg="' + u.id + '" ' + (S.money < p ? 'disabled' : '') + '>' + fmt(p) + '</button>') + '</div>';
    });
    h += '</div><div class="opts"><button data-act="close">' + (modal.zurueck ? 'Zurück zum Shop' : 'Schließen') + '</button></div>';
    return h;
  };
  /** Shop: Zuege kaufen (nach Level freigeschaltet) und Strecken ausbauen. */
  const shopHTML = () => {
    const lv = level();
    let h = '<h2>🛒 Shop <span class="mut">· Level ' + lv + ' · Guthaben ' + fmt(S.money) + '</span></h2>';
    h += '<div class="tabs"><button data-act="stab" data-arg="z" class="sm' + (modal.tab === 'z' ? ' on' : '') + '">Züge</button>' +
      '<button data-act="stab" data-arg="w" class="sm' + (modal.tab === 'w' ? ' on' : '') + '">Deine Züge</button>' +
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
      h += '<p class="mut">Baue zuerst eine Strecke: Stadt anklicken → „Strecke zeichnen“.</p>';
    } else if (modal.tab === 'z') {
      if (!S.lines[modal.line]) modal.line = S.lines[0].id;
      const L = S.lines[modal.line], K = klasse(L);
      h += '<label class="shop-wahl">Zug einsetzen auf <select id="shopLine">' + S.lines.map((l: any) =>
        '<option value="' + l.id + '"' + (l.id === L.id ? ' selected' : '') + '>' + CITIES[l.a].n + ' ⇄ ' + CITIES[l.b].n + ' (' + klasse(l).n + ', ' + klasse(l).kmh + ' km/h)</option>').join('') + '</select></label>';
      if (modal.ansicht === undefined) modal.ansicht = 1;
      h += '<div class="lok3d" id="lok3d"></div><div class="shop-ansicht" id="ansichtName">' + TRAINS[modal.ansicht].n + ' · bis ' + TRAINS[modal.ansicht].kmh + ' km/h</div>';
      h += '<div class="shop-liste">';
      TRAINS.map((z, i) => ({ z, i })).sort((a, b) => a.z.lvl - b.z.lvl || a.z.cost - b.z.cost).forEach(({ z, i }) => {
        const zu = lv < z.lvl, ohneOL = z.el && !L.ol, eff = Math.min(z.kmh, K.kmh);
        h += '<div class="shop-zug' + (zu ? ' zu' : '') + (i === modal.ansicht ? ' gewaehlt' : '') + '" data-zug="' + i + '">' +
          '<button class="sm auge" data-act="sieh" data-arg="' + i + '" title="In 3D ansehen">👁</button><div class="shop-text"><b>' + z.n + '</b>' + (z.el ? ' <span class="tag" style="background:#2e86ab">⚡ elektrisch</span>' : '') +
          '<div class="mut">bis ' + z.kmh + ' km/h' + (eff < z.kmh ? ' (hier ' + eff + ')' : '') + ' · Miete ' + pct(z.rent) + ' · Gleisverschleiß ' + pct(z.wear) + ' · ' + z.len + ' Fahrzeuge</div></div>';
        h += zu ? '<button disabled>🔒 Level ' + z.lvl + '</button>'
          : ohneOL ? '<button disabled title="Erst Oberleitung auf der Strecke bauen">braucht Oberleitung</button>'
          : '<button data-act="pick" data-arg="' + L.id + ':' + i + ':shop" ' + (S.money < z.cost ? 'disabled' : '') + '>' + fmt(z.cost) + '</button>';
        h += '</div>';
      });
      h += '</div>';
    } else if (modal.tab === 'w') {
      const eigene = S.trains.filter((t: any) => t.own);
      h += '<div class="mut">Hier lackierst du einzelne Züge um und rüstest sie nach.</div><div class="shop-liste">';
      if (!eigene.length) h += '<p class="mut">Du hast noch keine eigenen Züge.</p>';
      eigene.forEach((t: any) => {
        const L2 = S.lines[t.line], f = zugFarbe(t) ?? skinFarbe();
        h += '<div class="shop-zug"><span class="farbpunkt" style="background:' + (f ?? tdef(t).col) + '"></span><div class="shop-text"><b>' + tdef(t).n + '</b><div class="mut">' + CITIES[L2.a].n + ' ⇄ ' + CITIES[L2.b].n +
          ' · ' + vKmh(t, L2) + ' km/h · ' + (t.upg || []).length + ' Upgrades' + (kohleMangel(t, L2) ? ' · ⚠ Kohlemangel' : '') + '</div></div><button data-act="werk" data-arg="' + t.id + ':shop">🔧 Werkstatt</button></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="shop-liste">';
      KLASSEN.forEach((k) => {
        h += '<div class="shop-zug' + (lv < k.lvl ? ' zu' : '') + '"><div><b>' + k.n + '</b><div class="mut">max. ' + k.kmh + ' km/h' +
          ' · Verschleiß ' + pct(k.wear) + ' · Trassenentgelt ' + pct(k.entgelt) + '</div></div><span class="mut">' + (lv < k.lvl ? '🔒 ab Level ' + k.lvl : '✓ frei') + '</span></div>';
      });
      h += '</div><h3>Deine Strecken</h3><div class="shop-liste">';
      S.lines.forEach((l: any) => {
        h += '<div class="shop-zug"><div><b>' + CITIES[l.a].n + ' ⇄ ' + CITIES[l.b].n + '</b><div class="mut">' + klasse(l).n + ' · ' + klasse(l).kmh + ' km/h · Zustand ' + Math.round(l.cond) + ' %' + (l.ol ? ' · ⚡' : '') + '</div></div><div class="knoepfe">' + ausbauKnopf(l) + olKnopf(l) + '</div></div>';
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
    if (RO && a !== 'show' && a !== 'close' && a !== 'gwahl' && a !== 'stadtzu') return;
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
    else if (a === 'buyok') { const m = modal; closeModal(); buyTrain(m.line, m.typ, m.farbe || 'werk'); }
    else if (a === 'kfarbe') { modal.farbe = arg; renderModal(); }
    else if (a === 'werk') { const [id, von] = arg!.split(':'); modal = { kind: 'werkstatt', zug: +id, zurueck: von === 'shop' }; renderModal(); }
    else if (a === 'zfarbe') { faerbeZug(modal.zug, arg!); renderModal(); }
    else if (a === 'zupg') { ruesteNach(modal.zug, arg!); renderModal(); }
    else if (a === 'ol') { baueOberleitung(+arg!); if (modal?.kind === 'shop') renderModal(); }
    else if (a === 'lager') baueKohlelager(+arg!);
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
    else if (a === 'stadtzu') sel = { city: null, line: null, gebiet: null };
    else if (a === 'gwahl') { if (!(e.target as HTMLElement).closest('button')) sel = { city: null, line: null, gebiet: +arg! }; }
    else if (a === 'gkauf') {
      const g = gebietMitId(+arg!), x = besitz(+arg!);
      if (!g) return;
      const preis = x ? x.basis * 3 : g.basis;
      if (S.money < preis) toast('Zu wenig Guthaben (' + fmt(preis) + ' nötig).');
      else opts.onGebiet?.(g.id, g.basis);
    }
    else if (a === 'zeichne') starteZeichnen(+arg!);
    else if (a === 'zbau') baueZeichnung();
    else if (a === 'zzurueck') zeichnungZurueck();
    else if (a === 'zab') zeichnung = null;
    else if (a === 'submit') submitReading();
    else if (a === 'next') nextReading();
    else if (a === 'close') {
      if (modal?.kind === 'buy' && modal.zurueck) { opts.onVorschau?.(null, 0); modal = { kind: 'shop', tab: 'z', line: modal.line, ansicht: modal.typ }; renderModal(); }
      else if (modal?.kind === 'werkstatt' && modal.zurueck) { opts.onVorschau?.(null, 0); modal = { kind: 'shop', tab: 'w' }; renderModal(); }
      else closeModal();
    }
    else if (a === 'reset') { if (confirm('Spielstand wirklich löschen?')) { opts.onReset?.(); fresh(); sel = { city: null, line: null, gebiet: null }; zeichnung = null; tutStart = 0; } }
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
    money: S.money, bezirkSumme: S.bezirkSumme, time: S.time, vis: S.vis, skill: S.skill, xp: S.xp, pokale: S.pokale, skins: S.skins, skin: S.skin, ausr: S.ausr, lager: S.lager, mode: S.mode, faultIn: S.faultIn, tut: S.tut, faultsFixed: S.faultsFixed, passes: S.passes,
    anyFault: S.anyFault, openedLine: S.openedLine, nextId: S.nextId,
    lines: S.lines.map((l: any) => ({ a: l.a, b: l.b, p: l.p, cond: l.cond, inF: l.inF, inO: l.inO, up: l.up, rep: l.rep, fault: l.fault, color: l.color, cls: l.cls, ol: l.ol, verlust: l.verlust, inspAb: l.inspAb })),
    own: S.trains.filter((t: any) => t.own),
  });
  const save = () => { if (RO || !alive) return; opts.onSave(serialize(), S.money); };
  const load = (d: any) => {
    try {
      if (!d || !Array.isArray(d.lines)) return false;
      fresh();
      // vis auf die aktuelle Staedteliste bringen (alte Staende kennen weniger Staedte).
      Object.assign(S, { money: Math.max(0, d.money || 0), bezirkSumme: d.bezirkSumme || 0, time: d.time, vis: CITIES.map((_, i) => !!d.vis?.[i]), skill: d.skill, mode: d.mode ?? 0, faultIn: d.faultIn ?? modeInterval(d.mode ?? 0), tut: d.tut, faultsFixed: d.faultsFixed, passes: d.passes, anyFault: d.anyFault, openedLine: d.openedLine, nextId: d.nextId });
      d.lines.forEach((o: any) => { const L: any = addLine(o.a, o.b, Array.isArray(o.p) ? o.p : undefined); Object.assign(L, { cond: o.cond, inF: o.inF, inO: o.inO, up: o.up, rep: o.rep, fault: o.fault, color: o.color, cls: o.cls ?? 1, ol: o.ol ?? (o.cls ?? 1) >= 1, verlust: o.verlust || 0, inspAb: o.inspAb || 0 }); });
      S.trains = d.own || [];
      // Alte Staende ohne Erfahrung: aus dem bisherigen Fortschritt schaetzen. Alte Strecken gelten als Hauptbahn (cls 1, s. o.).
      S.pokale = d.pokale ?? 0; S.skins = d.skins ?? ['standard']; S.skin = d.skin ?? 'standard'; S.ausr = d.ausr ?? []; S.lager = d.lager ?? [];
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
    welt: () => ({ S, sel, CITIES, DIFF, posAt, skin: skinFarbe(), welt, zeichnung, gebietFarbe, gebietSchluessel }),
    setzeWelt: (w: any) => {
      welt = w;
      besitzNach = new Map((w?.bezirke || []).filter((x: any) => x.stadt === GEBIET_STADT).map((x: any) => [x.bezirk, x]));
      gebietSchluessel = JSON.stringify([w?.ich, [...besitzNach.values()].map((x) => [x.bezirk, x.ownerId, x.clanFarbe, x.aktiv])]);
    },
    bezahlt: (preis: number, text: string) => { S.money = Math.max(0, S.money - preis); addXp(8); toast(text, 3500); save(); },
    gutschrift: (betrag: number, text: string, xp = 0) => {
      S.money += betrag;
      toast(text + (betrag ? ' +' + fmt(betrag) : '') + (xp ? ' +' + xp + ' Erfahrung' : ''), 5000);
      if (xp) addXp(xp);
      save();
    },
    meldung: (text: string) => toast(text, 4000),
    belohnung: (xp: number, pokale: number, text: string) => {
      S.pokale = (S.pokale || 0) + pokale;
      toast(text + ' +' + pokale + ' 🏆, +' + xp + ' Erfahrung', 4000);
      addXp(xp);
      save();
    },
    klickWelt: (x: number, y: number) => klick({ x, y }, true),
    zeigerWelt: (x: number, y: number) => { if (zeichnung && !modal) zeichneZu({ x, y }, true); },
    destroy: () => {
      save();
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(saveTimer);
      clearTimeout(toastT);
      ro.disconnect();
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerdown', onCanvasDown);
      window.removeEventListener('pointerup', onCanvasUp);
      root.removeEventListener('pointerdown', onActionDown);
      root.removeEventListener('keydown', onEnter);
      root.removeEventListener('change', onChange);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
    },
  };
}
