/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gleisbau Tycoon -- Spiel-Engine (Canvas). Portiert aus der Einzeldatei-Demo.
 * Haengt an einem Wurzel-Element (siehe tycoon.page.html), speichert ueber Callbacks
 * (Server statt localStorage) und kennt einen Nur-Lesen-Modus fuer fremde Netze.
 */

import type { TycoonWeltDaten } from './tycoon-3d';
import { CITIES, KARTE_H, KARTE_W, spielerFarbe, zeichneKarte } from './tycoon-karte';
import {
  beschrifteGebiete, BUNDESLAENDER, Gebiet, GEBIET_QUELLE, GEBIET_STADT, gebietAn, gebieteIm, gebietMitId, gebietVonStadt, innererPunkt, kurzName, LAND_NAMEN, regionVon,
  stelleErlaubt, svgPfad, umrandeGebiet, zeichneGebiete,
} from './tycoon-gebiete';
import { HOEHEN_QUELLE, ladeHoehen, reliefBild } from './tycoon-hoehen';
import { FahrtErgebnis, starteFahrt, zeichneLegende } from './tycoon-inspektion';
import { ABZEICHEN } from './tycoon-album';
import { BEITRAEGE, CLAN_PROJEKTE, SCHICHT_FRAGEN, SCHICHT_PAUSE, SCHICHT_WERT } from './tycoon-clanprojekte';
import { Ausschreibung, AUSSCHREIBUNG_TAKT, FRIST, GEBOTE, MALUS, MITBEWERBER, Vertrag, VERTRAG, VERSPRECHEN } from './tycoon-ausschreibung';
import { kapazitaet, MAX_FREMD, puenktFaktor, SIGNALE, ZWEIGLEISIG } from './tycoon-kapazitaet';
import { Auftrag, AUFTRAG_TAKT, GUETERBAHNHOF, MAX_AUFTRAEGE, WAREN, wareVonGebiet, wareVonStadt } from './tycoon-gueter';
import { LEHRGANG_N, LEHRGANG_NEED, lehrgangPreis, lernstand, lernstandFuer, MAX_STUFE, ROLLEN } from './tycoon-personal';
import { MASSNAHMEN, SPERRUNGEN, VORBEREITUNG_FRAGEN, VORBEREITUNG_SPAREN } from './tycoon-baustelle';
import { JAHRESZEITEN, jahreszeitAus, SCHUTZ, TOENUNG, WETTER, zeichneWetter } from './tycoon-wetter';
import { HOEHEN } from './tycoon-hoehen-meta';
import { AUSRUESTUNG, BAHNHOF, KLASSEN, KOHLELAGER, TESTMODUS, LEVEL_XP, levelAus, OBERLEITUNG, SKINS, upgradePreis, ZUEGE, ZUG_FARBEN, ZUG_UPGRADES } from './tycoon-zuege';

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
  /** Neue Strecke gebaut zwischen Knoten a und b (Stadt oder Bahnhof; Server verteilt den Clan-Bonus). */
  onVerbindung?: (a: number, b: number, nameA: string, nameB: string, gebiete: number[]) => void;
  /** Clan-Grossprojekt starten bzw. beitragen (Server); Erfolg meldet die Seite ueber handle.clanBezahlt zurueck. */
  onClanProjekt?: (art: string) => void;
  onClanBeitrag?: (betrag: number, schicht: boolean) => void;
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
  /** Beitrag zum Clan-Projekt angenommen: Betrag abziehen. */
  clanBezahlt: (betrag: number, text: string) => void;
  /** Klick an einer Stelle der 2D-Welt (KARTE_W x KARTE_H), z. B. aus der 3D-Ansicht. */
  /** Klick aus der 3D-Ansicht; kk = Bildschirmpixel je Welteinheit an der Klickstelle. */
  klickWelt: (x: number, y: number, kk: number) => void;
  /** Zeiger bewegt sich ueber diese Stelle der 2D-Welt (3D-Ansicht): verlaengert eine gerade gezeichnete Strecke. */
  zeigerWelt: (x: number, y: number, kk: number) => void;
  /** Zeiger beim Zeichnen losgelassen (3D-Ansicht): am Ziel wird gebaut. */
  losgelassen: () => void;
}

export function startTycoon(root: HTMLElement, opts: TycoonOptions): TycoonHandle {
  const RO = opts.readOnly;

  /* ---------- Konfiguration / Balancing ---------- */
  const CFG = {
    startMoney: 50000, lineCostPerUnit: TESTMODUS ? 0 : 5, trainCost: 2500, trainSpeed: 55, foreignFee: 0.2,
    foreignSpawn: [12, 24], ownRent: 0.12, ownUpkeep: 0.04, upkeepPerSec: 0.004, wearPerPass: 0.9,
    careCostPerUnit: TESTMODUS ? 0 : 1.2, daySec: 60, unlockNeed: 3,
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
    // Wetter-Stoerungen (tycoon-wetter.ts); Index wird im Spielstand gespeichert -- nur hinten anhaengen.
    { n: 'Gleisverwerfung (Hitze)', thema: 'schiene', themaN: 'Schiene' },
    { n: 'Baum im Gleis (Sturm)', thema: 'arbeitssicherheit', themaN: 'Arbeitssicherheit' },
    { n: 'Eingefrorene Weiche', thema: 'lf13', themaN: 'Weichen' },
    { n: 'Unterspülte Bettung (Starkregen)', thema: 'bettung', themaN: 'Bettung' },
    // Abzweigstellen (Weichen)
    { n: 'Weichenstörung', thema: 'lf13', themaN: 'Weichen' },
  ];
  const FEHLER_WEICHE = 10;
  /** Zufaellige (Verschleiss-)Stoerungen nur aus diesen Arten; die uebrigen bringt das Wetter. */
  const FEHLER_VERSCHLEISS = 6;
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
  /**
   * Streckenenden ("Knoten"): 0..99 = Stadt (Index in CITIES), ab BF0 = eigener Bahnhof mit der Kennung (Nummer - BF0).
   * Bahnhoefe stehen in S.bf als { id, g (Gebiet), x, y }, hoechstens einer je Gebiet.
   */
  const BF0 = 1000;
  /** Ab ABZ0: Abzweigstelle (Weiche auf freier Strecke) aus S.abz als { id, x, y }. */
  const ABZ0 = 50000;
  const abzMit = (id: number) => (S.abz || []).find((z: any) => z.id === id);
  const abzName = (z: any) => { const g = gebietAn(z.x, z.y); return 'Abzw. ' + (g ? kurzName(g) : '?'); };
  const bfMit = (id: number) => (S.bf || []).find((b: any) => b.id === id);
  const bfName = (b: any) => { const g = gebietMitId(b.g); return 'Bf ' + (g ? kurzName(g) : '?'); };
  const knoten = (i: number): { n: string; x: number; y: number } => {
    if (i < BF0) return CITIES[i];
    if (i >= ABZ0) { const z = abzMit(i - ABZ0); return z ? { n: abzName(z), x: z.x, y: z.y } : { n: '?', x: 0, y: 0 }; }
    const b = bfMit(i - BF0);
    return b ? { n: bfName(b), x: b.x, y: b.y } : { n: '?', x: 0, y: 0 };
  };
  const knotenGebiet = (i: number): Gebiet | null => (i < BF0 ? gebietVonStadt(i) : i >= ABZ0 ? (abzMit(i - ABZ0) ? gebietAn(abzMit(i - ABZ0).x, abzMit(i - ABZ0).y) : null) : gebietMitId(bfMit(i - BF0)?.g) ?? null);
  /** Darf an Stadt/Bahnhof c eine Strecke beginnen/enden? Nur wenn das Gebiet dir oder einem aktiven Clan-Mitglied gehoert. */
  const praesenz = (c: number) => { const g = knotenGebiet(c); return !welt || (!!g && erlaubt(g)); };
  /** Bahnhof im Gebiet g (oder undefined). */
  const bfIn = (g: number) => (S.bf || []).find((b: any) => b.g === g);
  /** Strecken, die an Bahnhof b enden. */
  const bfStrecken = (b: any) => S.lines.filter((l: any) => l.a === BF0 + b.id || l.b === BF0 + b.id);
  /** Einnahmen eines Bahnhofs pro Sekunde: je angeschlossener Strecke, gemindert durch Wartungsstau, halbiert bei Stoerung. */
  const bfRate = (b: any) => bfStrecken(b).reduce((s: number, L: any) => s + BAHNHOF.proStrecke * condFaktor(L) * (L.fault || gesperrt(L) ? 0.5 : 1), 0);
  /** Clan-Verbindung: eine eigene Strecke durch dieses Gebiet fuehrt auch ueber Gebiete von Clan-Mitgliedern. */
  const clanBonus = (id: number) => !!welt?.ich?.clanId && S.lines.some((l: any) => l.gebiete.includes(id) && l.gebiete.some((o: number) => istClan(besitz(o))));
  /** Einnahmen eines eigenen Gebiets pro Sekunde (nur angeschlossen; Clan-Verbindung +25 %, Stoerung auf einer Strecke hindurch halbiert). */
  const gebietRate = (id: number) => {
    const x = besitz(id);
    if (!welt || !istMein(x) || !angeschlossen(id)) return 0;
    const stoerung = S.lines.some((l: any) => (l.fault || gesperrt(l)) && l.gebiete.includes(id));
    return x.basis * 0.0015 * (stoerung ? 0.5 : 1) * (clanBonus(id) ? 1.25 : 1);
  };
  const meineGebiete = (): number[] => [...besitzNach.values()].filter(istMein).map((x) => x.bezirk);
  /** Wem gehoert's, als Text. */
  const besitzerText = (x: any) => !x ? 'frei' : istMein(x) ? 'deins' : x.ownerName + (x.clanKuerzel ? ' [' + x.clanKuerzel + ']' : '');
  const gebietArt = (g: Gebiet) => ['Landkreis', 'Kreisfreie Stadt', 'Bezirk', 'Region'][g.typ] + ' · ' + (g.land === 'DE' ? BUNDESLAENDER[g.bl] : LAND_NAMEN[g.land] ?? g.land);
  /** Was ein Gebiet den Spieler kostet (Testmodus: nichts; der Server merkt sich trotzdem den Grundpreis fuer die Einnahmen). */
  const gebietPreis = (n: number) => (TESTMODUS ? 0 : n);
  /* ---------- Wetter und Jahreszeiten (tycoon-wetter.ts) ---------- */
  const jahreszeit = () => jahreszeitAus(S.time, CFG.daySec);
  const wetterArt = () => (S.wetter ? WETTER[S.wetter.art] : null);
  const hatSchutz = (L: any, id: string) => (L.schutz || []).includes(id);
  /** Strecke fuehrt durch das Bundesland der Wetterlage und hat keinen passenden Schutz. */
  const wetterTrifft = (L: any) => { const w = wetterArt(); return !!w && !hatSchutz(L, w.schutz) && L.gebiete.some((id: number) => gebietMitId(id)?.bl === S.wetter.bl); };
  const wetterTempo = (L: any) => (wetterTrifft(L) ? wetterArt()!.tempo : 1);
  const wetterEinnahmen = (L: any) => (wetterTrifft(L) ? wetterArt()!.einnahmen : 1);
  /** Fertige Clan-Grossprojekte (vom Server) wirken fuer alle Mitglieder. */
  const clanBonus2 = (id: string) => (welt?.clanBoni || []).includes(id);
  /* ---------- Sammelalbum (tycoon-album.ts) ---------- */
  const zaehle = (k: string, n = 1) => { S.stats = S.stats || {}; S.stats[k] = (S.stats[k] || 0) + n; };
  const stat = (k: string) => (S.stats || {})[k] || 0;
  /** Zugtypen, die man schon einmal besessen hat (S.album), plus die aktuellen. */
  const gesammelt = (): number[] => [...new Set([...(S.album || []), ...S.trains.filter((t: any) => t.own).map((t: any) => t.type ?? 1)])] as number[];
  const abzeichenErfuellt = (id: string): boolean => {
    switch (id) {
      case 'strecke1': return S.lines.length >= 1;
      case 'strecke10': return S.lines.length >= 10;
      case 'zuege5': return gesammelt().length >= 5;
      case 'zuegeAlle': return gesammelt().length >= TRAINS.length;
      case 'stoerung25': return (S.faultsFixed || 0) >= 25;
      case 'perfekt': return stat('perfekt') > 0;
      case 'jahr': return (S.stats?.jzGesehen || []).length >= 4;
      case 'wetterfest': return S.lines.some((L: any) => SCHUTZ.every((x) => hatSchutz(L, x.id)));
      case 'baustelle5': return stat('baustellen') >= 5;
      case 'ausbilder': return ROLLEN.some((r) => stufe(r.id) >= MAX_STUFE);
      case 'gueter10': return stat('auftraege') >= 10;
      case 'zweigleisig': return S.lines.some((L: any) => (L.gleise || 1) === 2);
      case 'etcs': return S.lines.some((L: any) => (L.signal || 0) >= 2);
      case 'netz': return S.trains.some((t: any) => (t.route?.length || 0) >= 3);
      case 'vertrag': return stat('vertraege') > 0;
      case 'clan': return stat('clan') > 0;
    }
    return false;
  };
  let albumT = 0;
  /** Alle paar Sekunden: neue Zugtypen ins Album, erfuellte Abzeichen auszahlen. */
  const albumTakt = (dt: number) => {
    albumT -= dt;
    if (albumT > 0) return;
    albumT = 2;
    S.album = gesammelt();
    const jz = jahreszeit(); S.stats = S.stats || {}; S.stats.jzGesehen = [...new Set([...(S.stats.jzGesehen || []), jz])];
    S.abzeichen = S.abzeichen || [];
    for (const a of ABZEICHEN) if (!S.abzeichen.includes(a.id) && abzeichenErfuellt(a.id)) {
      S.abzeichen.push(a.id); S.money += a.lohn; addXp(15);
      toast('🏅 Abzeichen „' + a.n + '“: ' + a.text + ' (+' + fmt(a.lohn) + ')', 5000);
      save();
      break;
    }
  };
  const albumHTML = () => {
    const hatT = new Set(gesammelt()), ab = S.abzeichen || [];
    let h = '<h2>🏅 Sammelalbum</h2><h3>Züge (' + hatT.size + ' / ' + TRAINS.length + ')</h3><div class="mut">Jeden Zugtyp einmal besitzen – auch wenn du ihn später wieder verkaufst, bleibt er im Album.</div><div class="album">';
    TRAINS.forEach((z, i) => {
      const da = hatT.has(i);
      h += '<div class="album-karte' + (da ? '' : ' zu') + '"><span class="farbpunkt" style="background:' + (da ? z.col : '#bbb') + '"></span><b>' + (da ? z.n : '???') + '</b><div class="mut">' + (da ? z.kmh + ' km/h' + (z.gueter ? ' · ' + z.gueter.map((w) => WAREN[w].icon).join('') : '') : 'ab Level ' + z.lvl) + '</div>' +
        (da && !RO ? '<button class="sm auge" data-act="show" data-arg="' + i + '" title="In 3D ansehen">👁</button>' : '') + '</div>';
    });
    h += '</div><h3>Abzeichen (' + ab.length + ' / ' + ABZEICHEN.length + ')</h3><div class="album">';
    ABZEICHEN.forEach((a) => {
      const da = ab.includes(a.id);
      h += '<div class="album-karte' + (da ? '' : ' zu') + '"><span style="font-size:22px">' + (da ? a.icon : '🔒') + '</span><b>' + a.n + '</b><div class="mut">' + a.text + ' · ' + fmt(a.lohn) + '</div></div>';
    });
    return h + '</div><div class="opts"><button data-act="close">Schließen</button></div>';
  };
  /* ---------- Kapazitaet (tycoon-kapazitaet.ts) ---------- */
  const kap = (L: any) => kapazitaet(L.gleise || 1, L.signal || 0);
  const zuegeAuf = (L: any) => S.trains.filter((t: any) => t.line === L.id).length;
  /** Ueberlastet: mehr Zuege als Kapazitaet -> alle langsamer (hoechstens auf die Haelfte). */
  const kapTempo = (L: any) => { const n = zuegeAuf(L), k = kap(L); return n > k ? Math.max(0.5, k / n) : 1; };
  const puenkt = (L: any) => L.puenkt ?? 100;
  const kapPreis = (L: any, jeEinheit: number) => (TESTMODUS ? 0 : Math.round(L.len * jeEinheit / 10) * 10);
  /* ---------- Gueterverkehr (tycoon-gueter.ts) ---------- */
  /** Ware, die an einem Streckenende (Stadt oder eigener Bahnhof) geladen wird. */
  const wareVon = (c: number) => (c < BF0 ? wareVonStadt(c) : wareVonGebiet(bfMit(c - BF0)?.g ?? 0));
  const hatGbf = (c: number) => (S.gbf || []).includes(c);
  const gbfPreis = () => (TESTMODUS ? 0 : GUETERBAHNHOF.preis);
  const laedt = (t: any, ware: number) => !!t.own && (tdef(t).gueter || []).includes(ware);
  /* ---------- Personal (tycoon-personal.ts) ---------- */
  const stufe = (id: string): number => (S.personal || {})[id] || 0;
  /** Wirkung einer Rolle als Anteil (z. B. 0,12 = 12 %). */
  const personal = (id: string) => stufe(id) * (ROLLEN.find((r) => r.id === id)?.proStufe ?? 0) / 100;
  /** Fragen je Themenquiz-Thema (fuer den Lernstand), einmal geladen. */
  const themenAnzahl: Record<string, number> = {};
  fetch('assets/themenquiz/topics.json').then((r) => r.json()).then((l: any[]) => l.forEach((t) => (themenAnzahl[t.topicId] = t.questionCount))).catch(() => undefined);
  /* ---------- Baustellen (tycoon-baustelle.ts) ---------- */
  const bauSperrung = (L: any) => (L.bau ? SPERRUNGEN[L.bau.sp] : null);
  /** Strecke wegen Totalsperrung ausser Betrieb. */
  const gesperrt = (L: any) => bauSperrung(L)?.tempo === 0;
  const bauTempo = (L: any) => bauSperrung(L)?.tempo ?? 1;
  const bauEinnahmen = (L: any) => bauSperrung(L)?.einnahmen ?? 1;
  const schutzPreis = (L: any, sch: { jeEinheit: number }) => (TESTMODUS ? 0 : Math.round(L.len * sch.jeEinheit / 10) * 10);
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
      bf: [], bfNext: 1, skill: [0, 0, 0, 0], xp: 0, pokale: 0, skins: ['standard'], skin: 'standard', ausr: [], mode: 0, faultIn: modeInterval(0), wetter: null, wetterIn: 180, jz: 0, tut: 0, tutT: 0, faultsFixed: 0, passes: 0, anyFault: false, openedLine: false, nextId: 1 };
    S.vis[START_CITY] = true;
    revealNear(START_CITY, 3);
  };
  const revealNear = (i: number, n: number) => {
    const c = knoten(i);
    CITIES.map((o, j) => ({ j, d: dist(c, o) })).filter(o => !S.vis[o.j]).sort((a, b) => a.d - b.d).slice(0, n).forEach(o => S.vis[o.j] = true);
  };

  /* ---------- Geometrie ---------- */
  const makeGeo = (a: number, b: number) => {
    const lo = a < b ? knoten(a) : knoten(b), hi = a < b ? knoten(b) : knoten(a);
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
  const lineCost = (geo: any) => Math.round(geo.len * CFG.lineCostPerUnit * (clanBonus2('bruecke') ? 0.9 : 1) / 10) * 10;

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
    if (!praesenz(c)) { toast('Das Gebiet von ' + knoten(c).n + ' gehört weder dir noch einem aktiven Clan-Mitglied – kauf es zuerst.', 4500); return; }
    zeichnung = { von: c, pts: [{ x: knoten(c).x, y: knoten(c).y }], ziel: null, fehl: null, ver: 0 };
    sel = { city: null, line: null, gebiet: null };
    toast('Jetzt auf ' + knoten(c).n + ' drücken, gedrückt halten und bis zum Ziel ziehen – dort loslassen.', 4500);
  };
  /** Moegliche Streckenenden: aufgedeckte Staedte und eigene Bahnhoefe (Bahnhoefe mit kleinerem Fangradius). */
  const alleKnoten = (): { i: number; x: number; y: number; r: number }[] => [
    ...CITIES.map((c, i) => ({ i, x: c.x, y: c.y, r: 1 })).filter((c) => S.vis[c.i]),
    ...(S.bf || []).map((b: any) => ({ i: BF0 + b.id, x: b.x, y: b.y, r: 0.6 })),
    ...(S.abz || []).map((z: any) => ({ i: ABZ0 + z.id, x: z.x, y: z.y, r: 0.5 })),
  ];
  /** Naechster Knoten (Stadt/Bahnhof) im Fangradius um p, ausser 'ohne'; -1 = keiner. */
  const knotenBei = (p: { x: number; y: number }, radius: number, ohne = -1) => {
    let best = -1, bd = Infinity;
    for (const c of alleKnoten()) { const d = dist(c, p); if (c.i !== ohne && d < radius * c.r && d < bd) { bd = d; best = c.i; } }
    return best;
  };
  /** Zeiger steht an p: Strecke dorthin verlaengern (so weit erlaubt), an einer Zielstadt einrasten, beim Zurueckfahren kuerzen. */
  /** kk = Bildschirmpixel je Welteinheit (2D: Kartenzoom k, 3D: an der Zeigerstelle gemessen). */
  const zeichneZu = (p: { x: number; y: number }, kk = k) => {
    const z = zeichnung;
    if (!z) return;
    const vorher = z.pts.length + ':' + z.ziel + ':' + !!z.fehl;
    // Zurueck ueber die eigene Linie: dort abschneiden.
    for (let i = 0; i < z.pts.length - 4; i++) if (dist(z.pts[i], p) < 2) { z.pts.length = i + 1; break; }
    let letzter = z.pts[z.pts.length - 1];
    const radius = 16 / kk;
    const ziel = knotenBei(p, radius, z.von);
    z.ziel = null;
    if (ziel >= 0 && praesenz(ziel) && erlaubtBis(letzter, knoten(ziel)) === 1) { z.ziel = ziel; z.fehl = null; }
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
    return l + (z.ziel !== null ? dist(z.pts[z.pts.length - 1], knoten(z.ziel!)) : 0);
  };
  /** Kontrollpunkte der fertigen Zeichnung (bis zur Zielstadt). */
  const zeichnungPunkte = (z: NonNullable<typeof zeichnung>) => duenneAus([...z.pts, { x: knoten(z.ziel!).x, y: knoten(z.ziel!).y }]);
  const baueZeichnung = () => {
    const z = zeichnung;
    if (!z || z.ziel === null) return;
    const a = z.von, b = z.ziel;
    if (lineExists(a, b)) { toast('Die Strecke ' + knoten(a).n + ' ⇄ ' + knoten(b).n + ' gehört dir schon.'); return; }
    if (!praesenz(b)) { toast('Das Gebiet von ' + knoten(b).n + ' gehört weder dir noch einem aktiven Clan-Mitglied.', 4500); return; }
    const p = zeichnungPunkte(z), cost = lineCost(geoAusPunkten(p));
    if (S.money < cost) { toast('Zu wenig Guthaben (' + fmt(cost) + ' nötig).'); return; }
    S.money -= cost;
    addLine(a, b, p);
    revealNear(a, 2); revealNear(b, 2);
    addXp(15);
    opts.onVerbindung?.(a, b, knoten(a).n, knoten(b).n, [knotenGebiet(a)?.id, knotenGebiet(b)?.id].filter((g): g is number => g !== undefined));
    toast('Strecke ' + knoten(a).n + ' ⇄ ' + knoten(b).n + ' gebaut (−' + fmt(cost) + ')');
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
    toast(knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' ausgebaut: ' + n.n + ' (' + n.kmh + ' km/h, −' + fmt(c) + ')');
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
    toast('⚡ Oberleitung ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' gebaut (−' + fmt(c) + ')');
    save();
  };
  /** Bahnhof im eigenen Gebiet bauen: an der angeklickten Stelle, sonst gut im Inneren des Gebiets. */
  const baueBahnhof = (gid: number, punkt?: { x: number; y: number } | null) => {
    const g = gebietMitId(gid);
    if (!g) return;
    if (!istMein(besitz(gid))) { toast('Einen Bahnhof kannst du nur in deinem eigenen Gebiet bauen.'); return; }
    if (bfIn(gid)) { toast('In ' + g.n + ' steht schon dein Bahnhof.'); return; }
    if (S.money < BAHNHOF.preis) { toast('Zu wenig Guthaben (' + fmt(BAHNHOF.preis) + ' nötig).'); return; }
    // Nicht direkt am Rand und nicht auf einer Spielstadt.
    const ok = (q: { x: number; y: number }) => gebietAn(q.x, q.y)?.id === gid && CITIES.every((c) => dist(c, q) > 5);
    const q = punkt && ok(punkt) ? punkt : innererPunkt(g);
    S.bf = S.bf || [];
    S.bfNext = S.bfNext || 1;
    const b = { id: S.bfNext++, g: gid, x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 };
    S.money -= BAHNHOF.preis; S.bf.push(b); addXp(10);
    toast('🚉 ' + bfName(b) + ' gebaut (−' + fmt(BAHNHOF.preis) + ')' + (S.bf.length < 2 ? ' – jetzt „Strecke herstellen“!' : ''), 4000);
    sel = { city: null, line: null, gebiet: null, bf: b.id };
    save();
  };
  /** Bahnhof ohne Strecken abreissen (die Haelfte des Preises kommt zurueck). */
  const reisseBahnhofAb = (id: number) => {
    const b = bfMit(id);
    if (!b || bfStrecken(b).length) return;
    S.bf = S.bf.filter((x: any) => x !== b);
    S.money += BAHNHOF.preis / 2;
    toast(bfName(b) + ' abgerissen (+' + fmt(BAHNHOF.preis / 2) + ')');
    sel = { city: null, line: null, gebiet: b.g };
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
    const wl = S.lines.map((l: any) => (l.bau ? 0 : 1 + (100 - l.cond) / 25 + (l.risiko || 0) * 1.5));
    if (!wl.some((w: number) => w > 0)) return;
    let r = Math.random() * wl.reduce((a: number, b: number) => a + b), li = 0;
    while (!wl[li]) li++;
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
    // An Abzweigstellen geht ab und zu die Weiche kaputt (Stoerung dann nahe dem Abzweig).
    const weiche = (L.a >= ABZ0 || L.b >= ABZ0) && Math.random() < 0.3;
    L.fault = weiche ? { t: L.a >= ABZ0 ? 0.08 : 0.92, diff, art: FEHLER_WEICHE } : { t: rand(.25, .75), diff, art: ri(0, FEHLER_VERSCHLEISS - 1) };
    S.anyFault = true;
    S.faultIn = modeInterval(S.mode) * (hat('schleifzug') ? 1.3 : 1);
    toast('⚠ ' + FEHLER_ARTEN[L.fault.art].n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' (' + DIFF[diff].n + ')');
  };
  const resolveFault = (L: any, how: string) => {
    const d = DIFF[L.fault.diff];
    // Fehlversuch kostet nichts: Stoerung bleibt einfach bestehen.
    if (how === 'self-fail') { addXp(3); toast('Nicht geschafft – die Störung bleibt. Versuch es nochmal oder beauftrage die Fremdfirma.', 4000); return; }
    if (how === 'firm' && S.money < firmaPreis(d)) { toast('Zu wenig Guthaben für die Fremdfirma.'); return; }
    if (how === 'firm') { S.money -= firmaPreis(d); L.rep += firmaPreis(d); L.cond = Math.min(100, L.cond + 10); addXp(5); toast('Fremdfirma erledigt die Störung (−' + fmt(firmaPreis(d)) + ')'); }
    if (how === 'self-ok') { const b = d.val * d.share * (hat('messzug') ? 1.5 : 1) * (1 + personal('gleisbauer')); S.money += b; L.cond = Math.min(100, L.cond + 20); S.skill[L.fault.diff]++; addXp(20 + 10 * L.fault.diff); toast('Selbst erledigt! Fremdkosten gespart, Bonus +' + fmt(b)); }
    L.fault = null; S.faultsFixed++; L.risiko = Math.max(0, (L.risiko || 0) - 1);
  };
  const unlocked = (d: number) => TESTMODUS || d === 0 || S.skill[d - 1] >= CFG.unlockNeed;
  /** Kosten der Fremdfirma (Testmodus: gratis). */
  const firmaPreis = (d: any) => (TESTMODUS ? 0 : d.val);

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
        if (!gesperrt(L) && S.trains.filter((t: any) => t.line === L.id && !t.own).length < Math.min(MAX_FREMD, Math.max(1, kap(L) - S.trains.filter((t: any) => t.line === L.id && t.own).length))) spawnForeign(L);
      }
    }
    // Stoerungen: hoechstens eine pro Intervall aktiver Spielzeit (echte Zeit, nicht Spielgeschwindigkeit).
    if (!S.anyFault) {
      if (S.passes >= 4) createFault(true);   // erste Stoerung = Tutorial, immer leicht
    } else {
      S.faultIn -= Math.min(dtReal, .25);
      if (S.faultIn <= 0) createFault(false);   // wartet, solange noch eine Stoerung offen ist
    }
    wetterTakt(dt);
    for (const L of S.lines) if (L.bau && S.time >= L.bau.bis) beendeBau(L);
    for (const L of S.lines) { const ziel = kapTempo(L) < 1 ? 35 : 100; L.puenkt = puenkt(L) + (ziel - puenkt(L)) * Math.min(1, dt * 0.03); }
    auftragTakt(dt);
    ausschreibungTakt(dt);
    albumTakt(dt);
    // Gebiete bringen laufend Geld (nur angeschlossene; Stoerung auf einer Strecke hindurch halbiert).
    if (welt) {
      let r = 0;
      meineGebiete().forEach((id) => (r += gebietRate(id)));
      if (r > 0) { S.money += r * dt; S.bezirkSumme = (S.bezirkSumme || 0) + r * dt; }
    }
    // Bahnhoefe bringen Geld je angeschlossener Strecke.
    if (S.bf?.length) {
      const r = S.bf.reduce((a: number, b: any) => a + bfRate(b), 0);
      if (r > 0) { S.money += r * dt; S.bfSumme = (S.bfSumme || 0) + r * dt; }
    }
    for (const t of S.trains.slice()) {
      const L = S.lines[t.line];
      t.s += t.dir * pxs(vKmh(t, L)) * (L.fault ? CFG.faultSpeed : 1) * wetterTempo(L) * bauTempo(L) * kapTempo(L) * dt;
      if (t.s >= L.len || t.s <= 0) { t.s = Math.max(0, Math.min(L.len, t.s)); arrive(t, L); }
    }
    for (let i = popups.length - 1; i >= 0; i--) { popups[i].age += dtReal; if (popups[i].age > 1.4) popups.splice(i, 1); }
  };
  /** Kosten einer Baustelle: Arbeit, Maschinenmiete (entfaellt mit eigener Maschine), Ersatzverkehr. */
  const bauKosten = (L: any, mi: number, si: number) => {
    const m = MASSNAHMEN[mi], sp = SPERRUNGEN[si], f = TESTMODUS ? 0 : 1;
    const arbeit = Math.round(L.len * m.jeEinheit / 10) * 10 * f, miete = hat(m.maschine) ? 0 : m.miete * f, sev = Math.round(L.len * sp.sevJeEinheit / 10) * 10 * f;
    return { arbeit, miete, sev, summe: arbeit + miete + sev };
  };
  const bauDauer = (mi: number, si: number, richtig: number) => Math.round(MASSNAHMEN[mi].dauer * SPERRUNGEN[si].dauerF * (1 - VORBEREITUNG_SPAREN * richtig) * (1 - personal('gleisbauer')));
  const starteBau = (L: any, mi: number, si: number, richtig: number) => {
    if (L.bau) return;
    const k = bauKosten(L, mi, si);
    if (S.money < k.summe) { toast('Zu wenig Guthaben (' + fmt(k.summe) + ' nötig).'); return; }
    S.money -= k.summe; L.rep += k.summe;
    const dauer = bauDauer(mi, si, richtig);
    L.bau = { m: mi, sp: si, bis: S.time + dauer, dauer };
    addXp(5 + richtig * 3);
    toast('🚧 ' + MASSNAHMEN[mi].n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' gestartet (' + SPERRUNGEN[si].n + ', ' + dauer + ' s' + (richtig ? ', ' + richtig + '× gut vorbereitet' : '') + ')', 5000);
    save();
  };
  const beendeBau = (L: any) => {
    const m = MASSNAHMEN[L.bau.m];
    L.cond = Math.min(100, L.cond + m.cond);
    if (m.risiko0) L.risiko = 0;
    if (m.neu) L.neuBis = S.time + m.neu;
    // Auf der Baustelle wird alles mit erledigt, auch eine offene Stoerung.
    if (L.fault) { L.fault = null; S.faultsFixed++; }
    L.bau = null;
    addXp(15); zaehle('baustellen');
    toast('✅ ' + m.n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' fertig: Zustand ' + Math.round(L.cond) + ' %' + (m.neu ? ', neues Gleis verschleißt halb so schnell' : ''), 5000);
    save();
  };
  const bauKnopf = (L: any) => {
    if (L.bau) {
      const m = MASSNAHMEN[L.bau.m], rest = Math.max(0, Math.ceil(L.bau.bis - S.time));
      return '<div class="mut">🚧 ' + m.n + ' (' + SPERRUNGEN[L.bau.sp].n + ') · noch ' + rest + ' s</div>' + barHTML((1 - rest / L.bau.dauer) * 100, '#ff8a3d');
    }
    return '<button data-act="bau" data-arg="' + L.id + '">🚧 Baustelle planen (Sperrpause)</button>';
  };
  /** Planungsfenster: Massnahme und Sperrung waehlen, Kosten sehen, mit oder ohne Arbeitsvorbereitung starten. */
  const bauHTML = () => {
    const mo = modal, L = S.lines[mo.line], mi = mo.m ?? 0, si = mo.sp ?? 0, k = bauKosten(L, mi, si), m = MASSNAHMEN[mi];
    let h = '<h2>🚧 Baustelle planen <span class="mut">· ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '</span></h2><div class="mut">Zustand jetzt ' + Math.round(L.cond) + ' %</div>';
    h += '<h3>Maßnahme</h3><div class="shop-liste">';
    MASSNAHMEN.forEach((x, i) => {
      h += '<div class="shop-zug' + (i === mi ? ' gewaehlt' : '') + '"><div class="shop-text"><b>' + x.n + '</b><div class="mut">' + x.text + ' Zustand +' + x.cond + ' %' + (x.risiko0 ? ', übersehene Fehler beseitigt' : '') + '. Maschine: ' + x.maschineN + (hat(x.maschine) ? ' (eigene ✓)' : ' (Miete ' + fmt(TESTMODUS ? 0 : x.miete) + ')') + '</div></div>' +
        '<button class="sm" data-act="bauwahl" data-arg="m:' + i + '"' + (i === mi ? ' disabled' : '') + '>' + (i === mi ? '✓' : 'Wählen') + '</button></div>';
    });
    h += '</div><h3>Sperrung</h3><div class="shop-liste">';
    SPERRUNGEN.forEach((x, i) => {
      h += '<div class="shop-zug' + (i === si ? ' gewaehlt' : '') + '"><div class="shop-text"><b>' + x.n + '</b><div class="mut">' + x.text + '</div></div>' +
        '<button class="sm" data-act="bauwahl" data-arg="s:' + i + '"' + (i === si ? ' disabled' : '') + '>' + (i === si ? '✓' : 'Wählen') + '</button></div>';
    });
    h += '</div><h3>Kosten und Dauer</h3>';
    h += '<div class="row"><span>Arbeit</span><b>' + fmt(k.arbeit) + '</b></div><div class="row"><span>' + m.maschineN + '</span><b>' + (hat(m.maschine) ? 'eigene' : fmt(k.miete)) + '</b></div>';
    if (SPERRUNGEN[si].sevJeEinheit) h += '<div class="row"><span>Schienenersatzverkehr</span><b>' + fmt(k.sev) + '</b></div>';
    h += '<div class="row"><b>Gesamt</b><b>' + fmt(k.summe) + '</b></div>';
    h += '<div class="row"><span>Bauzeit</span><b>' + bauDauer(mi, si, 0) + ' s</b></div>';
    h += '<div class="mut">Arbeitsvorbereitung: ' + VORBEREITUNG_FRAGEN + ' Fachfragen „' + m.themaN + '“ – jede richtige Antwort verkürzt die Bauzeit um ' + Math.round(VORBEREITUNG_SPAREN * 100) + ' % (bis ' + bauDauer(mi, si, VORBEREITUNG_FRAGEN) + ' s).</div>';
    h += '<div class="opts"><button data-act="baustart" data-arg="1" ' + (S.money < k.summe ? 'disabled' : '') + '>📋 Mit Arbeitsvorbereitung starten</button>' +
      '<button data-act="baustart" data-arg="0" ' + (S.money < k.summe ? 'disabled' : '') + '>Ohne Vorbereitung starten</button><button data-act="close">Abbrechen</button></div>';
    return h;
  };
  /** Neue Auftraege von Gueterbahnhoefen, abgelaufene streichen. */
  const auftragTakt = (dt: number) => {
    S.auftraege = S.auftraege || [];
    for (const a of S.auftraege.slice()) if (S.time >= a.bis) {
      S.auftraege.splice(S.auftraege.indexOf(a), 1);
      toast('📦 Auftrag verfallen: ' + WAREN[a.ware].n + ' nach ' + knoten(a.nach).n + ' (' + a.geliefert + '/' + a.menge + ' geliefert).', 4000);
    }
    if (S.auftraege.length >= MAX_AUFTRAEGE || !(S.gbf || []).length) return;
    S.auftragIn = (S.auftragIn ?? 20) - dt;
    if (S.auftragIn > 0) return;
    S.auftragIn = AUFTRAG_TAKT * rand(0.8, 1.4);
    // Strecken mit Gueterbahnhof an einem Ende, auf denen noch kein Auftrag laeuft.
    const moegl: { L: any; von: number; nach: number }[] = [];
    S.lines.forEach((L: any) => {
      if (S.auftraege.some((a: Auftrag) => a.line === L.id)) return;
      if (hatGbf(L.a)) moegl.push({ L, von: L.a, nach: L.b });
      if (hatGbf(L.b)) moegl.push({ L, von: L.b, nach: L.a });
    });
    if (!moegl.length) return;
    const w = moegl[ri(0, moegl.length - 1)], ware = wareVon(w.von), menge = ri(5, 10);
    const a: Auftrag = { id: (S.auftragNr = (S.auftragNr || 0) + 1), line: w.L.id, von: w.von, nach: w.nach, ware, menge, geliefert: 0,
      bis: S.time + 200 + 30 * menge, lohn: Math.max(300, Math.round(w.L.len * menge * 0.8 / 10) * 10) };
    S.auftraege.push(a);
    const passt = S.trains.some((t: any) => t.line === w.L.id && laedt(t, ware));
    toast('📦 Neuer Auftrag: ' + menge + '× ' + WAREN[ware].icon + ' ' + WAREN[ware].n + ' von ' + knoten(w.von).n + ' nach ' + knoten(w.nach).n + ' (+' + fmt(a.lohn) + ')' +
      (passt ? '' : ' – dafür brauchst du einen passenden Güterzug auf der Strecke!'), 6000);
  };
  /** Eigener Zug kommt an Knoten ziel an: passende Ladung zaehlt fuer den Auftrag dorthin. */
  const liefere = (t: any, L: any, ziel: number, p: any) => {
    const a = (S.auftraege || []).find((x: Auftrag) => x.line === L.id && x.nach === ziel && laedt(t, x.ware));
    if (!a) return;
    a.geliefert++;
    popups.push({ x: p.x, y: p.y - 6, txt: WAREN[a.ware].icon + ' ' + a.geliefert + '/' + a.menge, col: '#5d4037', age: 0 });
    if (a.geliefert < a.menge) return;
    S.auftraege.splice(S.auftraege.indexOf(a), 1);
    S.money += a.lohn; S.gueterSumme = (S.gueterSumme || 0) + a.lohn; zaehle('auftraege'); addXp(10 + a.menge * 2);
    toast('✅ Auftrag erfüllt: ' + a.menge + '× ' + WAREN[a.ware].n + ' nach ' + knoten(a.nach).n + ' (+' + fmt(a.lohn) + ')', 4500);
    save();
  };
  const baueGbf = (c: number) => {
    if (hatGbf(c)) return;
    if (!praesenz(c)) { toast('Das Gebiet von ' + knoten(c).n + ' gehört weder dir noch einem aktiven Clan-Mitglied.'); return; }
    if (S.money < gbfPreis()) { toast('Zu wenig Guthaben.'); return; }
    S.money -= gbfPreis(); S.gbf = [...(S.gbf || []), c]; addXp(10);
    if (!S.auftragIn || S.auftragIn > 15) S.auftragIn = 15;
    toast('🏗 Güterbahnhof ' + knoten(c).n + ' gebaut: hier wird ' + WAREN[wareVon(c)].icon + ' ' + WAREN[wareVon(c)].n + ' verladen.', 4500);
    save();
  };
  /** Abschnitt Gueterbahnhof im Stadt-/Bahnhof-Panel. */
  const gbfTeil = (c: number) => {
    const w = WAREN[wareVon(c)];
    if (hatGbf(c)) return '<div class="pos">🏗 Güterbahnhof: hier wird ' + w.icon + ' ' + w.n + ' verladen.</div>';
    if (RO) return '<div class="mut">Ware hier: ' + w.icon + ' ' + w.n + '</div>';
    return '<div class="btns"><button data-act="gbf" data-arg="' + c + '" ' + (S.money < gbfPreis() || !praesenz(c) ? 'disabled' : '') + '>🏗 Güterbahnhof bauen · ' + fmt(gbfPreis()) + '</button></div><div class="mut">Ware hier: ' + w.icon + ' ' + w.n + '. ' + GUETERBAHNHOF.text + '</div>';
  };
  /* ---- Ausschreibungen (tycoon-ausschreibung.ts) ---- */
  /** Eigene Strecken (mit eigenem Zug) durch ein Bundesland und deren mittlere Puenktlichkeit. */
  const landStrecken = (bl: string) => S.lines.filter((L: any) => L.gebiete.some((id: number) => gebietMitId(id)?.bl === bl) && S.trains.some((t: any) => t.own && t.line === L.id));
  const landPuenkt = (bl: string) => { const ls = landStrecken(bl); return ls.length ? ls.reduce((a: number, L: any) => a + puenkt(L), 0) / ls.length : 0; };
  const landName = (bl: string) => { const g = gebieteIm(bl)[0]; return g ? regionVon(g) : bl; };
  const ausschreibungTakt = (dt: number) => {
    // Laufende Vertraege auszahlen.
    for (const v of (S.vertraege || []).slice() as Vertrag[]) {
      const ok = landPuenkt(v.bl) >= v.versprechen;
      const geld = v.proMin / 60 * dt * (ok ? 1 : MALUS);
      S.money += geld; S.vertragSumme = (S.vertragSumme || 0) + geld;
      if (ok) v.erfuellt += dt;
      if (!ok && !v.warn) { v.warn = true; toast('📜 ' + landName(v.bl) + ': Pünktlichkeit unter ' + v.versprechen + ' % – das Land zahlt nur noch ' + Math.round(MALUS * 100) + ' %!', 5000); }
      if (ok) v.warn = false;
      if (S.time >= v.bis) {
        S.vertraege.splice(S.vertraege.indexOf(v), 1);
        const quote = v.erfuellt / v.dauer, bonus = quote >= 0.8 ? Math.round(v.proMin * 3 / 10) * 10 : 0;
        S.money += bonus; addXp(quote >= 0.8 ? 30 : 10);
        toast('📜 Verkehrsvertrag ' + landName(v.bl) + ' beendet: ' + Math.round(quote * 100) + ' % der Zeit pünktlich' + (bonus ? ', Bonus +' + fmt(bonus) : '') + '.', 6000);
        save();
      }
    }
    // Laufende Ausschreibung entscheiden.
    const a: Ausschreibung | null = S.aus || null;
    if (a && S.time >= a.bis) {
      S.aus = null;
      if (a.gebot !== undefined && a.versprechen !== undefined) {
        const meins = a.gebot * VERSPRECHEN[a.versprechen].f, besser = a.gegner.filter((g) => g.gebot < meins);
        if (!besser.length) {
          S.vertraege = [...(S.vertraege || []), { bl: a.bl, proMin: a.gebot, versprechen: VERSPRECHEN[a.versprechen].p, bis: S.time + VERTRAG, dauer: VERTRAG, erfuellt: 0 }];
          addXp(20); zaehle('vertraege');
          toast('🏆 Zuschlag! Du betreibst den Regionalverkehr in ' + landName(a.bl) + ': ' + fmt(a.gebot) + ' pro Minute, solange du ' + VERSPRECHEN[a.versprechen].p + ' % pünktlich bist.', 7000);
        } else toast('📜 Ausschreibung ' + landName(a.bl) + ' verloren – ' + besser.sort((x, y) => x.gebot - y.gebot)[0].n + ' war günstiger (' + fmt(besser[0].gebot) + '/Min. gewertet).', 6000);
        save();
      }
    }
    // Neue Ausschreibung in einem Land mit eigener Strecke (ohne laufenden Vertrag dort).
    if (S.aus) return;
    S.ausIn = (S.ausIn ?? 120) - dt;
    if (S.ausIn > 0) return;
    S.ausIn = AUSSCHREIBUNG_TAKT * rand(0.8, 1.3);
    const bls = [...new Set(S.lines.flatMap((l: any) => l.gebiete.map((id: number) => gebietMitId(id)?.bl)).filter((b: any) => !!b))]
      .filter((bl) => !(S.vertraege || []).some((v: Vertrag) => v.bl === bl)) as string[];
    if (!bls.length) return;
    const bl = bls[ri(0, bls.length - 1)], richt = Math.round((150 + 3 * gebieteIm(bl).length) / 10) * 10;
    const gegner = shuffle(MITBEWERBER.slice()).slice(0, ri(2, 3)).map((n) => ({ n, gebot: Math.round(richt * rand(0.78, 1.12)) }));
    S.aus = { bl, richt, bis: S.time + FRIST, gegner };
    toast('📜 Ausschreibung: ' + landName(bl) + ' sucht einen Betreiber für den Regionalverkehr – Gebot abgeben unter 📦 Aufträge!', 6000);
  };
  const ausschreibungHTML = () => {
    let h = '<h3>📜 Ausschreibungen der Länder</h3>';
    const a: Ausschreibung | null = S.aus || null;
    if (a) {
      const gi = modal.gebot ?? (a.gebot !== undefined ? GEBOTE.findIndex((g) => Math.round(a.richt * g.f) === a.gebot) : 1), vi = modal.versp ?? a.versprechen ?? 0;
      h += '<div class="shop-zug"><div class="shop-text"><b>' + landName(a.bl) + '</b> <span class="mut">· Frist noch ' + Math.max(0, Math.ceil(a.bis - S.time)) + ' s · Richtwert ' + fmt(a.richt) + '/Min. · ' + a.gegner.length + ' Mitbewerber</span>' +
        '<div class="mut">Vertrag ' + Math.round(VERTRAG / 60) + ' Minuten. Gezahlt wird, solange deine Strecken mit eigenen Zügen in ' + landName(a.bl) + ' im Mittel pünktlich genug sind (jetzt ' + Math.round(landPuenkt(a.bl)) + ' %). Gewertet: Zuschuss × Faktor fürs Versprechen – das niedrigste Gebot gewinnt.</div>';
      h += '<div class="btns">' + GEBOTE.map((g, i) => '<button class="sm' + (i === gi ? ' on' : '') + '" data-act="ausg" data-arg="' + i + '">' + g.n + ': ' + fmt(Math.round(a.richt * g.f)) + '/Min.</button>').join('') + '</div>';
      h += '<div class="btns">' + VERSPRECHEN.map((v, i) => '<button class="sm' + (i === vi ? ' on' : '') + '" data-act="ausv" data-arg="' + i + '">' + v.p + ' % pünktlich (×' + v.f.toLocaleString('de-DE') + ')</button>').join('') + '</div>';
      h += (a.gebot !== undefined ? '<div class="pos">✓ Gebot abgegeben: ' + fmt(a.gebot) + '/Min., ' + VERSPRECHEN[a.versprechen!].p + ' % – Entscheidung nach Fristende.</div>' : '') +
        (RO ? '' : '<div class="btns"><button data-act="ausab">' + (a.gebot !== undefined ? 'Gebot ändern' : '📜 Gebot abgeben') + '</button></div>') + '</div></div>';
    } else h += '<p class="mut">Gerade keine Ausschreibung. Sie kommen aus Bundesländern, durch die deine Strecken führen.</p>';
    (S.vertraege || []).forEach((v: Vertrag) => {
      const lp = landPuenkt(v.bl), ok = lp >= v.versprechen;
      h += '<div class="shop-zug"><div class="shop-text"><b>📜 Vertrag ' + landName(v.bl) + '</b> <span class="mut">· noch ' + Math.max(0, Math.ceil(v.bis - S.time)) + ' s</span>' + barHTML((1 - (v.bis - S.time) / v.dauer) * 100, '#7b61ff') +
        '<div class="' + (ok ? 'pos' : 'neg') + '">' + fmt(v.proMin * (ok ? 1 : MALUS)) + '/Min. · Pünktlichkeit ' + Math.round(lp) + ' % (versprochen ' + v.versprechen + ' %)</div></div></div>';
    });
    return h + '<div class="row"><span>Verdient mit Verkehrsverträgen</span><b class="pos">' + fmt(S.vertragSumme || 0) + '</b></div>';
  };
  /** Clan-Grossprojekt: Fortschritt, Beitraege, Arbeitsschicht. */
  const clanProjektHTML = () => {
    let h = '<h3>🤝 Clan-Großprojekt</h3>';
    if (!welt) return h + '<p class="mut">Wird geladen …</p>';
    if (!welt.ich?.clanId) return h + '<p class="mut">Tritt einem Clan bei (Reiter „Clans“ über dem Spiel), um gemeinsam Großprojekte zu bauen.</p>';
    const boni = CLAN_PROJEKTE.filter((p) => clanBonus2(p.id));
    if (boni.length) h += '<div class="pos">Fertig: ' + boni.map((p) => p.icon + ' ' + p.n + ' (' + p.bonus + ')').join(' · ') + '</div>';
    const a = welt.clanProjekt;
    if (!a) {
      h += '<div class="mut">Wählt ein Projekt – alle Mitglieder zahlen ein oder leisten Arbeitsschichten. Ist es fertig, gilt der Bonus dauerhaft für den ganzen Clan.</div><div class="shop-liste">';
      CLAN_PROJEKTE.forEach((p) => {
        h += '<div class="shop-zug"><div class="shop-text"><b>' + p.icon + ' ' + p.n + '</b> <span class="mut">· Ziel ' + fmt(p.ziel) + '</span><div class="mut">' + p.text + ' Bonus: ' + p.bonus + (clanBonus2(p.id) ? ' (habt ihr schon)' : '') + '</div></div>' +
          (RO ? '' : '<button class="sm" data-act="cpstart" data-arg="' + p.id + '">Starten</button>') + '</div>';
      });
      return h + '</div>';
    }
    const p = CLAN_PROJEKTE.find((x) => x.id === a.art)!, warten = Math.ceil((S.schichtAb || 0) - S.time);
    h += '<div class="shop-zug"><div class="shop-text"><b>' + p.icon + ' ' + p.n + '</b> <span class="mut">· ' + fmt(a.stand) + ' / ' + fmt(a.ziel) + '</span>' + barHTML(a.stand / a.ziel * 100, '#17bebb') +
      '<div class="mut">Bonus nach Fertigstellung: ' + p.bonus + '. Beiträge: ' + ((a.beitraege || []).map((b: any) => b.name + ' ' + fmt(b.betrag)).join(', ') || 'noch keine') + '</div></div></div>';
    if (RO) return h;
    h += '<div class="btns">' + BEITRAEGE.map((b) => '<button class="sm" data-act="cpgeld" data-arg="' + b + '" ' + (S.money < b ? 'disabled' : '') + '>' + fmt(b) + ' einzahlen</button>').join('') + '</div>';
    h += '<div class="btns">' + (warten > 0 ? '<button disabled>👷 Nächste Schicht in ' + warten + ' s</button>'
      : '<button data-act="cpschicht">👷 Arbeitsschicht: ' + SCHICHT_FRAGEN + ' Fachfragen, je richtig ' + fmt(SCHICHT_WERT) + ' fürs Projekt</button>') + '</div>';
    return h;
  };
  /** Auftrags-Fenster. */
  const auftraegeHTML = () => {
    let h = '<h2>📦 Güteraufträge</h2><div class="mut">Baue an Städten oder Bahnhöfen einen Güterbahnhof. Dort entstehen Aufträge: Ladungen zum anderen Ende der Strecke, gefahren von deinen Güterzügen, die die Ware laden können. Neuer Auftrag etwa alle ' + (AUFTRAG_TAKT / 60).toLocaleString('de-DE') + ' Minuten, höchstens ' + MAX_AUFTRAEGE + ' gleichzeitig.</div>';
    const liste: Auftrag[] = S.auftraege || [];
    if (!(S.gbf || []).length) h += '<p class="hinweis">Du hast noch keinen Güterbahnhof. Klick eine Stadt oder deinen Bahnhof an und bau einen.</p>';
    else if (!liste.length) h += '<p class="mut">Gerade kein Auftrag – der nächste kommt bald.</p>';
    h += '<div class="shop-liste">';
    liste.forEach((a) => {
      const L = S.lines[a.line], w = WAREN[a.ware], zuege = S.trains.filter((t: any) => t.line === a.line && laedt(t, a.ware)).length;
      const passend = TRAINS.map((z, i) => ({ z, i })).filter((x) => (x.z.gueter || []).includes(a.ware)).map((x) => x.z.n);
      h += '<div class="shop-zug"><div class="shop-text"><b>' + w.icon + ' ' + a.menge + '× ' + w.n + '</b> <span class="mut">' + knoten(a.von).n + ' → ' + knoten(a.nach).n + '</span>' +
        barHTML(a.geliefert / a.menge * 100, '#8d6e63') + '<div class="mut">' + a.geliefert + '/' + a.menge + ' geliefert · noch ' + Math.max(0, Math.ceil(a.bis - S.time)) + ' s · Lohn ' + fmt(a.lohn) + '</div>' +
        '<div class="' + (zuege ? 'mut' : 'neg') + '">' + (zuege ? zuege + ' passende' + (zuege > 1 ? '' : 'r') + ' Zug auf der Strecke' : 'Kein passender Zug! Geeignet: ' + passend.join(', ')) + '</div></div>' +
        (RO || !L ? '' : '<button class="sm" data-act="shop" data-arg="z:' + a.line + '">🛒 Zug</button>') + '</div>';
    });
    return h + '</div><div class="row"><span>Verdient mit Aufträgen</span><b class="pos">' + fmt(S.gueterSumme || 0) + '</b></div>' + ausschreibungHTML() + clanProjektHTML() + '<div class="opts"><button data-act="close">Schließen</button></div>';
  };
  /* ---- Abzweigstellen und durchgehende Zuglaeufe ---- */
  const ABZ_PREIS = () => (TESTMODUS ? 0 : 1500);
  /** Naechster Kurvenpunkt (Index) und Laenge bis dorthin. */
  const naechsterPunkt = (L: any, q: { x: number; y: number }) => {
    let bi = 0, bd = Infinity;
    L.pts.forEach((pt: any, i: number) => { const d = dist(pt, q); if (d < bd) { bd = d; bi = i; } });
    return { i: bi, s: L.cum[bi], d: bd };
  };
  /** Abzweig an dieser Stelle moeglich? (nicht zu nah an den Enden, keine Baustelle) */
  const abzweigMoeglich = (L: any, q: any) => { if (!q || L.bau) return false; const n = naechsterPunkt(L, q); return n.d < 12 && n.s > 15 && L.len - n.s > 15; };
  /** Strecke an der Stelle q teilen: L wird a..Abzweig, neue Strecke Abzweig..b; Zuege, Stoerung, Auftraege werden umverteilt. */
  const baueAbzweig = (id: number, q: { x: number; y: number }) => {
    const L = S.lines[id];
    if (!L || !abzweigMoeglich(L, q)) { toast('Hier geht keine Abzweigstelle (zu nah am Streckenende oder Baustelle).'); return; }
    if (S.money < ABZ_PREIS()) { toast('Zu wenig Guthaben.'); return; }
    const n = naechsterPunkt(L, q), pt = L.pts[n.i], len1 = n.s;
    S.abz = S.abz || []; S.abzNext = S.abzNext || 1;
    const z = { id: S.abzNext++, x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 }, code = ABZ0 + z.id;
    S.abz.push(z);
    const teil1 = duenneAus(L.pts.slice(0, n.i + 1)), teil2 = duenneAus(L.pts.slice(n.i));
    const b = L.b, alt = { ...L };
    // Erster Teil ersetzt die alte Strecke (gleiche Id), zweiter wird neu angehaengt.
    const g1 = geoAusPunkten(teil1);
    Object.assign(L, { b: code, p: teil1, pts: g1.pts, cum: g1.cum, len: g1.len, gebiete: gebieteEntlang(g1.pts) });
    const L2: any = addLine(code, b, teil2);
    for (const f of ['cond', 'cls', 'ol', 'gleise', 'signal', 'schutz', 'neuBis', 'risiko', 'puenkt', 'inspAb', 'fahrtAb']) L2[f] = Array.isArray(alt[f]) ? [...alt[f]] : alt[f];
    L2.inF = 0; L2.inO = 0; L2.rep = 0; L2.verlust = 0; L2.color = L.color;
    if (alt.fault) {
      const pos = alt.fault.t * alt.len;
      if (pos > len1) { L2.fault = { ...alt.fault, t: Math.min(0.95, (pos - len1) / L2.len) }; L.fault = null; } else L.fault = { ...alt.fault, t: Math.min(0.95, pos / L.len) };
    }
    S.trains.forEach((t: any) => {
      if (t.line === L.id && t.s > len1) { t.line = L2.id; t.s = Math.max(0, Math.min(L2.len, t.s - len1)); }
      if (t.route && t.route.includes(L.id)) { delete t.route; delete t.rdir; }
    });
    S.auftraege = (S.auftraege || []).filter((a: Auftrag) => a.line !== L.id);
    S.money -= ABZ_PREIS(); addXp(15);
    toast('🔀 ' + abzName(z) + ' gebaut: Die Strecke ist jetzt geteilt – von hier kannst du eine neue Strecke abzweigen lassen.', 5000);
    sel = { city: null, line: null, gebiet: null, abz: z.id };
    save();
  };
  /** Anfangs- und Endknoten eines Zuglaufs (Liste aufeinanderfolgender Strecken). */
  const laufEnden = (route: number[]) => {
    const L0 = S.lines[route[0]];
    if (route.length === 1) return { anfang: L0.a, ende: L0.b };
    const L1 = S.lines[route[1]], anfang = L0.a === L1.a || L0.a === L1.b ? L0.b : L0.a;
    let ende = anfang;
    for (const id of route) { const L = S.lines[id]; ende = L.a === ende ? L.b : L.a; }
    return { anfang, ende };
  };
  /** Strecken, die am Knoten c anschliessen. */
  const streckenAn = (c: number) => S.lines.filter((l: any) => l.a === c || l.b === c);
  /** Am Ende einer Strecke: auf dem Zuglauf weiterfahren oder (Laufende) wenden. */
  const weiterfahren = (t: any, L: any) => {
    const E = t.dir > 0 ? L.b : L.a, r: number[] | undefined = t.route;
    if (r && r.length > 1) {
      const ri = r.indexOf(L.id), vor = t.rdir ?? 1, nid = r[ri + vor], N = nid !== undefined ? S.lines[nid] : null;
      if (N && (N.a === E || N.b === E) && !gesperrt(N)) {
        t.line = N.id;
        if (N.a === E) { t.s = 0; t.dir = 1; } else { t.s = N.len; t.dir = -1; }
        return;
      }
      if (ri >= 0 && nid === undefined) t.rdir = -vor;
    }
    t.dir *= -1;
  };
  const laufVerlaengern = (zid: number, lid: number) => {
    const t = zugVon(zid), N = S.lines[lid];
    if (!t || !N) return;
    const r: number[] = t.route && t.route.length ? t.route.slice() : [t.line];
    if (r.includes(lid)) return;
    const { anfang, ende } = laufEnden(r);
    if (N.a === ende || N.b === ende) r.push(lid);
    else if (N.a === anfang || N.b === anfang) r.unshift(lid);
    else return;
    if (tdef(t).el && !N.ol) { toast('Auf ' + knoten(N.a).n + ' ⇄ ' + knoten(N.b).n + ' fehlt die Oberleitung.'); return; }
    t.route = r; t.rdir = t.rdir ?? 1;
    toast('🔀 Zuglauf: ' + r.length + ' Strecken (' + laufName(r) + ') – Durchbindung +' + Math.round((r.length - 1) * 10) + ' % Miete');
    save();
  };
  const laufName = (r: number[]) => { const { anfang, ende } = laufEnden(r); return knoten(anfang).n + ' – ' + knoten(ende).n; };
  /** Zuglauf-Abschnitt in der Werkstatt. */
  const laufHTML = (t: any) => {
    const r: number[] = t.route && t.route.length ? t.route : [t.line], { anfang, ende } = laufEnden(r);
    let h = '<h3>🔀 Zuglauf</h3><div class="mut">Über Abzweigstellen und Knoten kann der Zug mehrere Strecken am Stück fahren. Jede weitere Strecke bringt +10 % Miete (Fahrgäste müssen nicht umsteigen).</div>';
    h += '<div class="row"><span>Jetzt</span><b>' + laufName(r) + ' (' + r.length + ' Strecke' + (r.length > 1 ? 'n' : '') + ')</b></div><div class="btns">';
    const opt = [...streckenAn(ende), ...streckenAn(anfang)].filter((l: any, i, a) => !r.includes(l.id) && a.indexOf(l) === i);
    opt.forEach((l: any) => { h += '<button class="sm" data-act="lauf" data-arg="' + t.id + ':' + l.id + '">+ ' + knoten(l.a).n + ' ⇄ ' + knoten(l.b).n + '</button>'; });
    if (r.length > 1) h += '<button class="sm" data-act="laufweg" data-arg="' + t.id + '">Nur noch eine Strecke</button>';
    if (!opt.length && r.length === 1) h += '<span class="mut">An den Enden dieser Strecke schließt keine weitere eigene Strecke an.</span>';
    return h + '</div>';
  };
  /** Panel einer Abzweigstelle. */
  const abzHTML = (id: number) => {
    const z = abzMit(id), str = streckenAn(ABZ0 + id);
    let h = '<h3>🔀 ' + abzName(z) + '</h3><div class="mut">Abzweigstelle mit Weiche auf freier Strecke. Von hier kannst du eine neue Strecke bauen; Züge können mit einem Zuglauf (Werkstatt) über den Abzweig weiterfahren.</div>';
    h += '<div class="row"><span>Strecken</span><b>' + str.length + '</b></div>';
    str.forEach((L: any) => { h += '<div class="bezirk" data-act="linie" data-arg="' + L.id + '"><span class="farbpunkt" style="background:' + L.color + '"></span><span class="bz-n">' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + (L.fault ? ' <span class="neg">⚠</span>' : '') + '</span></div>'; });
    if (!RO) h += '<div class="btns"><button data-act="zeichne" data-arg="' + (ABZ0 + id) + '" ' + (praesenz(ABZ0 + id) ? '' : 'disabled') + '>🛤 Strecke abzweigen</button></div>';
    return h + '<div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
  };
  /** Personal-Fenster: Rollen einstellen und per Lehrgang befoerdern. */
  const personalHTML = () => {
    let h = '<h2>👷 Personal</h2><div class="mut">Einmal einstellen, keine laufenden Kosten. Befördern geht per Lehrgang (' + LEHRGANG_N + ' Fachfragen, mind. ' + LEHRGANG_NEED + ' richtig). Ab Stufe 3 brauchst du außerdem Lernstand in der Lernwelt: Fragen der passenden Themenquiz-Themen, die du schon einmal richtig beantwortet hast.</div><div class="shop-liste">';
    ROLLEN.forEach((r) => {
      const st = stufe(r.id), ziel = st + 1, ls = lernstand(r.themen, themenAnzahl), noetig = lernstandFuer(ziel), warten = Math.ceil(((S.lehrAb || {})[r.id] || 0) - S.time);
      const preis = TESTMODUS ? 0 : st ? lehrgangPreis(ziel) : r.einstellen;
      h += '<div class="shop-zug"><div class="shop-text"><b>' + r.icon + ' ' + r.n + '</b> ' + (st ? '<span class="tag" style="background:#7b61ff">Stufe ' + st + '</span>' : '<span class="mut">nicht eingestellt</span>') +
        '<div class="mut">' + r.wirkung.split('{p}').join(st ? Math.round(st * r.proStufe) + ' %' : r.proStufe + ' % je Stufe') + '</div>' +
        '<div class="mut">Lernstand ' + Math.round(ls * 100) + ' % · Themen: ' + r.themen.map((t) => '<a href="/themenquiz/' + t + '" target="_blank" rel="noopener">' + t + '</a>').join(', ') + '</div></div>';
      if (!st) h += '<button data-act="pein" data-arg="' + r.id + '" ' + (S.money < preis ? 'disabled' : '') + '>Einstellen · ' + fmt(preis) + '</button>';
      else if (st >= MAX_STUFE) h += '<button disabled>✓ Höchste Stufe</button>';
      else if (ls < noetig) h += '<button disabled title="Mehr Fragen in der Lernwelt richtig beantworten">🔒 Lernstand ' + Math.round(noetig * 100) + ' % nötig</button>';
      else if (warten > 0) h += '<button disabled>Lehrgang wieder in ' + warten + ' s</button>';
      else h += '<button data-act="plehr" data-arg="' + r.id + '" ' + (S.money < preis ? 'disabled' : '') + '>🎓 Lehrgang → Stufe ' + ziel + ' · ' + fmt(preis) + '</button>';
      h += '</div>';
    });
    return h + '</div><div class="opts"><button data-act="close">Schließen</button></div>';
  };
  const stelleEin = (id: string) => {
    const r = ROLLEN.find((x) => x.id === id), preis = TESTMODUS ? 0 : r?.einstellen ?? 0;
    if (!r || stufe(id)) return;
    if (S.money < preis) { toast('Zu wenig Guthaben.'); return; }
    S.money -= preis; S.personal = { ...(S.personal || {}), [id]: 1 }; addXp(10);
    toast(r.icon + ' ' + r.n + ' eingestellt (Stufe 1)' + (preis ? ' −' + fmt(preis) : ''));
    save();
  };
  const lehrgangErgebnis = (id: string, ok: boolean) => {
    const r = ROLLEN.find((x) => x.id === id)!;
    if (ok) {
      const preis = TESTMODUS ? 0 : lehrgangPreis(stufe(id) + 1);
      S.money -= Math.min(S.money, preis); S.personal = { ...(S.personal || {}), [id]: stufe(id) + 1 }; addXp(15);
      toast('🎓 Lehrgang bestanden: ' + r.n + ' ist jetzt Stufe ' + stufe(id) + '!', 4000);
    } else {
      S.lehrAb = { ...(S.lehrAb || {}), [id]: S.time + 60 };
      addXp(2);
      toast('Lehrgang nicht bestanden – in 60 Sekunden nochmal. Tipp: die Themen in der Lernwelt üben.', 4500);
    }
  };
  /** Jahreszeitwechsel melden, Wetterlage ablaufen lassen und die naechste starten (Spielzeit). */
  const wetterTakt = (dt: number) => {
    const jz = jahreszeit();
    if (jz !== S.jz) {
      S.jz = jz;
      const gefahr = WETTER.filter((w) => w.zeit === jz);
      toast(JAHRESZEITEN[jz].icon + ' Jetzt ist ' + JAHRESZEITEN[jz].n + '. Achtung: ' + gefahr.map((w) => w.n + ' (Schutz: ' + SCHUTZ.find((x) => x.id === w.schutz)!.n + ')').join(', '), 6000);
    }
    if (S.wetter && S.time >= S.wetter.bis) { toast(wetterArt()!.icon + ' ' + wetterArt()!.n + ' ist vorbei.'); S.wetter = null; }
    if (!S.wetter && S.lines.length && S.tut >= 3) { S.wetterIn = (S.wetterIn ?? 180) - dt; if (S.wetterIn <= 0) starteWetter(); }
  };
  /** Neue Wetterlage der Jahreszeit ueber einem Bundesland, durch das eine eigene Strecke fuehrt. */
  const starteWetter = () => {
    S.wetterIn = rand(150, 240);
    const arten = WETTER.map((w, i) => ({ w, i })).filter((x) => x.w.zeit === jahreszeit());
    const bls = [...new Set(S.lines.flatMap((l: any) => l.gebiete.map((id: number) => gebietMitId(id)?.bl)).filter((b: any) => !!b))] as string[];
    if (!arten.length || !bls.length) return;
    const { w, i } = arten[ri(0, arten.length - 1)], bl = bls[ri(0, bls.length - 1)], gs = gebieteIm(bl);
    if (!gs.length) return;
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    gs.forEach((g) => { box.x0 = Math.min(box.x0, g.box.x0); box.y0 = Math.min(box.y0, g.box.y0); box.x1 = Math.max(box.x1, g.box.x1); box.y1 = Math.max(box.y1, g.box.y1); });
    S.wetter = { art: i, bl, bis: S.time + 100, box };
    let txt = w.icon + ' ' + w.n + ' in ' + regionVon(gs[0]) + ': ' + w.text;
    const offen = S.lines.filter((L: any) => wetterTrifft(L));
    if (offen.length) txt += ' Ohne ' + SCHUTZ.find((x) => x.id === w.schutz)!.n + ' fahren deine Züge dort langsamer.';
    // Wetter-Stoerung auf einer ungeschuetzten Strecke (zusaetzlich zu den normalen Stoerungen).
    if (w.fehler >= 0) {
      const frei = offen.filter((L: any) => !L.fault);
      if (frei.length && Math.random() < 0.6) {
        const L = frei[ri(0, frei.length - 1)];
        L.fault = { t: rand(.25, .75), diff: Math.min(maxFixable(), ri(0, 1)), art: w.fehler };
        S.anyFault = true;
        txt += ' ⚠ ' + FEHLER_ARTEN[w.fehler].n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '!';
      }
    }
    toast(txt, 9000);
    save();
  };
  const kaufeSchutz = (id: number, sid: string) => {
    const L = S.lines[id], sch = SCHUTZ.find((x) => x.id === sid);
    if (!L || !sch || hatSchutz(L, sid)) return;
    const p = schutzPreis(L, sch);
    if (S.money < p) { toast('Zu wenig Guthaben (' + fmt(p) + ' nötig).'); return; }
    S.money -= p; L.rep += p; L.schutz = [...(L.schutz || []), sid]; addXp(5);
    toast('🛡 ' + sch.n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + (p ? ' (−' + fmt(p) + ')' : ''));
    save();
  };
  const baueZweitesGleis = (id: number) => {
    const L = S.lines[id];
    if (!L || L.gleise === 2) return;
    const p = kapPreis(L, ZWEIGLEISIG.jeEinheit);
    if (S.money < p) { toast('Zu wenig Guthaben (' + fmt(p) + ' nötig).'); return; }
    S.money -= p; L.rep += p; L.gleise = 2; addXp(20);
    toast('🛤🛤 ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' ist jetzt zweigleisig (Kapazität ' + kap(L) + ' Züge)', 4000);
    save();
  };
  const baueSignale = (id: number) => {
    const L = S.lines[id], n = (L?.signal || 0) + 1, sg = SIGNALE[n];
    if (!L || !sg) return;
    const p = kapPreis(L, sg.jeEinheit);
    if (S.money < p) { toast('Zu wenig Guthaben (' + fmt(p) + ' nötig).'); return; }
    S.money -= p; L.rep += p; L.signal = n; addXp(15);
    toast('🚦 ' + sg.n + ' auf ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' (Kapazität ' + kap(L) + ' Züge)', 4000);
    save();
  };
  /** Kapazitaets-Abschnitt im Strecken-Panel. */
  const kapHTML = (L: any) => {
    const n = zuegeAuf(L), k = kap(L), sg = SIGNALE[(L.signal || 0) + 1];
    let h = '<div class="row"><span>Kapazität</span><b class="' + (n > k ? 'neg' : '') + '">' + n + ' / ' + k + ' Züge</b></div>';
    h += '<div class="row"><span>Pünktlichkeit</span><b>' + Math.round(puenkt(L)) + ' %</b></div>' + barHTML(puenkt(L), puenkt(L) < 60 ? '#d64545' : puenkt(L) < 85 ? '#e0a030' : '#4caf7d');
    h += '<div class="mut">' + ((L.gleise || 1) === 2 ? 'Zweigleisig' : 'Eingleisig') + ' · ' + SIGNALE[L.signal || 0].n + '. ' + (n > k ? 'Überlastet: alle Züge fahren langsamer, Verspätungen kosten Einnahmen!' : 'Mehr Kapazität lockt auch mehr Fremdzüge an.') + '</div>';
    if (RO) return h;
    h += '<div class="btns">';
    if ((L.gleise || 1) < 2) { const p = kapPreis(L, ZWEIGLEISIG.jeEinheit); h += '<button data-act="gleis2" data-arg="' + L.id + '" ' + (S.money < p ? 'disabled' : '') + ' title="' + ZWEIGLEISIG.text + '">🛤🛤 Zweites Gleis · ' + fmt(p) + '</button>'; }
    if (sg) { const p = kapPreis(L, sg.jeEinheit); h += '<button data-act="signal" data-arg="' + L.id + '" ' + (S.money < p ? 'disabled' : '') + ' title="' + sg.text + '">🚦 ' + sg.n + ' · ' + fmt(p) + '</button>'; }
    return h + '</div>';
  };
  /** Wetterschutz-Abschnitt im Strecken-Panel. */
  const schutzHTML = (L: any) => {
    const jetzt = new Set(WETTER.filter((w) => w.zeit === jahreszeit()).map((w) => w.schutz)), w = wetterArt();
    let h = '<b>Wetterschutz</b>';
    if (wetterTrifft(L)) h += '<div class="neg">' + w!.icon + ' ' + w!.n + ' trifft diese Strecke: Tempo ' + pct(w!.tempo) + ', Einnahmen ' + pct(w!.einnahmen) + '.</div>';
    SCHUTZ.forEach((sch) => {
      const p = schutzPreis(L, sch);
      h += '<div class="row"><span>' + sch.n + (jetzt.has(sch.id) && !hatSchutz(L, sch.id) ? ' <span class="tag" style="background:#e07a3a">jetzt wichtig</span>' : '') + '</span>' +
        (hatSchutz(L, sch.id) ? '<span class="pos">✓</span>' : RO ? '<span class="mut">–</span>'
          : '<button class="sm" data-act="schutz" data-arg="' + L.id + ':' + sch.id + '" ' + (S.money < p ? 'disabled' : '') + '>' + fmt(p) + '</button>') + '</div><div class="mut">' + sch.text + '</div>';
    });
    return h;
  };
  const arrive = (t: any, L: any) => {
    const p = posAt(L, t.s);
    S.passes++;
    L.cond = Math.max(0, L.cond - CFG.wearPerPass * klasse(L).wear * (t.own ? tdef(t).wear * (hatUpg(t, 'drehgestell') ? 0.7 : 1) : 1.4) * (hat('stopfmaschine') ? 0.75 : 1) * ((L.neuBis || 0) > S.time ? 0.5 : 1));
    t.trips++;
    if (t.own) {
      // Keine Wartungskosten mehr: Wartungsstau und Stoerung senken nur die Einnahmen.
      const td = tdef(t), voll = L.len * CFG.ownRent * td.rent * upgMiete(t) * (1 + (hat('fahrgastinfo') ? 0.1 : 0) + (hat('schaufel') ? 0.05 : 0) + personal('lokfuehrer') + (clanBonus2('nbs') ? 0.05 : 0)) * (kohleMangel(t, L) ? 0.6 : 1) * (1 + 0.1 * ((t.route?.length || 1) - 1)) * (streckenAn(t.dir > 0 ? L.b : L.a).length >= 3 ? 1.15 : 1);
      const inc = voll * condFaktor(L) * (L.fault ? CFG.faultIncome : 1) * wetterEinnahmen(L) * bauEinnahmen(L) * puenktFaktor(puenkt(L));
      S.money += inc; L.inO += inc; t.earned += inc; L.verlust = (L.verlust || 0) + voll - inc;
      addXp(1);
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(inc) + ' €', col: '#e07a00', age: 0 });
      liefere(t, L, t.dir > 0 ? L.b : L.a, p);
      weiterfahren(t, L);
    } else {
      const voll = L.len * CFG.foreignFee * klasse(L).entgelt * (1 + personal('fdl') + (clanBonus2('tunnel') ? 0.05 : 0)), fee = voll * condFaktor(L) * (L.fault ? CFG.faultIncome : 1) * wetterEinnahmen(L) * bauEinnahmen(L) * puenktFaktor(puenkt(L));
      S.money += fee; L.inF += fee; L.verlust = (L.verlust || 0) + voll - fee;
      popups.push({ x: p.x, y: p.y, txt: '+' + Math.round(fee) + ' €', col: '#2e8b57', age: 0 });
      S.trains.splice(S.trains.indexOf(t), 1);
    }
  };

  /* ---------- Layout / Eingabe ---------- */
  /**
   * 2D-Ansicht: k0 = Massstab, bei dem die ganze Karte passt; zoom vergroessert darueber hinaus, (vx, vy) ist der
   * Weltpunkt in der Mitte der freien Flaeche. Symbole (Staedte, Bahnhoefe, Schrift) bleiben beim Zoomen gleich gross.
   */
  let k0 = 1, aw = 0, ah = 0, zoom = 1, vx = KARTE_W / 2, vy = KARTE_H / 2;
  // So weit, dass auch Berlin (ca. 48 Einheiten breit) auf dem Handy bildschirmfuellend wird.
  const ZOOM_MAX = 64;
  /** Bundesland-Fokus (2D und 3D): Ausschnitt oder null = Weltkarte; ver zaehlt hoch, damit die 3D-Kamera folgt. */
  const fokus: { box: { x0: number; y0: number; x1: number; y1: number } | null; ver: number; name: string } = { box: null, ver: 0, name: '' };
  const ansicht = () => {
    k = k0 * zoom;
    vx = Math.max(0, Math.min(KARTE_W, vx)); vy = Math.max(0, Math.min(KARTE_H, vy));
    ox = aw / 2 - vx * k; oy = HUD_H + ah / 2 - vy * k;
  };
  const layout = () => {
    W = root.clientWidth; H = root.clientHeight; dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const narrow = W < 700;
    aw = narrow ? W : W - 300; ah = narrow ? H - HUD_H - Math.round(H * .38) : H - HUD_H;
    k0 = Math.max(0.1, Math.min(aw / KARTE_W, ah / KARTE_H) * .94);
    ansicht();
  };
  /** Um den Bildschirmpunkt (sx, sy) zoomen; der Weltpunkt darunter bleibt stehen. */
  const zoomeUm = (sx: number, sy: number, faktor: number) => {
    const wxp = (sx - ox) / k, wyp = (sy - oy) / k;
    zoom = Math.max(1, Math.min(ZOOM_MAX, zoom * faktor));
    const k2 = k0 * zoom;
    vx = (aw / 2 - (sx - wxp * k2)) / k2; vy = (HUD_H + ah / 2 - (sy - wyp * k2)) / k2;
    ansicht();
  };
  /** Ausschnitt (Weltkoordinaten) in die freie Flaeche einpassen. */
  const zeigeBox = (b: { x0: number; y0: number; x1: number; y1: number }) => {
    zoom = Math.max(1, Math.min(ZOOM_MAX, Math.min(aw / (b.x1 - b.x0), ah / (b.y1 - b.y0)) * 0.92 / k0));
    vx = (b.x0 + b.x1) / 2; vy = (b.y0 + b.y1) / 2;
    ansicht();
  };
  /** Bundesland (NUTS-1) gross anzeigen, zum taktischen Planen; zurueck mit "Zur Weltkarte". */
  const fokussiere = (bl: string) => {
    const gs = gebieteIm(bl);
    if (!gs.length) return;
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    gs.forEach((g) => { b.x0 = Math.min(b.x0, g.box.x0); b.y0 = Math.min(b.y0, g.box.y0); b.x1 = Math.max(b.x1, g.box.x1); b.y1 = Math.max(b.y1, g.box.y1); });
    const r = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.04;
    fokus.box = { x0: b.x0 - r, y0: b.y0 - r, x1: b.x1 + r, y1: b.y1 + r }; fokus.ver++; fokus.name = regionVon(gs[0]);
    zeigeBox(fokus.box);
  };
  const zurWeltkarte = () => { fokus.box = null; fokus.ver++; fokus.name = ''; zoom = 1; vx = KARTE_W / 2; vy = KARTE_H / 2; ansicht(); };
  const toWorld = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k };
  };
  const segDist = (p: any, a: any, b: any) => {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };
  /** Trefferradien in Bildschirmpixeln; kk = Pixel je Welteinheit (2D: k, 3D: von der Kamera an der Klickstelle). */
  const hit = (p: any, kk = k) => {
    const r: any = { city: null, line: null, fault: null, gebiet: null, bf: null, abz: null, knoten: null };
    const faultR = 18 / kk, lineR = 9 / kk;
    if (!RO) for (const L of S.lines) if (L.fault) { const q = posAt(L, L.len * L.fault.t); if (dist(p, q) < faultR) { r.fault = L.id; return r; } }
    for (let i = 0; i < CITIES.length; i++) if (S.vis[i] && dist(p, CITIES[i]) < 16 / kk) { r.city = r.knoten = i; return r; }
    for (const b of S.bf || []) if (dist(p, b) < 12 / kk) { r.bf = b.id; r.knoten = BF0 + b.id; return r; }
    for (const z of S.abz || []) if (dist(p, z) < 10 / kk) { r.abz = z.id; r.knoten = ABZ0 + z.id; return r; }
    let best = 1e9;
    for (const L of S.lines) {
      for (let i = 1; i < L.pts.length; i++) { const d = segDist(p, L.pts[i - 1], L.pts[i]); if (d < lineR && d < best) { best = d; r.line = L.id; } }
    }
    if (r.line === null) { r.gebiet = gebietAn(p.x, p.y)?.id ?? null; r.punkt = { x: p.x, y: p.y }; }
    return r;
  };
  /**
   * Eingabe 2D: Strecke zeichnen = gedrueckt halten und ziehen (Maus, Finger, Stift), Loslassen am Ziel baut sie.
   * Sonst: Tippen = auswaehlen, Ziehen = Karte verschieben, Mausrad / zwei Finger = zoomen.
   */
  let fingerZeichnet = false;
  const zeiger = new Map<number, { x: number; y: number }>();
  let druck: { x: number; y: number; gezogen: boolean } | null = null;
  let pinch = 0;
  const bildschirm = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onMove = (e: PointerEvent) => {
    const p = toWorld(e), s = bildschirm(e);
    if (zeiger.has(e.pointerId)) {
      const alt = zeiger.get(e.pointerId)!;
      zeiger.set(e.pointerId, s);
      if (zeiger.size === 2) {
        // Zwei Finger: zoomen und verschieben.
        const [a, b] = [...zeiger.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0 && d > 0) zoomeUm((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch);
        pinch = d;
        vx -= (s.x - alt.x) / 2 / k; vy -= (s.y - alt.y) / 2 / k; ansicht();
        return;
      }
      if (zeichnung && fingerZeichnet) { zeichneZu(p); return; }
      if (druck && (druck.gezogen || Math.hypot(s.x - druck.x, s.y - druck.y) > 6)) {
        druck.gezogen = true;
        vx -= (s.x - alt.x) / k; vy -= (s.y - alt.y) / k; ansicht();
        cv.style.cursor = 'grabbing';
        return;
      }
    }
    hover = hit(p);
    cv.style.cursor = zeichnung ? 'crosshair' : (hover.knoten !== null || hover.line !== null || hover.fault !== null) ? 'pointer' : 'default';
  };
  const onCanvasDown = (e: PointerEvent) => {
    zeiger.set(e.pointerId, bildschirm(e));
    try { cv.setPointerCapture(e.pointerId); } catch { /* egal */ }
    if (zeiger.size === 2) { fingerZeichnet = false; druck = null; const [a, b] = [...zeiger.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); return; }
    if (zeichnung && !RO && !modal) { fingerZeichnet = true; klick(toWorld(e)); return; }
    druck = { ...bildschirm(e), gezogen: false };
  };
  const onCanvasUp = (e: PointerEvent) => {
    if (!zeiger.has(e.pointerId)) return;
    zeiger.delete(e.pointerId);
    pinch = 0;
    if (fingerZeichnet) { fingerZeichnet = false; losgelassen(); return; }
    if (druck && !druck.gezogen && !zeiger.size) klick(toWorld(e));
    druck = null;
  };
  /** Beim Zeichnen losgelassen: liegt das Ende an einem erlaubten Ziel, wird die Strecke gleich gebaut. */
  const losgelassen = () => { if (zeichnung && zeichnung.ziel !== null && !modal) baueZeichnung(); };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const s = { x: e.clientX - cv.getBoundingClientRect().left, y: e.clientY - cv.getBoundingClientRect().top };
    zoomeUm(s.x, s.y, e.deltaY > 0 ? 1 / 1.2 : 1.2);
  };
  const klick = (p: { x: number; y: number }, kk = k) => {
    if (modal) return;
    const h = hit(p, kk);
    if (zeichnung && !RO) {
      // Zeichnen: Zielstadt/-bahnhof antippen = bauen, sonst wird die Strecke bis hierher verlaengert.
      const ziel = h.knoten;
      zeichneZu(ziel !== null ? knoten(ziel) : p, kk);
      if (ziel !== null && ziel === zeichnung.ziel) baueZeichnung();
      else if (ziel !== null && ziel !== zeichnung.von) toast('Bis ' + knoten(ziel).n + ' kommst du nicht nur über deine Gebiete – kauf die fehlenden oder bau drumherum.', 4500);
      return;
    }
    if (h.fault !== null) { openFault(h.fault); return; }
    if (RO) {
      if (h.line !== null) { sel.line = h.line; } else if (h.city === null) { sel.line = null; }
      return;
    }
    if (h.city !== null) { sel = { city: sel.city === h.city ? null : h.city, line: null, gebiet: null }; return; }
    if (h.bf !== null) { sel = { city: null, line: null, gebiet: null, bf: sel.bf === h.bf ? null : h.bf }; return; }
    if (h.abz !== null) { sel = { city: null, line: null, gebiet: null, abz: sel.abz === h.abz ? null : h.abz }; return; }
    // Strecke: angeklickte Stelle merken (dort entsteht ggf. eine Abzweigstelle).
    if (h.line !== null) { sel = { city: null, line: h.line, gebiet: null, punkt: { x: p.x, y: p.y } }; S.openedLine = true; return; }
    // Gebiet waehlen; die angeklickte Stelle merken (dort entsteht ggf. der Bahnhof). Nochmal klicken versetzt nur die Stelle.
    sel = { city: null, line: null, gebiet: h.gebiet, punkt: h.punkt };
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
  window.addEventListener('pointercancel', onCanvasUp);
  cv.addEventListener('wheel', onWheel, { passive: false });
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
    // Gebiete (Landkreise, Bezirke): Besitz farbig, Kreis-, Landes- und Staatsgrenzen. Herangezoomt direkt zeichnen (scharf).
    if (zoom <= 1.3) ctx.drawImage(holeGebietsBild(), KB.x0, KB.y0, KB.x1 - KB.x0, KB.y1 - KB.y0);
    else zeichneGebiete(ctx, { farbe: gebietFarbe, linie: 1.4 / k, namen: zoom < 3 });
    const hg = zeichnung || hover.gebiet === null || hover.gebiet === sel.gebiet ? null : gebietMitId(hover.gebiet);
    if (hg) umrandeGebiet(ctx, hg, 'rgba(228,87,46,.55)', 1.6 / k);
    const sg = sel.gebiet !== null ? gebietMitId(sel.gebiet) : null;
    if (sg) { umrandeGebiet(ctx, sg, '#fff', 4.5 / k); umrandeGebiet(ctx, sg, '#e4572e', 2.5 / k); }
    ctx.fillStyle = TOENUNG[jahreszeit()]; ctx.fillRect(KB.x0, KB.y0, KB.x1 - KB.x0, KB.y1 - KB.y0);
    // Herangezoomt: Namen der Landkreise/Bezirke, die gross genug dafuer sind.
    if (zoom > 1.3) beschrifteGebiete(ctx, 12 * dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // m: Symbole wachsen beim Zoomen nur maessig mit (bis doppelt so gross); gw: Gleisbreite (halb so breit wie frueher,
    // mind. ca. 2,5 px, stark herangezoomt hoechstens 12 px, damit z. B. Berlin nicht unter dem Gleis verschwindet).
    const m = (k0 / k) * Math.sqrt(Math.min(zoom, 4)), gw = Math.max(Math.min(3.5, 12 / k), 2.5 / k);
    for (const L of S.lines) {
      const on = sel.line === L.id || hover.line === L.id;
      path(L.pts);
      if (on) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = gw * 2.4; ctx.stroke(); }
      path(L.pts); ctx.strokeStyle = L.color; ctx.lineWidth = gw * ((L.gleise || 1) === 2 ? 1.7 : 1); ctx.stroke();
      if ((L.gleise || 1) === 2) { path(L.pts); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = gw * 0.25; ctx.stroke(); }
      path(L.pts); ctx.strokeStyle = L.cond < 25 ? '#ff2d2d' : L.cond < 50 ? '#ffb347' : '#fff';
      ctx.lineWidth = gw * 0.32; ctx.setLineDash([gw * 0.45, gw * 0.9]); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const L of S.lines) if (L.bau) {
      path(L.pts); ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = gw * 1.4; ctx.setLineDash([gw * 1.2, gw * 1.2]); ctx.stroke(); ctx.setLineDash([]);
      const p = posAt(L, L.len / 2), rest = Math.max(0, Math.ceil(L.bau.bis - S.time));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(m, m); label(0, -22, '🚧 ' + rest + ' s', '#b35400'); ctx.restore();
    }
    if (zeichnung) {
      // Gezeichnete Strecke: erlaubter Teil dunkel, an der Zielstadt eingerastet; nicht erlaubter Rest rot gestrichelt.
      const z = zeichnung, ende = z.pts[z.pts.length - 1];
      const pts = z.ziel !== null ? [...z.pts, knoten(z.ziel!)] : z.pts;
      if (pts.length > 1) {
        path(pts); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = gw * 1.8; ctx.stroke();
        path(pts); ctx.strokeStyle = z.ziel !== null ? '#2e8b57' : '#23262b'; ctx.lineWidth = gw; ctx.stroke();
      }
      if (z.fehl) {
        ctx.beginPath(); ctx.moveTo(ende.x, ende.y); ctx.lineTo(z.fehl.x, z.fehl.y);
        ctx.strokeStyle = 'rgba(192,57,43,.85)'; ctx.lineWidth = gw * 0.8; ctx.setLineDash([6 * m, 6 * m]); ctx.stroke(); ctx.setLineDash([]);
      }
      const c = Math.round(zeichnungLaenge(z) * CFG.lineCostPerUnit / 10) * 10, at = z.ziel !== null ? knoten(z.ziel!) : z.fehl ?? ende;
      ctx.save(); ctx.translate(at.x, at.y); ctx.scale(m, m);
      label(0, -24, (z.ziel !== null ? '✓ ' : '') + fmt(c), S.money >= c ? '#23262b' : '#c0392b');
      ctx.restore();
    }
    // Zuege: halb so gross wie frueher, ab etwas Zoom in echter Groesse zum Gleis.
    const tz = Math.max(Math.min(0.45, 1.6 / k), 0.8 * m);
    for (const t of S.trains) {
      const L = S.lines[t.line]; if (!L) continue;
      const n = t.own ? tdef(t).len + (hatUpg(t, 'zusatzwagen') ? 1 : 0) : 3;
      for (let i = 0; i < n; i++) {
        const s = t.s - t.dir * i * 11 * tz;
        if (s < 0 || s > L.len) continue;
        const p = posAt(L, s);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.scale(tz, tz);
        ctx.fillStyle = t.own ? (zugFarbe(t) ?? skinFarbe() ?? (i === 0 ? tdef(t).col : tdef(t).col2)) : (i === 0 ? '#2f3a46' : '#5d6b7a');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(-5, -3.5, 10, 7); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    if (S.wetter) {
      const wa = wetterArt()!;
      zeichneWetter(ctx, wa.id, S.wetter.box, m, performance.now() / 1000);
      for (const L of S.lines) if (wetterTrifft(L)) {
        const p = posAt(L, L.len / 2);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(m, m); ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(wa.icon, 0, -16); ctx.restore();
      }
    }
    const pulse = 1 + .12 * Math.sin(performance.now() / 200);
    for (const L of S.lines) if (L.fault) {
      const p = posAt(L, L.len * L.fault.t), d = DIFF[L.fault.diff];
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(m, m);
      ctx.beginPath(); ctx.arc(0, 0, 13 * pulse, 0, 7); ctx.fillStyle = d.col; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '700 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1);
      ctx.restore();
    }
    // Bahnhoefe: kleines Haus mit Dach, Name darunter; beim Zeichnen moegliche Ziele gruen.
    for (const b of S.bf || []) {
      const code = BF0 + b.id, an = zeichnung?.von === code || zeichnung?.ziel === code || sel.bf === b.id, hov = hover.bf === b.id;
      if (zeichnung && code !== zeichnung.von && praesenz(code)) { ctx.beginPath(); ctx.arc(b.x, b.y, 11 * m, 0, 7); ctx.fillStyle = 'rgba(46,139,87,.35)'; ctx.fill(); }
      const s2 = (an || hov ? 1.25 : 1) * m;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(s2, s2);
      ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(0, -7); ctx.lineTo(6, -1); ctx.lineTo(6, 5); ctx.lineTo(-6, 5); ctx.closePath();
      ctx.fillStyle = bfStrecken(b).length ? '#fff' : '#f4f1ea'; ctx.fill();
      ctx.lineWidth = an ? 2.6 : 1.8; ctx.strokeStyle = an ? '#e4572e' : '#23262b'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = '#23262b'; ctx.fillRect(-1.6, 0.5, 3.2, 4.5);
      ctx.restore();
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(m, m);
      ctx.fillStyle = '#23262b'; ctx.font = '600 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(bfName(b), 0, 8);
      ctx.restore();
    }
    // Stelle fuer einen neuen Bahnhof im gewaehlten eigenen Gebiet.
    if (!RO && !zeichnung && sel.gebiet !== null && sel.punkt && !bfIn(sel.gebiet) && istMein(besitz(sel.gebiet)) && gebietAn(sel.punkt.x, sel.punkt.y)?.id === sel.gebiet) {
      ctx.beginPath(); ctx.arc(sel.punkt.x, sel.punkt.y, 5 * m, 0, 7); ctx.setLineDash([2 * m, 2 * m]); ctx.lineWidth = 1.5 * m; ctx.strokeStyle = '#e4572e'; ctx.stroke(); ctx.setLineDash([]);
    }
    for (const z of S.abz || []) {
      const an = sel.abz === z.id || zeichnung?.von === ABZ0 + z.id || zeichnung?.ziel === ABZ0 + z.id;
      if (zeichnung && ABZ0 + z.id !== zeichnung.von && praesenz(ABZ0 + z.id)) { ctx.beginPath(); ctx.arc(z.x, z.y, 10 * m, 0, 7); ctx.fillStyle = 'rgba(46,139,87,.35)'; ctx.fill(); }
      ctx.save(); ctx.translate(z.x, z.y); ctx.scale(m, m); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(-4.5, -4.5, 9, 9); ctx.lineWidth = an ? 2.6 : 1.8; ctx.strokeStyle = an ? '#e4572e' : '#23262b'; ctx.strokeRect(-4.5, -4.5, 9, 9);
      ctx.restore();
    }
    for (const c of S.gbf || []) {
      const q = knoten(c);
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(m, m); ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(WAREN[wareVon(c)].icon, 15, -12); ctx.restore();
    }
    for (let i = 0; i < CITIES.length; i++) {
      if (!S.vis[i]) continue;
      const c = CITIES[i], connected = S.lines.some((l: any) => l.a === i || l.b === i);
      const isSel = sel.city === i || zeichnung?.von === i || zeichnung?.ziel === i, isHov = hover.city === i;
      // Beim Zeichnen: moegliche Zielstaedte (Gebiet gehoert dir/deinem Clan) gruen markieren.
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(m, m);
      if (zeichnung && i !== zeichnung.von && praesenz(i)) { ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fillStyle = 'rgba(46,139,87,.35)'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, isSel || isHov ? 13 : 11, 0, 7);
      ctx.fillStyle = connected ? '#fff' : '#f4f1ea'; ctx.fill();
      ctx.lineWidth = isSel ? 5 : 3.5; ctx.strokeStyle = isSel ? '#e4572e' : '#23262b'; ctx.stroke();
      ctx.fillStyle = '#23262b'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(c.n, 0, 17);
      ctx.restore();
    }
    for (const p of popups) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / 1.4);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(m, m);
      label(0, -12 - p.age * 26, p.txt, p.col, true);
      ctx.restore();
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
      let h = '<h3 style="color:' + L.color + '">' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '</h3>';
      h += '<div class="mut">Länge ca. ' + Math.round(L.len * .97) + ' km</div>';
      h += '<div class="row"><span>Ausbau</span><b>' + klasse(L).n + '</b></div><div class="mut">max. ' + klasse(L).kmh + ' km/h' + (L.ol ? ' · ⚡ Oberleitung' : ' · ohne Oberleitung') + '</div>';
      h += '<div class="row"><span>Zustand</span><b>' + Math.round(L.cond) + ' %</b></div>' + barHTML(L.cond, condCol(L.cond));
      h += '<div class="row"><span>Trassenentgelt (Fremdzüge)</span><span class="pos">' + sgn(L.inF) + '</span></div>';
      h += '<div class="row"><span>Miete eigene Züge</span><span class="pos">' + sgn(L.inO) + '</span></div>';
      h += '<div class="row"><b>Einnahmen Strecke</b><b class="pos">' + sgn(L.inF + L.inO) + '</b></div>';
      h += '<div class="row"><span>Entgangen (Wartungsstau/Störung)</span><span class="neg">' + sgn(-(L.verlust || 0)) + '</span></div>';
      h += '<div class="mut">Zustand ' + Math.round(L.cond) + ' % → ' + Math.round(condFaktor(L) * 100) + ' % der möglichen Einnahmen. Ausgegeben für Ausbau/Reparatur: ' + fmt(L.rep) + '</div>';
      if (!RO) {
        if (gesperrt(L)) h += '<p class="neg"><b>🚧 Totalsperrung</b> – hier fährt gerade kein Zug, Bahnhöfe und Gebiete an der Strecke bringen nur die Hälfte.</p>';
        if (L.fault) h += '<p class="neg"><b>⚠ Störung (' + DIFF[L.fault.diff].n + ')</b> – Züge fahren langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen. Klicke das rote ! auf der Strecke.</p>';
        h += '<div class="btns"><button data-act="shop" data-arg="z:' + L.id + '">🛒 Zug kaufen …</button>' + ausbauKnopf(L) + olKnopf(L) + bauKnopf(L) + fahrtKnopf(L) + inspektionKnopf(L);
        h += '<button data-act="care" data-arg="' + L.id + '" ' + (S.money < care || L.cond >= 95 ? 'disabled' : '') + '>Pflege durch Fremdfirma (' + fmt(care) + ')</button></div>';
      }
      if (!RO && !L.bau) {
        const geht = abzweigMoeglich(L, sel.punkt);
        h += '<div class="btns"><button data-act="abzbau" data-arg="' + L.id + '" ' + (geht && S.money >= ABZ_PREIS() ? '' : 'disabled') + '>🔀 Abzweigstelle an der angeklickten Stelle · ' + fmt(ABZ_PREIS()) + '</button></div>' +
          (geht ? '' : '<div class="mut">Für eine Abzweigstelle die Strecke an der gewünschten Stelle anklicken (nicht zu nah an den Enden).</div>');
      }
      h += kapHTML(L);
      h += schutzHTML(L);
      h += '<b>Eigene Züge (' + own.length + ')</b>';
      if (!own.length) h += '<div class="mut">' + (RO ? 'Keine.' : 'Noch keiner. Vermiete Züge, um zusätzlich Geld zu verdienen.') + '</div>';
      own.forEach((t: any, i: number) => {
        const n = t.earned;
        h += '<div class="train"><div class="row"><span>' + tdef(t).n + ' #' + (i + 1) + ' <span class="mut">(' + vKmh(t, L) + ' km/h · ' + t.trips + ' Fahrten)</span></span><b class="' + (n >= 0 ? 'pos' : 'neg') + '">' + sgn(n) + '</b></div>' +

          (kohleMangel(t, L) ? '<div class="neg">⚠ Kohlemangel: Kohlelager in ' + knoten(L.a).n + ' oder ' + knoten(L.b).n + ' bauen (Stadt anklicken).</div>' : '') +
          (RO ? '<button class="sm" data-act="show" data-arg="' + (t.type ?? 1) + '">3D ansehen</button>' : '<button class="sm" data-act="werk" data-arg="' + t.id + '">🔧 Werkstatt: Farbe & Upgrades</button>') + '</div>';
      });
      return h;
    }
    if (sel.bf != null && bfMit(sel.bf)) return bahnhofHTML(sel.bf);
    if (sel.abz != null && abzMit(sel.abz)) return abzHTML(sel.abz);
    if (sel.city !== null) return stadtHTML(sel.city);
    if (sel.gebiet !== null && gebietMitId(sel.gebiet)) return gebietHTML(sel.gebiet);
    const own = S.trains.filter((t: any) => t.own);
    const inF = S.lines.reduce((a: number, l: any) => a + l.inF, 0), inO = S.lines.reduce((a: number, l: any) => a + l.inO, 0);
    const verlust = S.lines.reduce((a: number, l: any) => a + (l.verlust || 0), 0), bez = S.bezirkSumme || 0, bfs = S.bfSumme || 0;
    const meineBezirke = welt ? meineGebiete().length : 0;
    let h = '<h3>' + (RO ? 'Unternehmen' : 'Dein Unternehmen') + '</h3>';
    const lv = level(), von = LEVEL_XP[lv - 1], bis = LEVEL_XP[lv];
    h += '<div class="row"><span>Level</span><b>' + lv + (bis === undefined ? ' (max.)' : '') + '</b></div>';
    if (bis !== undefined) h += barHTML(((S.xp || 0) - von) / (bis - von) * 100, '#7b61ff') + '<div class="mut">' + Math.floor(S.xp || 0) + ' / ' + bis + ' Erfahrung – Fahrten, neue Strecken, Ausbau und behobene Störungen bringen Punkte.</div>';
    const jzA = JAHRESZEITEN[jahreszeit()], wa = wetterArt();
    h += '<div class="row"><span>Jahreszeit</span><b>' + jzA.icon + ' ' + jzA.n + '</b></div>';
    if (wa) h += '<div class="row"><span>Wetter</span><b>' + wa.icon + ' ' + wa.n + ' · ' + regionVon(gebieteIm(S.wetter.bl)[0]) + '</b></div><div class="mut">' + wa.text + '</div>';
    h += '<div class="row"><span>Strecken</span><b>' + S.lines.length + '</b></div>';
    h += '<div class="row"><span>Eigene Züge</span><b>' + own.length + '</b></div>';
    h += '<div class="row"><span>Trassenentgelt gesamt</span><span class="pos">' + sgn(inF) + '</span></div>';
    h += '<div class="row"><span>Mieteinnahmen gesamt</span><span class="pos">' + sgn(inO) + '</span></div>';
    h += '<div class="row"><span>Gebiete (' + meineBezirke + ')</span><span class="pos">' + sgn(bez) + '</span></div>';
    h += '<div class="row"><span>Bahnhöfe (' + (S.bf || []).length + ')</span><span class="pos">' + sgn(bfs) + '</span></div>';
    h += '<div class="row"><span>Güteraufträge</span><span class="pos">' + sgn(S.gueterSumme || 0) + '</span></div>';
    h += '<div class="row"><span>Verkehrsverträge</span><span class="pos">' + sgn(S.vertragSumme || 0) + '</span></div>';
    h += '<div class="row"><b>Einnahmen gesamt</b><b class="pos">' + sgn(inF + inO + bez + bfs + (S.gueterSumme || 0) + (S.vertragSumme || 0)) + '</b></div>';
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
      h += '<p class="mut" style="margin-top:14px">Gebiet (Landkreis, Bezirk) auf der Karte anklicken = kaufen; rechts siehst du dann das ganze Bundesland und kannst dort weitere Gebiete kaufen. In eigenen Gebieten kannst du je einen 🚉 Bahnhof bauen. Stadt oder Bahnhof anklicken → „Strecke zeichnen/herstellen“ und über deine Gebiete bis zur nächsten Stadt oder zu deinem nächsten Bahnhof fahren. Strecke anklicken = Details & Züge. Rotes ! = Störung. Mit jeder Verbindung schalten sich neue Städte frei.</p>';
      h += '<div class="btns"><button data-act="reset" class="sm">Spiel zurücksetzen</button></div>';
    }
    return h;
  };
  const uhr = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  /** Eine Gebietszeile mit Farbe, Besitzer und Kauf-/Uebernahme-Knopf (antippen = auf der Karte auswaehlen). */
  const gebietZeile = (g: Gebiet) => {
    const x = besitz(g.id), farbe = x ? (x.clanFarbe || spielerFarbe(x.ownerId)) : '#d9d4c8';
    let knopf = '';
    if (!x) knopf = RO ? '' : '<button class="sm" data-act="gkauf" data-arg="' + g.id + '" ' + (S.money < gebietPreis(g.basis) ? 'disabled' : '') + '>Kaufen · ' + fmt(gebietPreis(g.basis)) + '</button>';
    else if (istMein(x)) knopf = '<span class="pos">✓</span>';
    else if (istClan(x)) knopf = '<span class="mut">Clan' + (x.aktiv ? '' : ' (inaktiv)') + '</span>';
    else if (new Date(x.geschuetztBis).getTime() > Date.now()) knopf = '<span class="mut">🛡 bis ' + uhr(x.geschuetztBis) + '</span>';
    else if (!RO) knopf = '<button class="sm" data-act="gkauf" data-arg="' + g.id + '" ' + (S.money < gebietPreis(x.basis * 3) ? 'disabled' : '') + '>Übernehmen · ' + fmt(gebietPreis(x.basis * 3)) + '</button>';
    return '<div class="bezirk' + (sel.gebiet === g.id ? ' gewaehlt' : '') + '" data-act="gwahl" data-arg="' + g.id + '"><span class="farbpunkt" style="background:' + farbe + '"></span>' +
      '<span class="bz-n">' + g.n + (bfIn(g.id) ? ' 🚉' : '') + ' <span class="mut">· ' + besitzerText(x) + '</span></span>' + knopf + '</div>';
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
      if (durch.length) h += '<div class="mut">Deine Strecken hier: ' + durch.map((l: any) => knoten(l.a).n + ' ⇄ ' + knoten(l.b).n).join(', ') + '</div>';
      h += bahnhofTeil(g);
      if (!RO) h += '<div class="mut">Strecken darfst du nur über eigene Gebiete zeichnen (oder über die von aktiven Clan-Mitgliedern). Fremde Gebiete kosten das Dreifache; der bisherige Besitzer bekommt den Grundpreis erstattet. Frisch gekaufte Gebiete sind 2 Stunden geschützt.</div>';
      h += landHTML(g, false);
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
      if (g) h += '<h3 style="margin-top:10px">Gebiet</h3>' + gebietZeile(g) + gebietEinnahmen(g) + bahnhofTeil(g);
      const team = clanArbeiter(c), ich = eigenerBezirk(c);
      if (team.length || ich) h += '<div class="row"><span>Hier arbeitet</span><b>' + (ich ? 'du' : team.join(', ')) + '</b></div>';
      if (!RO) {
        h += '<div class="btns"><button data-act="zeichne" data-arg="' + c + '" ' + (praesenz(c) ? '' : 'disabled') + '>🛤 Strecke von hier zeichnen</button></div>';
        h += '<div class="mut">' + (praesenz(c) ? 'Die Strecke folgt deinem Zeiger und geht nur über deine Gebiete (und die aktiver Clan-Mitglieder). Je länger, desto teurer.'
          : '✗ Für Strecken von und nach ' + C.n + ' muss dir (oder einem aktiven Clan-Mitglied) das Gebiet gehören.') + '</div>';
      }
      h += gbfTeil(c);
      if ((S.lager || []).includes(c)) h += '<div class="pos">🏭 Dein Kohlelager versorgt Dampfloks auf allen Strecken nach ' + C.n + '.</div>';
      else if (!RO) h += '<div class="btns"><button data-act="lager" data-arg="' + c + '" ' + (S.money < KOHLELAGER.preis || !praesenz(c) ? 'disabled' : '') + '>🏭 Kohlelager bauen · ' + fmt(KOHLELAGER.preis) + '</button></div><div class="mut">' + KOHLELAGER.text + '</div>';
    }
    if (welt && g) h += landHTML(g, false);
    if (!RO) h += '<p class="mut">Weitere Gebiete kaufst du, indem du sie auf der Karte oder in der Bundesland-Übersicht anklickst. Clan-Mitglieder bekommen Erfahrung, wenn du eine Strecke in ihre Städte baust, und deine Gebiete bringen 25 % mehr, wenn deine Strecke auch über Gebiete deines Clans führt.</p>';
    h += '<div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
    return h;
  };
  /** Bahnhof-Abschnitt im Gebiets-/Stadt-Panel: vorhandenen Bahnhof oeffnen oder einen bauen. */
  const bahnhofTeil = (g: Gebiet) => {
    const b = bfIn(g.id);
    if (b) return '<div class="row"><span>🚉 Bahnhof</span><b>' + bfName(b) + '</b></div><div class="btns">' +
      (RO ? '' : '<button data-act="zeichne" data-arg="' + (BF0 + b.id) + '" ' + (praesenz(BF0 + b.id) ? '' : 'disabled') + '>🛤 Strecke vom Bahnhof herstellen</button>') +
      '<button class="sm" data-act="bf" data-arg="' + b.id + '">Bahnhof öffnen</button></div>';
    if (RO || !istMein(besitz(g.id))) return '';
    const hier = !!sel.punkt && sel.gebiet === g.id && gebietAn(sel.punkt.x, sel.punkt.y)?.id === g.id;
    return '<div class="btns"><button data-act="bfbau" data-arg="' + g.id + '" ' + (S.money < BAHNHOF.preis ? 'disabled' : '') + '>🚉 Bahnhof bauen · ' + fmt(BAHNHOF.preis) + '</button></div>' +
      '<div class="mut">' + (hier ? 'Er entsteht an der markierten Stelle (woanders ins Gebiet klicken = versetzen). ' : 'Er entsteht mitten im Gebiet – oder klick vorher auf die gewünschte Stelle. ') + BAHNHOF.text + '</div>';
  };
  /** Panel eines Bahnhofs: Strecken, Einnahmen, "Strecke herstellen". */
  const bahnhofHTML = (id: number) => {
    const b = bfMit(id), g = gebietMitId(b.g), str = bfStrecken(b), andere = (S.bf || []).length - 1;
    let h = '<h3>🚉 ' + bfName(b) + '</h3><div class="mut">Bahnhofsgebäude' + (g ? ' · ' + g.n + ' · ' + regionVon(g) : '') + '</div>';
    h += '<div class="row"><span>Angeschlossene Strecken</span><b>' + str.length + '</b></div>';
    h += '<div class="row"><span>Einnahmen</span><b class="pos">' + fmt(bfRate(b) * 60) + ' / Min.</b></div>';
    if (str.length) {
      str.forEach((L: any) => {
        h += '<div class="bezirk" data-act="linie" data-arg="' + L.id + '"><span class="farbpunkt" style="background:' + L.color + '"></span><span class="bz-n">' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n +
          ' <span class="mut">· Zustand ' + Math.round(L.cond) + ' %</span>' + (L.fault ? ' <span class="neg">⚠ Störung</span>' : '') + '</span></div>';
      });
      h += '<div class="mut">Je Strecke ' + fmt(BAHNHOF.proStrecke * 60) + ' pro Minute bei vollem Zustand. Wartungsstau senkt das, eine Störung halbiert es – halte die Strecken mit Inspektionen und Reparaturen in Schuss (🛠 Arbeiten).</div>';
    } else h += '<div class="mut">Noch keine Strecke angeschlossen – der Bahnhof bringt erst Geld, wenn eine Strecke hier endet.</div>';
    h += gbfTeil(BF0 + b.id);
    if (!RO) {
      h += '<div class="btns"><button data-act="zeichne" data-arg="' + (BF0 + b.id) + '" ' + (praesenz(BF0 + b.id) ? '' : 'disabled') + '>🛤 Strecke herstellen</button>';
      if (!str.length) h += '<button class="sm" data-act="bfweg" data-arg="' + b.id + '">Abreißen (+' + fmt(BAHNHOF.preis / 2) + ')</button>';
      h += '</div>';
      if (!praesenz(BF0 + b.id)) h += '<p class="neg">Das Gebiet gehört dir nicht mehr – von hier kannst du keine neue Strecke bauen.</p>';
      if (andere < 1) h += '<p class="hinweis">' + BF_HINWEIS + '</p>';
    }
    if (g) h += landHTML(g, false);
    h += '<div class="btns"><button class="sm" data-act="stadtzu">Schließen</button></div>';
    return h;
  };
  const BF_HINWEIS = 'ℹ Um die Strecke zu vervollständigen, brauchst du ein weiteres Bahnhofsgebäude: kauf ein weiteres Gebiet (am besten gleich daneben) und bau dort einen Bahnhof. Alternativ kannst du die Strecke zu einer Stadt in deinem Gebiet führen.';
  /** Bundesland-Uebersicht als SVG: alle Gebiete (antippen = auswaehlen), Besitzfarben, Staedte und Bahnhoefe. */
  let landCache = { key: '', svg: '' };
  const landSVG = (bl: string, wahl: number | null, gross: boolean) => {
    const bfs = (S.bf || []) as any[];
    const key = bl + '|' + gebietSchluessel + '|' + wahl + '|' + gross + '|' + bfs.map((b) => b.id + ':' + b.x + ':' + b.y).join(',');
    if (landCache.key === key) return landCache.svg;
    const gs = gebieteIm(bl);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    gs.forEach((g) => { x0 = Math.min(x0, g.box.x0); y0 = Math.min(y0, g.box.y0); x1 = Math.max(x1, g.box.x1); y1 = Math.max(y1, g.box.y1); });
    const rand = Math.max(x1 - x0, y1 - y0) * 0.04;
    x0 -= rand; y0 -= rand; x1 += rand; y1 += rand;
    // Schrift und Symbole in Pixeln der angezeigten Karte (Panel ca. 270 px, gross ca. 600 px breit).
    const px = Math.max(x1 - x0, (y1 - y0) * 0.9) / (gross ? 600 : 270);
    let h = '<svg class="landkarte' + (gross ? ' gross' : '') + '" viewBox="' + [x0, y0, x1 - x0, y1 - y0].map((v) => v.toFixed(1)).join(' ') + '" preserveAspectRatio="xMidYMid meet">';
    gs.forEach((g) => {
      const f = gebietFarbe(g);
      h += '<path d="' + svgPfad(g) + '" fill="' + (f ? f.farbe : '#f1ede3') + '" fill-opacity="' + (f ? f.deckung : 1) + '" fill-rule="evenodd" data-act="gwahl" data-arg="' + g.id + '"><title>' + g.n + '</title></path>';
    });
    const w = wahl !== null ? gs.find((g) => g.id === wahl) : null;
    if (w) h += '<path d="' + svgPfad(w) + '" class="lk-wahl" fill="none" fill-rule="evenodd"/>';
    const ids = new Set(gs.map((g) => g.id));
    gs.forEach((g) => g.staedte.forEach((c) => {
      const C = CITIES[c];
      h += '<circle cx="' + C.x + '" cy="' + C.y + '" r="' + (4 * px).toFixed(2) + '" class="lk-stadt"/><text x="' + C.x + '" y="' + (C.y - 6 * px).toFixed(1) + '" font-size="' + (11 * px).toFixed(2) + '" class="lk-text">' + C.n + '</text>';
    }));
    bfs.filter((b) => ids.has(b.g)).forEach((b) => {
      h += '<rect x="' + (b.x - 3.5 * px).toFixed(1) + '" y="' + (b.y - 3.5 * px).toFixed(1) + '" width="' + (7 * px).toFixed(2) + '" height="' + (7 * px).toFixed(2) + '" class="lk-bf" data-act="bf" data-arg="' + b.id + '"><title>' + bfName(b) + '</title></rect>';
    });
    h += '</svg>';
    landCache = { key, svg: h };
    return h;
  };
  /** Bundesland-Abschnitt im Panel: Karte, Zusammenfassung und Kaufliste aller Gebiete. */
  const landHTML = (g: Gebiet, gross: boolean) => {
    const gs = gebieteIm(g.bl), mein = gs.filter((x) => istMein(besitz(x.id))).length, frei = gs.filter((x) => !besitz(x.id)).length;
    let h = '<h3 style="margin-top:14px">🗺 ' + regionVon(g) + '</h3>';
    h += landSVG(g.bl, sel.gebiet ?? g.id, gross);
    h += '<div class="mut">' + gs.length + ' Gebiete · dir gehören ' + mein + ' · frei ' + frei + '. Gebiet antippen = auswählen, in der Liste kaufen.</div>';
    h += '<div class="btns"><button class="sm" data-act="fokus" data-arg="' + g.bl + '">🔎 ' + regionVon(g) + ' auf der Karte heranzoomen</button>' +
      '<button class="sm" data-act="land" data-arg="' + g.id + '">🗺 Übersicht im Fenster (mit Kaufliste)</button></div>';
    h += '<div class="landliste">' + gs.map(gebietZeile).join('') + '</div>';
    return h;
  };
  /** Grosse Bundesland-Ansicht (Fenster): Karte links, gewaehltes Gebiet und Kaufliste rechts. */
  const landModalHTML = () => {
    const w = gebietMitId(modal.wahl)!, gs = gebieteIm(w.bl);
    let h = '<h2>🗺 ' + regionVon(w) + '</h2><div class="land-gross"><div class="land-karte">' + landSVG(w.bl, w.id, true) + '</div><div class="land-seite">';
    h += '<b>' + w.n + '</b><div class="mut">' + gebietArt(w) + ' · ca. ' + w.f.toLocaleString('de-DE') + ' km²</div>' + gebietZeile(w) + gebietEinnahmen(w) + bahnhofTeil(w);
    h += '<div class="mut" style="margin-top:8px">Alle ' + gs.length + ' Gebiete:</div><div class="landliste">' + gs.map(gebietZeile).join('') + '</div>';
    return h + '</div></div><div class="opts"><button data-act="close">Schließen</button></div>';
  };
  /** Panel waehrend eine Strecke gezeichnet wird. */
  const zeichnungHTML = () => {
    const z = zeichnung!, len = zeichnungLaenge(z), c = Math.round(len * CFG.lineCostPerUnit / 10) * 10;
    let h = '<h3>🛤 Strecke zeichnen</h3>';
    h += '<div class="row"><span>Von</span><b>' + knoten(z.von).n + '</b></div>';
    h += '<div class="row"><span>Nach</span><b>' + (z.ziel !== null ? knoten(z.ziel!).n : '–') + '</b></div>';
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
    if (z.von >= BF0 && z.ziel === null && (S.bf || []).length < 2) h += '<p class="hinweis">' + BF_HINWEIS + '</p>';
    else if (z.ziel === null) h += '<p class="hinweis">Drück auf ' + knoten(z.von).n + ', halte gedrückt und zieh über deine Gebiete bis zum Ziel. Dort loslassen – dann wird die Strecke gebaut.</p>';
    h += '<div class="btns">';
    if (z.ziel !== null) h += '<button data-act="zbau" ' + (S.money < c || lineExists(z.von, z.ziel) ? 'disabled' : '') + '>✅ Bauen · ' + fmt(c) + '</button>';
    h += '<button class="sm" data-act="zzurueck" ' + (z.pts.length > 1 ? '' : 'disabled') + '>↶ Stück zurück</button><button class="sm" data-act="zab">Abbrechen</button></div>';
    h += '<div class="mut">Gedrückt halten und ziehen (Maus oder Finger), am grün markierten Ziel loslassen. Lässt du vorher los, bleibt das Stück stehen – einfach weiterziehen. ' +
      'Zurück über die eigene Linie fahren kürzt sie. Karte verschieben: 3D rechte Maustaste, Handy zwei Finger; zoomen mit dem Mausrad. Esc = Abbrechen.</div>';
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
      const name = knoten(L.a).n + ' ⇄ ' + knoten(L.b).n;
      if (L.bau) { n++; h += '<div class="shop-zug"><div class="shop-text"><b>🚧 ' + MASSNAHMEN[L.bau.m].n + '</b><div class="mut">' + name + '</div>' + bauKnopf(L) + '</div></div>'; }
      if (L.fault) {
        n++;
        const art = FEHLER_ARTEN[L.fault.art ?? 0];
        h += '<div class="shop-zug"><div class="shop-text"><b>⚠ ' + art.n + '</b><div class="mut">' + name + ' · ' + DIFF[L.fault.diff].n + ' · ' + (art.thema ? 'Fachfragen „' + art.themaN + '“' : 'Nivellierlatte ablesen') + '</div></div><button data-act="afault" data-arg="' + L.id + '">Beheben</button></div>';
      }
      if (L.cond < 95) {
        n++;
        h += '<div class="shop-zug"><div class="shop-text"><b>🚂 Inspektionsfahrt</b><div class="mut">' + name + ' · Fehler im Gleis antippen' + (L.risiko ? ' · ⚠ ' + L.risiko + ' übersehene Fehler' : '') + '</div></div>' + fahrtKnopf(L, true) + '</div>';
        h += '<div class="shop-zug"><div class="shop-text"><b>🔧 Inspektion</b><div class="mut">' + name + ' · Zustand ' + Math.round(L.cond) + ' % · 3 Fachfragen, +30 % Zustand</div></div>' + inspektionKnopf(L, true) + '</div>';
      }
    });
    if (!n) h += '<p class="mut">Gerade gibt es nichts zu tun – alles in Schuss!</p>';
    return h + '</div><div class="opts"><button data-act="close">Schließen</button></div>';
  };

  /* ---- Inspektionsfahrt (Minispiel, tycoon-inspektion.ts) ---- */
  /** Praemie je gefundenem Fehler; Zahl der Fehler steigt mit dem Verschleiss. */
  const fahrtEinheit = (L: any) => Math.max(50, Math.round(L.len * 0.6 * (1 + personal('vermesser')) / 10) * 10);
  const fahrtAnzahl = (L: any) => 4 + Math.round((100 - L.cond) / 20);
  const fahrtKnopf = (L: any, kurz = false) => {
    const warten = Math.ceil((L.fahrtAb || 0) - S.time);
    return warten > 0 ? '<button disabled>' + (kurz ? 'in ' : '🚂 Inspektionsfahrt wieder in ') + warten + ' s</button>'
      : '<button data-act="fahrt" data-arg="' + L.id + '">' + (kurz ? 'Losfahren' : '🚂 Inspektionsfahrt: Fehler im Gleis finden') + '</button>';
  };
  /** Fotos echter Schienenfehler aus dem Themenquiz (Fragen mit Bild unter assets/bilder/schienenfehler-*). */
  let fotoFragen: { q: any; bild: any }[] | null = null;
  const ladeFotoFragen = () => {
    if (fotoFragen) return;
    fotoFragen = [];
    Promise.all([fetch('assets/themenquiz/schiene.json').then((r) => r.json()), fetch('assets/bilder/bildnachweise.json').then((r) => r.json())]).then(([j, bn]) => {
      const bilder = new Map((bn as any[]).map((b) => [b.key, b]));
      fotoFragen = (j.questions || []).filter((q: any) => q.imageKey && String(bilder.get(q.imageKey)?.file || '').startsWith('assets/bilder/schienenfehler'))
        .map((q: any) => ({ q, bild: bilder.get(q.imageKey) }));
    }).catch(() => (fotoFragen = []));
  };
  const fahrtHTML = () => {
    const m = modal, L = S.lines[m.line];
    let h = '<h2>🚂 Inspektionsfahrt <span class="mut">· ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '</span></h2>';
    if (m.phase === 'start') {
      ladeFotoFragen();
      h += '<p>Der Messwagen fährt die Strecke ab. <b>Tippe jeden Fehler im Gleis an</b>, bevor er links aus dem Bild läuft. Laub und Steine sind harmlos – sie anzutippen ist ein Fehlalarm.</p>';
      h += '<canvas id="leg" style="width:100%;display:block;border-radius:8px"></canvas>';
      h += '<div class="mut">Auf dieser Strecke ca. ' + fahrtAnzahl(L) + ' Fehler (je schlechter der Zustand, desto mehr). Je gefundenem Fehler: +5 % Zustand und +' + fmt(fahrtEinheit(L)) +
        '. Übersehene Fehler machen eine Störung auf dieser Strecke wahrscheinlicher.' + (hat('messzug') ? ' Dein Gleismesszug fährt langsamer – mehr Zeit zum Hinsehen.' : '') + '</div>';
      return h + '<div class="opts"><button data-act="fstart">▶ Losfahren</button><button data-act="close">Abbrechen</button></div>';
    }
    if (m.phase === 'lauf') return h + '<canvas id="fahrt" style="width:100%;display:block;border-radius:8px;touch-action:none;cursor:crosshair"></canvas><div class="opts"><button data-act="close">Abbrechen</button></div>';
    const e: FahrtErgebnis = m.erg;
    if (m.phase === 'ende') {
      h += '<div class="fb ' + (e.gefunden >= e.gesamt * 0.6 ? 'good' : 'bad') + '"><b>' + e.gefunden + ' von ' + e.gesamt + ' Fehlern gefunden</b>' + (e.fehlalarm ? ' · ' + e.fehlalarm + ' Fehlalarm' + (e.fehlalarm > 1 ? 'e' : '') : '') + '</div>';
      h += '<div class="row"><span>Zustand</span><b>+' + m.plusZustand + ' %</b></div><div class="row"><span>Prämie</span><b class="pos">+' + fmt(m.plusGeld) + '</b></div><div class="row"><span>Erfahrung</span><b>+' + m.plusXp + '</b></div>';
      if (e.verpasst.length) h += '<p class="neg">Übersehen: ' + e.verpasst.join(', ') + ' – eine Störung auf dieser Strecke wird wahrscheinlicher. Gefundene Fehler und behobene Störungen senken das Risiko wieder.</p>';
      else h += '<p class="pos">Alles gefunden – die Strecke ist sauber dokumentiert!</p>';
      h += '<div class="opts">';
      if (fotoFragen?.length) h += '<button data-act="ffoto">📷 Bonus: Schienenfehler auf einem echten Foto bestimmen (+' + fmt(fahrtEinheit(L) * 2) + ')</button>';
      return h + '<button data-act="close">Fertig</button></div>';
    }
    // phase 'foto': echte Aufnahme bestimmen.
    if (!m.foto) { m.foto = fotoFragen![Math.floor(Math.random() * fotoFragen!.length)]; m.reihe = shuffle(m.foto.q.choices.map((_: string, i: number) => i)); }
    const f = m.foto.q, b = m.foto.bild;
    h += '<img src="' + b.file + '" alt="Schienenfehler" style="width:100%;max-height:240px;object-fit:contain;background:#eee;border-radius:8px">';
    h += '<div class="mut">Foto: ' + (b.sourceUrl ? '<a href="' + b.sourceUrl + '" target="_blank" rel="noopener">' + b.credit + '</a>' : b.credit) + '</div>';
    h += '<p><b>' + f.question + '</b></p><div class="opts">';
    m.reihe.forEach((i: number) => {
      const kl = m.antwort === null ? '' : i === f.correctIndex ? ' class="good"' : i === m.antwort ? ' class="bad"' : '';
      h += '<button data-act="fa" data-arg="' + i + '"' + kl + (m.antwort === null ? '' : ' disabled') + '>' + f.choices[i] + '</button>';
    });
    h += '</div>';
    if (m.antwort !== null) {
      const ok = m.antwort === f.correctIndex;
      h += '<div class="fb ' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? 'Richtig! +' + fmt(fahrtEinheit(L) * 2) : 'Leider falsch.') + '</b>' + (f.explanation ? '<br>' + f.explanation : '') + '</div>';
    }
    return h + '<div class="opts"><button data-act="close">Fertig</button></div>';
  };
  /** Nach dem Zeichnen des Fensters: Legende bzw. Fahrt starten. */
  const fahrtStarten = () => {
    const m = modal, L = S.lines[m.line];
    if (m.phase === 'start') { const c = $('#leg'); if (c) zeichneLegende(c); }
    if (m.phase !== 'lauf' || m.stop) return;
    const tempo = 105 * (1 + 0.12 * (S.mode || 0)) * (hat('messzug') ? 0.8 : 1) * (1 - personal('vermesser'));
    m.stop = starteFahrt($('#fahrt'), { anzahl: fahrtAnzahl(L), tempo, onEnde: (e) => fahrtErgebnis(L, e) });
  };
  const fahrtErgebnis = (L: any, e: FahrtErgebnis) => {
    if (modal?.kind !== 'fahrt') return;
    const plusZustand = Math.min(100 - Math.round(L.cond), e.gefunden * 5);
    const plusGeld = Math.max(0, (e.gefunden - e.fehlalarm * 0.5) * fahrtEinheit(L));
    const plusXp = e.gefunden * 3 + (e.gefunden === e.gesamt ? 5 : 0);
    L.cond = Math.min(100, L.cond + e.gefunden * 5); S.money += plusGeld; addXp(plusXp);
    L.risiko = Math.min(6, Math.max(0, (L.risiko || 0) - e.gefunden + e.verpasst.length));
    L.fahrtAb = S.time + 150;
    if (!e.verpasst.length && !e.fehlalarm) zaehle('perfekt');
    Object.assign(modal, { phase: 'ende', erg: e, plusZustand, plusGeld, plusXp, stop: null });
    renderModal(); save();
  };
  const fotoAntwort = (i: number) => {
    const m = modal;
    if (m.antwort !== null || !m.foto) return;
    m.antwort = i;
    if (i === m.foto.q.correctIndex) { S.money += fahrtEinheit(S.lines[m.line]) * 2; addXp(5); save(); }
    renderModal();
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
  /** Antworten mischen (in den Quizdateien steht die richtige oft vorne). */
  const mischeAntworten = (q: any) => {
    const reihe = shuffle(q.choices.map((_: string, i: number) => i));
    return { ...q, choices: reihe.map((i: number) => q.choices[i]), correctIndex: reihe.indexOf(q.correctIndex) };
  };
  /** zweck: 'stoerung' (Stoerung auf modal.line beheben), 'inspektion' oder 'bau' (Arbeitsvorbereitung). */
  const startQuiz = (line: number, thema: string, themaN: string, n: number, need: number, zweck: 'stoerung' | 'inspektion' | 'bau' | 'lehrgang' | 'schicht', extra?: any) => {
    modal = { kind: 'quiz', line, zweck, themaN, laden: true, extra };
    renderModal();
    ladeFragen(thema).then((liste) => {
      if (modal?.kind !== 'quiz' || modal.line !== line) return;
      Object.assign(modal, { laden: false, fragen: shuffle(liste.slice()).slice(0, n).map(mischeAntworten), i: 0, ok: 0, need: Math.min(need, n), antwort: null });
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
    let h = '<h2>' + (q.zweck === 'schicht' ? '👷 Arbeitsschicht · Clan-Großprojekt</h2>' : q.zweck === 'lehrgang' ? '🎓 Lehrgang · ' + ROLLEN.find((r) => r.id === q.extra.rolle)!.n + '</h2>'
      : (q.zweck === 'stoerung' ? '⚠ ' + FEHLER_ARTEN[L.fault?.art ?? 0].n : q.zweck === 'bau' ? '📋 Arbeitsvorbereitung' : '🔧 Inspektion') + ' <span class="mut">· ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '</span></h2>');
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
    else if (q.zweck === 'bau') starteBau(L, q.extra.m, q.extra.sp, q.ok);
    else if (q.zweck === 'lehrgang') lehrgangErgebnis(q.extra.rolle, ok);
    else if (q.zweck === 'schicht') { S.schichtAb = S.time + SCHICHT_PAUSE; addXp(q.ok * 2); if (q.ok) opts.onClanBeitrag?.(q.ok * SCHICHT_WERT, true); else toast('Keine Frage richtig – die Schicht zählt nicht.'); }
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
    $('#day').textContent = 'Tag ' + (Math.floor(S.time / CFG.daySec) + 1) + ' · ' + JAHRESZEITEN[jahreszeit()].icon + ' ' + JAHRESZEITEN[jahreszeit()].n + (S.wetter ? ' · ' + wetterArt()!.icon + ' ' + wetterArt()!.n : '');
    const lvEl = $('#lvl');
    if (lvEl) lvEl.textContent = '⭐ Level ' + level() + ' · 🏆 ' + (S.pokale || 0);
    root.querySelectorAll('#speeds button').forEach((b: any) => b.classList.toggle('on', +b.dataset.arg === S.speed));
    const h = panelHTML();
    if (h !== lastPanel) { $('#panel').innerHTML = h; lastPanel = h; }
    const wb = $('#weltbtn');
    if (wb) {
      const an = !!fokus.box || zoom > 1.05;
      wb.style.display = an ? 'block' : 'none';
      if (an) wb.textContent = '🌍 Zur Weltkarte' + (fokus.name ? ' (aus ' + fokus.name + ')' : '');
    }
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
  const closeModal = () => { modal?.stop?.(); modal = null; $('#modal').style.display = 'none'; opts.onVorschau?.(null, 0); };
  const renderModal = () => {
    const box = $('#mcard'); $('#modal').style.display = 'flex';
    box.className = 'card' + (modal.kind === 'shop' ? ' breit' : '');
    if (modal.kind === 'shop') { box.innerHTML = shopHTML(); opts.onVorschau?.($('#lok3d'), modal.ansicht ?? 1); return; }
    if (modal.kind === 'arbeit') { box.innerHTML = arbeitHTML(); return; }
    if (modal.kind === 'land') { box.className = 'card breit'; box.innerHTML = landModalHTML(); return; }
    if (modal.kind === 'quiz') { box.innerHTML = quizHTML(); return; }
    if (modal.kind === 'album') { box.className = 'card breit'; box.innerHTML = albumHTML(); return; }
    if (modal.kind === 'auftraege') { box.innerHTML = auftraegeHTML(); return; }
    if (modal.kind === 'personal') { box.className = 'card breit'; box.innerHTML = personalHTML(); return; }
    if (modal.kind === 'bau') { box.className = 'card breit'; box.innerHTML = bauHTML(); return; }
    if (modal.kind === 'fahrt') { box.innerHTML = fahrtHTML(); fahrtStarten(); return; }
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
      if (modal.kind === 'buy') h += '<div class="mut">Strecke ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + (td.kohle ? ' · Dampflok: braucht ein Kohlelager in einer der beiden Städte' : '') + '</div><button data-act="buyok" ' + (S.money < td.cost + kf.preis ? 'disabled' : '') + '>Jetzt kaufen (' + fmt(td.cost + kf.preis) + (kf.preis ? ', davon Lack ' + fmt(kf.preis) : '') + ')</button>';
      h += '<button data-act="close">' + (modal.kind === 'buy' ? (modal.zurueck ? 'Zurück zum Shop' : 'Abbrechen') : 'Schließen') + '</button></div>';
      box.innerHTML = h;
      opts.onVorschau?.($('#lok3d'), modal.typ, modal.kind === 'buy' ? kf.farbe ?? skinFarbe() : skinFarbe());
      return;
    }
    if (modal.kind === 'fault') {
      const f = L.fault, d = DIFF[f.diff], can = unlocked(f.diff), art = FEHLER_ARTEN[f.art ?? 0];
      const aufgabe = art.thema ? 'Fachfragen „' + art.themaN + '“ (' + QUIZ_N[f.diff] + ' Fragen, mind. ' + QUIZ_NEED[f.diff] + ' richtig)' : d.task;
      box.innerHTML = '<h2>⚠ ' + art.n + ': ' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + '</h2>' +
        '<p><span class="tag" style="background:' + d.col + '">' + d.n + '</span> &nbsp;Aufgabe: <b>' + aufgabe + '</b><br>Auftragswert: <b>' + fmt(d.val) + '</b></p>' +
        '<p class="mut">Solange die Störung besteht, fahren die Züge langsamer und bringen nur ' + Math.round(CFG.faultIncome * 100) + ' % Einnahmen; deine Gebiete entlang der Strecke nur die Hälfte.</p>' +
        '<div class="opts">' +
        '<button data-act="firm" ' + (S.money < firmaPreis(d) ? 'disabled' : '') + '>Fremdfirma beauftragen (−' + fmt(firmaPreis(d)) + ')</button>' +
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
    let h = '<h2>🔧 Werkstatt · ' + td.n + '</h2><div class="mut">' + knoten(L.a).n + ' ⇄ ' + knoten(L.b).n + ' · ' + vKmh(t, L) + ' km/h · ' + t.trips + ' Fahrten</div>';
    h += '<div class="lok3d" id="lok3d"></div>';
    h += '<h3>Lackierung</h3>' + farbKnoepfe('zfarbe', aktiv) + '<div class="mut">Aktuell: ' + ZUG_FARBEN.find((f) => f.id === aktiv)!.n + '. Neulackieren kostet je nach Farbe ' + fmt(400) + '–' + fmt(600) + ', Werkslack ist kostenlos.</div>';
    h += '<h3>Upgrades</h3><div class="shop-liste">';
    ZUG_UPGRADES.forEach((u) => {
      const p = upgradePreis(td.cost, u.faktor), drin = hatUpg(t, u.id);
      h += '<div class="shop-zug' + (lv < u.lvl && !drin ? ' zu' : '') + '"><div class="shop-text"><b>' + u.n + '</b><div class="mut">' + u.text + '</div></div>' +
        (drin ? '<button disabled>✓ eingebaut</button>' : lv < u.lvl ? '<button disabled>🔒 Level ' + u.lvl + '</button>'
          : '<button data-act="zupg" data-arg="' + u.id + '" ' + (S.money < p ? 'disabled' : '') + '>' + fmt(p) + '</button>') + '</div>';
    });
    h += '</div>' + (RO ? '' : laufHTML(t)) + '<div class="opts"><button data-act="close">' + (modal.zurueck ? 'Zurück zum Shop' : 'Schließen') + '</button></div>';
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
        '<option value="' + l.id + '"' + (l.id === L.id ? ' selected' : '') + '>' + knoten(l.a).n + ' ⇄ ' + knoten(l.b).n + ' (' + klasse(l).n + ', ' + klasse(l).kmh + ' km/h)</option>').join('') + '</select></label>';
      if (modal.ansicht === undefined) modal.ansicht = 1;
      h += '<div class="lok3d" id="lok3d"></div><div class="shop-ansicht" id="ansichtName">' + TRAINS[modal.ansicht].n + ' · bis ' + TRAINS[modal.ansicht].kmh + ' km/h</div>';
      h += '<div class="shop-liste">';
      TRAINS.map((z, i) => ({ z, i })).sort((a, b) => a.z.lvl - b.z.lvl || a.z.cost - b.z.cost).forEach(({ z, i }) => {
        const zu = lv < z.lvl, ohneOL = z.el && !L.ol, eff = Math.min(z.kmh, K.kmh);
        h += '<div class="shop-zug' + (zu ? ' zu' : '') + (i === modal.ansicht ? ' gewaehlt' : '') + '" data-zug="' + i + '">' +
          '<button class="sm auge" data-act="sieh" data-arg="' + i + '" title="In 3D ansehen">👁</button><div class="shop-text"><b>' + z.n + '</b>' + (z.el ? ' <span class="tag" style="background:#2e86ab">⚡ elektrisch</span>' : '') + (z.gueter ? ' <span class="tag" style="background:#8d6e63">' + z.gueter.map((w) => WAREN[w].icon).join('') + '</span>' : '') +
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
        h += '<div class="shop-zug"><span class="farbpunkt" style="background:' + (f ?? tdef(t).col) + '"></span><div class="shop-text"><b>' + tdef(t).n + '</b><div class="mut">' + knoten(L2.a).n + ' ⇄ ' + knoten(L2.b).n +
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
        h += '<div class="shop-zug"><div><b>' + knoten(l.a).n + ' ⇄ ' + knoten(l.b).n + '</b><div class="mut">' + klasse(l).n + ' · ' + klasse(l).kmh + ' km/h · Zustand ' + Math.round(l.cond) + ' %' + (l.ol ? ' · ⚡' : '') + '</div></div><div class="knoepfe">' + ausbauKnopf(l) + olKnopf(l) + '</div></div>';
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
    if (RO && a !== 'show' && a !== 'album' && a !== 'close' && a !== 'gwahl' && a !== 'stadtzu' && a !== 'land' && a !== 'fokus' && a !== 'welt') return;
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
    else if (a === 'abzbau') baueAbzweig(+arg!, sel.punkt);
    else if (a === 'lauf') { const [zid, lid] = arg!.split(':'); laufVerlaengern(+zid, +lid); renderModal(); }
    else if (a === 'laufweg') { const t = zugVon(+arg!); if (t) { delete t.route; delete t.rdir; save(); } renderModal(); }
    else if (a === 'gleis2') baueZweitesGleis(+arg!);
    else if (a === 'signal') baueSignale(+arg!);
    else if (a === 'schutz') { const [lid, sid] = arg!.split(':'); kaufeSchutz(+lid, sid); }
    else if (a === 'firm') { resolveFault(S.lines[modal.line], 'firm'); closeModal(); save(); }
    else if (a === 'self') {
      const L = S.lines[modal.line], art = FEHLER_ARTEN[L.fault.art ?? 0];
      if (art.thema) startQuiz(L.id, art.thema, art.themaN, QUIZ_N[L.fault.diff], QUIZ_NEED[L.fault.diff], 'stoerung');
      else startSelf();
    }
    else if (a === 'album') { modal = { kind: 'album' }; renderModal(); }
    else if (a === 'auftraege') { modal = { kind: 'auftraege' }; renderModal(); }
    else if (a === 'gbf') baueGbf(+arg!);
    else if (a === 'cpstart') opts.onClanProjekt?.(arg!);
    else if (a === 'cpgeld') { if (S.money >= +arg!) opts.onClanBeitrag?.(+arg!, false); else toast('Zu wenig Guthaben.'); }
    else if (a === 'cpschicht') { if (S.time >= (S.schichtAb || 0)) startQuiz(-1, ['lf10', 'lf01', 'arbeitssicherheit', 'bettung'][ri(0, 3)], 'Großprojekt', SCHICHT_FRAGEN, 0, 'schicht'); }
    else if (a === 'ausg' && modal?.kind === 'auftraege') { modal.gebot = +arg!; renderModal(); }
    else if (a === 'ausv' && modal?.kind === 'auftraege') { modal.versp = +arg!; renderModal(); }
    else if (a === 'ausab' && modal?.kind === 'auftraege' && S.aus) {
      const gi = modal.gebot ?? 1, vi = modal.versp ?? 0;
      S.aus.gebot = Math.round(S.aus.richt * GEBOTE[gi].f); S.aus.versprechen = vi;
      toast('📜 Gebot für ' + landName(S.aus.bl) + ' abgegeben.'); save(); renderModal();
    }
    else if (a === 'personal') { modal = { kind: 'personal' }; renderModal(); }
    else if (a === 'pein') { stelleEin(arg!); renderModal(); }
    else if (a === 'plehr') { const r = ROLLEN.find((x) => x.id === arg); if (r) startQuiz(-1, r.themen[ri(0, r.themen.length - 1)], r.n, LEHRGANG_N, LEHRGANG_NEED, 'lehrgang', { rolle: r.id }); }
    else if (a === 'bau') { const L = S.lines[+arg!]; if (L && !L.bau) { modal = { kind: 'bau', line: L.id, m: L.cond < 40 ? 3 : 0, sp: 0 }; renderModal(); } }
    else if (a === 'bauwahl' && modal?.kind === 'bau') { const [w, i] = arg!.split(':'); if (w === 'm') modal.m = +i; else modal.sp = +i; renderModal(); }
    else if (a === 'baustart' && modal?.kind === 'bau') {
      const mo = modal, L = S.lines[mo.line], mm = MASSNAHMEN[mo.m];
      if (S.money < bauKosten(L, mo.m, mo.sp).summe) { toast('Zu wenig Guthaben.'); return; }
      if (arg === '1') startQuiz(L.id, mm.thema, mm.themaN, VORBEREITUNG_FRAGEN, 0, 'bau', { m: mo.m, sp: mo.sp });
      else { closeModal(); starteBau(L, mo.m, mo.sp, 0); }
    }
    else if (a === 'fahrt') { modal = { kind: 'fahrt', line: +arg!, phase: 'start' }; renderModal(); }
    else if (a === 'fstart' && modal?.kind === 'fahrt') { modal.phase = 'lauf'; renderModal(); }
    else if (a === 'ffoto' && modal?.kind === 'fahrt') { modal.phase = 'foto'; modal.antwort = null; renderModal(); }
    else if (a === 'fa' && modal?.kind === 'fahrt') fotoAntwort(+arg!);
    else if (a === 'qa') quizAntwort(+arg!);
    else if (a === 'qnext') quizWeiter();
    else if (a === 'arbeiten') { modal = { kind: 'arbeit' }; renderModal(); }
    else if (a === 'afault') { modal = { kind: 'fault', line: +arg! }; renderModal(); }
    else if (a === 'insp') {
      const L = S.lines[+arg!], [thema, themaN] = INSPEKTION_THEMEN[ri(0, INSPEKTION_THEMEN.length - 1)];
      if (L && S.time >= (L.inspAb || 0)) startQuiz(L.id, thema, themaN, 3, 2, 'inspektion');
    }
    else if (a === 'stadtzu') sel = { city: null, line: null, gebiet: null };
    else if (a === 'gwahl') {
      if ((e.target as HTMLElement).closest('button')) return;
      sel = { city: null, line: null, gebiet: +arg! };
      if (modal?.kind === 'land') { modal.wahl = +arg!; renderModal(); }
    }
    else if (a === 'land') { modal = { kind: 'land', wahl: +arg! }; renderModal(); }
    else if (a === 'fokus') { if (modal?.kind === 'land') closeModal(); fokussiere(arg!); }
    else if (a === 'welt') zurWeltkarte();
    else if (a === 'bfbau') { baueBahnhof(+arg!, sel.gebiet === +arg! ? sel.punkt : null); if (modal?.kind === 'land') closeModal(); }
    else if (a === 'bf') { sel = { city: null, line: null, gebiet: null, bf: +arg! }; if (modal?.kind === 'land') closeModal(); }
    else if (a === 'bfweg') reisseBahnhofAb(+arg!);
    else if (a === 'linie') { sel = { city: null, line: +arg!, gebiet: null }; S.openedLine = true; }
    else if (a === 'gkauf') {
      const g = gebietMitId(+arg!), x = besitz(+arg!);
      if (!g) return;
      const preis = gebietPreis(x ? x.basis * 3 : g.basis);
      if (S.money < preis) toast('Zu wenig Guthaben (' + fmt(preis) + ' nötig).');
      else opts.onGebiet?.(g.id, g.basis);
    }
    else if (a === 'zeichne') { starteZeichnen(+arg!); if (zeichnung && zeichnung.von >= BF0 && (S.bf || []).length < 2) toast(BF_HINWEIS, 6000); }
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
    else if (a === 'reset') {
      if (!confirm('Spielstand wirklich löschen?')) return;
      opts.onReset?.(); fresh(); sel = { city: null, line: null, gebiet: null }; zeichnung = null; tutStart = 0;
      // Der Server gibt die Gebiete frei; bis die Welt neu geladen ist, nicht mehr als eigene anzeigen.
      besitzNach = new Map([...besitzNach].filter(([, x]) => !istMein(x)));
      gebietSchluessel = 'reset' + Date.now();
    }
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
    money: S.money, bezirkSumme: S.bezirkSumme, bf: S.bf, bfNext: S.bfNext, bfSumme: S.bfSumme, time: S.time, vis: S.vis, skill: S.skill, xp: S.xp, pokale: S.pokale, skins: S.skins, skin: S.skin, ausr: S.ausr, lager: S.lager, mode: S.mode, faultIn: S.faultIn, wetter: S.wetter, wetterIn: S.wetterIn, jz: S.jz, personal: S.personal, lehrAb: S.lehrAb, schichtAb: S.schichtAb, stats: S.stats, album: S.album, abzeichen: S.abzeichen, aus: S.aus, ausIn: S.ausIn, vertraege: S.vertraege, vertragSumme: S.vertragSumme, abz: S.abz, abzNext: S.abzNext, gbf: S.gbf, auftraege: S.auftraege, auftragIn: S.auftragIn, auftragNr: S.auftragNr, gueterSumme: S.gueterSumme, tut: S.tut, faultsFixed: S.faultsFixed, passes: S.passes,
    anyFault: S.anyFault, openedLine: S.openedLine, nextId: S.nextId,
    lines: S.lines.map((l: any) => ({ a: l.a, b: l.b, p: l.p, cond: l.cond, inF: l.inF, inO: l.inO, up: l.up, rep: l.rep, fault: l.fault, color: l.color, cls: l.cls, ol: l.ol, verlust: l.verlust, inspAb: l.inspAb, fahrtAb: l.fahrtAb, risiko: l.risiko, schutz: l.schutz, bau: l.bau, neuBis: l.neuBis, gleise: l.gleise, signal: l.signal, puenkt: l.puenkt })),
    own: S.trains.filter((t: any) => t.own),
  });
  const save = () => { if (RO || !alive) return; opts.onSave(serialize(), S.money); };
  const load = (d: any) => {
    try {
      if (!d || !Array.isArray(d.lines)) return false;
      fresh();
      // vis auf die aktuelle Staedteliste bringen (alte Staende kennen weniger Staedte).
      const bf = Array.isArray(d.bf) ? d.bf : [];
      Object.assign(S, { money: Math.max(0, d.money || 0), bezirkSumme: d.bezirkSumme || 0, bf, bfNext: d.bfNext ?? bf.reduce((m: number, b: any) => Math.max(m, b.id + 1), 1), bfSumme: d.bfSumme || 0, time: d.time, vis: CITIES.map((_, i) => !!d.vis?.[i]), skill: d.skill, mode: d.mode ?? 0, faultIn: d.faultIn ?? modeInterval(d.mode ?? 0), tut: d.tut, faultsFixed: d.faultsFixed, passes: d.passes, anyFault: d.anyFault, openedLine: d.openedLine, nextId: d.nextId });
      d.lines.forEach((o: any) => { const L: any = addLine(o.a, o.b, Array.isArray(o.p) ? o.p : undefined); Object.assign(L, { cond: o.cond, inF: o.inF, inO: o.inO, up: o.up, rep: o.rep, fault: o.fault, color: o.color, cls: o.cls ?? 1, ol: o.ol ?? (o.cls ?? 1) >= 1, verlust: o.verlust || 0, inspAb: o.inspAb || 0, fahrtAb: o.fahrtAb || 0, risiko: o.risiko || 0, schutz: o.schutz || [], bau: o.bau || null, neuBis: o.neuBis || 0, gleise: o.gleise || 1, signal: o.signal || 0, puenkt: o.puenkt ?? 100 }); });
      S.trains = d.own || [];
      // Alte Staende ohne Erfahrung: aus dem bisherigen Fortschritt schaetzen. Alte Strecken gelten als Hauptbahn (cls 1, s. o.).
      S.schichtAb = d.schichtAb ?? 0; S.stats = d.stats ?? {}; S.album = d.album ?? []; S.abzeichen = d.abzeichen ?? [];
      S.aus = d.aus ?? null; S.ausIn = d.ausIn ?? 120; S.vertraege = d.vertraege ?? []; S.vertragSumme = d.vertragSumme ?? 0;
      S.abz = Array.isArray(d.abz) ? d.abz : []; S.abzNext = d.abzNext ?? S.abz.reduce((m: number, z: any) => Math.max(m, z.id + 1), 1);
      S.gbf = d.gbf ?? []; S.auftraege = d.auftraege ?? []; S.auftragIn = d.auftragIn ?? 30; S.auftragNr = d.auftragNr ?? 0; S.gueterSumme = d.gueterSumme ?? 0;
      S.personal = d.personal ?? {}; S.lehrAb = d.lehrAb ?? {};
      S.wetter = d.wetter ?? null; S.wetterIn = d.wetterIn ?? 180; S.jz = d.jz ?? jahreszeit();
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
    welt: () => ({ S, sel, CITIES, DIFF, posAt, skin: skinFarbe(), welt, zeichnung, gebietFarbe, gebietSchluessel, knoten, bfName, BF0, fokus, jahreszeit: jahreszeit(), wetter: S.wetter ? { id: wetterArt()!.id, box: S.wetter.box } : null }),
    setzeWelt: (w: any) => {
      welt = w;
      besitzNach = new Map((w?.bezirke || []).filter((x: any) => x.stadt === GEBIET_STADT).map((x: any) => [x.bezirk, x]));
      gebietSchluessel = JSON.stringify([w?.ich, [...besitzNach.values()].map((x) => [x.bezirk, x.ownerId, x.clanFarbe, x.aktiv])]);
      if (modal?.kind === 'land' || modal?.kind === 'auftraege') renderModal();
    },
    bezahlt: (preis: number, text: string) => { S.money = Math.max(0, S.money - gebietPreis(preis)); addXp(8); toast(text, 3500); save(); if (modal?.kind === 'land') renderModal(); },
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
    clanBezahlt: (betrag: number, text: string) => { zaehle('clan'); S.money = Math.max(0, S.money - betrag); addXp(betrag ? Math.min(20, Math.round(betrag / 1000)) : 5); toast(text, 4000); save(); if (modal?.kind === 'auftraege') renderModal(); },
    klickWelt: (x: number, y: number, kk: number) => klick({ x, y }, kk),
    zeigerWelt: (x: number, y: number, kk: number) => { if (zeichnung && !modal) zeichneZu({ x, y }, kk); },
    losgelassen: () => losgelassen(),
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
      window.removeEventListener('pointercancel', onCanvasUp);
      cv.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onActionDown);
      root.removeEventListener('keydown', onEnter);
      root.removeEventListener('change', onChange);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
    },
  };
}
