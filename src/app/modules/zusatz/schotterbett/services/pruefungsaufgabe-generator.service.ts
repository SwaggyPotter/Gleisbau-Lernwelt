import { Injectable } from '@angular/core';
import { Niveau, Pruefungsaufgabe, TeilAufgabe } from '../models/schotterbett.models';
import { bettungsdickeCm, vorKopfCm } from '../data/regelwerk';
import {
  GLEISABSTAND_REGEL_M, Gleise, TABELLE_ABSTAENDE_CM, gleisabstandZuschlagProzent, tabellenwertM3ProKm,
} from '../data/schottertabelle';
import { SCHWELLEN, Schwelle } from '../data/schwellen';
import { formatDE, nextId, randChoice, randInt, randStep } from './schotterbett-utils';

// Erfundene Ortsnamen, damit keine echte Baumaßnahme vorgetäuscht wird.
const ORTE: [string, string][] = [
  ['Altenbach', 'Neuhausen'], ['Birkenfeld', 'Steinau'], ['Grünwalde', 'Hohenried'],
  ['Lindental', 'Kaltenberg'], ['Oberau', 'Wiesenbrück'], ['Talheim', 'Rotenfels'],
  ['Eichstedt', 'Mühlhagen'], ['Sonnenbühl', 'Fichtenau'],
];

const GESCHWINDIGKEITEN = [80, 100, 120, 140, 160, 180, 200, 230, 250] as const;
const VERSCHMUTZUNG_PROZENT = [20, 25, 30, 35, 40, 45, 50] as const;
/** Schüttdichten bewusst frei gewählt (nicht die Werte aus den Ausbildungsunterlagen). */
const DICHTEN_VERDICHTET = [1.6, 1.7, 1.75, 1.8] as const;
const DICHTEN_UNVERDICHTET = [1.4, 1.5, 1.55] as const;
const WAGEN_T = [45, 50, 55, 60] as const;
const GLEISABSTAENDE_M = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8] as const;

/** Leicht: vor Kopf und Bettung sind vorgegeben (Planung), passende Lage dazu. */
const LEICHT_FAELLE = [
  { lage: 'eine eingleisige Nebenstrecke (v = 100 km/h)', v: 100, vk: 40, bd: 30 },
  { lage: 'eine eingleisige Hauptstrecke (v = 120 km/h)', v: 120, vk: 40, bd: 30 },
  { lage: 'eine eingleisige Hauptstrecke (v = 160 km/h)', v: 160, vk: 40, bd: 30 },
  { lage: 'eine Ausbaustrecke (v = 200 km/h)', v: 200, vk: 50, bd: 30 },
  { lage: 'eine Schnellfahrstrecke (v = 250 km/h)', v: 250, vk: 50, bd: 35 },
] as const;

interface OberbauWahl {
  schwelle: Schwelle;
  abstand: number;
  /** Seite der Tabelle (Schwellenabstand); bei festem Abstand egal, dann 60. */
  seitenAbstand: number;
  bezeichnung: string;
}

/** Schwellentyp passend zur Geschwindigkeit wählen, B 70 am häufigsten. */
function oberbauWahl(v: number): OberbauWahl {
  const moeglich = SCHWELLEN.filter(s => v <= s.aufgabenBisKmh && !(v > 230 && s.id === 'b70'));
  const pool = [...moeglich, ...moeglich.filter(s => s.id === 'b70' || s.id === 'b90')];
  const schwelle = randChoice(pool);
  const abstand = schwelle.abstandFestCm ?? abstandFuer(v);
  const seitenAbstand = (TABELLE_ABSTAENDE_CM as readonly number[]).includes(abstand) ? abstand : 60;
  const proKm = Math.round(100000 / abstand);
  const kurz = schwelle.id === 'b70' ? 'B70' : schwelle.id === 'b90' ? 'B90' : null;
  const bezeichnung = kurz
    ? `W14K-${abstand}-${kurz}-${proKm}`
    : `${schwelle.name}, Schwellenabstand ${abstand} cm`;
  return { schwelle, abstand, seitenAbstand, bezeichnung };
}

const REL_TOL = 0.015;

function km(wertM: number): string {
  return `km ${formatDE(wertM / 1000, 3)}`;
}

function dichten() {
  return { rv: randChoice(DICHTEN_VERDICHTET), ru: randChoice(DICHTEN_UNVERDICHTET) };
}

/** Wiederverwendung mal als Verschmutzungsgrad, mal direkt als Quote angeben. */
function reinigungsSatz(verschmutzung: number, alsQuote: boolean): string {
  const reuse = 100 - verschmutzung;
  return !alsQuote
    ? `Der Verschmutzungsgrad des Altschotters beträgt ${verschmutzung} %. Der saubere Rest wird nach der Reinigung wieder eingebaut.`
    : `Vom Altschotter werden nach der Reinigung ${reuse} % wiederverwendet.`;
}

function abstandFuer(v: number): number {
  return v <= 120 ? randChoice([63, 65] as const) : 60;
}

@Injectable({ providedIn: 'root' })
export class PruefungsaufgabeGeneratorService {
  generate(niveau: Niveau): Pruefungsaufgabe {
    // Werte vermeiden, bei denen die Wagenzahl knapp an einer ganzen Zahl
    // liegt, sonst kippt das Aufrunden schon durch normales Zwischenrunden.
    for (let i = 0; i < 40; i++) {
      const aufgabe = this.erzeuge(niveau, false);
      if (aufgabe) return aufgabe;
    }
    return this.erzeuge(niveau, true)!;
  }

  private erzeuge(niveau: Niveau, erzwingen: boolean): Pruefungsaufgabe | null {
    if (niveau === 'leicht') return this.leicht(erzwingen);
    if (niveau === 'mittel') return this.mittel(erzwingen);
    return this.schwer(erzwingen);
  }

  private rahmen() {
    const [von, nach] = randChoice(ORTE);
    const strecke = randInt(1100, 6990);
    const startM = randStep(1000, 60000, 50);
    const laengeM = randStep(600, 3000, 50);
    const bf = randChoice(['Bahnhof ', 'Bf ', '']);
    return { von: bf + von, nach: bf + nach, strecke, startM, laengeM, endeM: startM + laengeM };
  }

  private wagenOk(neuschotterT: number, kap: number): boolean {
    const frac = neuschotterT / kap - Math.floor(neuschotterT / kap);
    return frac > 0.1 && frac < 0.9;
  }

  // ---------------- leicht ----------------

  /** Neubau eingleisig, vor Kopf und Bettung vorgegeben, Wert aus der Tabelle. */
  private leicht(erzwingen: boolean): Pruefungsaufgabe | null {
    const r = this.rahmen();
    const fall = randChoice(LEICHT_FAELLE);
    const ob = oberbauWahl(fall.v);
    const abstand = ob.abstand;
    const kap = randChoice(WAGEN_T);
    const { rv } = dichten();
    const oberbau = ob.bezeichnung;

    const w = tabellenwertM3ProKm(ob.schwelle.id, abstand, fall.vk, fall.bd, 1);
    const volumen = (w * r.laengeM) / 1000;
    const masse = volumen * rv;
    if (!erzwingen && !this.wagenOk(masse, kap)) return null;
    const wagen = Math.ceil(masse / kap - 1e-9);

    return {
      id: nextId('pa'), niveau: 'leicht',
      titel: `Neubau zwischen ${r.von} und ${r.nach}`,
      absaetze: [
        `Für ${fall.lage} zwischen ${r.von} und ${r.nach} (Strecke ${r.strecke}) wird zwischen ${km(r.startM)} und ${km(r.endeM)} ein Gleis neu gebaut. Oberbau: ${oberbau}.`,
        `Laut Planung bekommt das Gleis ${fall.vk} cm Schotter vor Kopf und eine Bettungsdicke von ${fall.bd} cm. Den Schotterbedarf je km liest du in der Schottertabelle ab (eingleisig).`,
        `Der Schotter ist verdichtet mit ${formatDE(rv, 2)} t/m³ zu berechnen und kommt in Selbstentladewagen zu je ${kap} t.`,
      ],
      gegeben: [
        { label: 'Bereich', wert: `${km(r.startM)} – ${km(r.endeM)}` },
        { label: 'Oberbau', wert: oberbau },
        { label: 'vor Kopf', wert: `${fall.vk} cm` },
        { label: 'Bettungsdicke', wert: `${fall.bd} cm` },
        { label: 'ρ verdichtet', wert: `${formatDE(rv, 2)} t/m³` },
        { label: 'Wagen', wert: `${kap} t` },
      ],
      teilaufgaben: [
        this.laengeTeil('a', r.startM, r.endeM, r.laengeM),
        this.schwellenTeil('b', r.laengeM, abstand, oberbau, 1),
        this.tabellenTeil('c', 'Schotterbedarf je km laut Tabelle', w, ob, fall.vk, fall.bd, 1),
        this.volumenTeil('d', w, r.laengeM, volumen),
        this.masseTeil('e', volumen, masse, rv),
        this.wagenTeil('f', 'masse', masse, kap, wagen, 'Schotterbedarf'),
      ],
      skizze: { vorKopfCm: fall.vk, bettungsdickeCm: fall.bd, schwellenhoeheM: ob.schwelle.hoeheM, schwellenlaengeM: ob.schwelle.laengeM },
      tabelle: { gleise: 1, abstandCm: ob.seitenAbstand },
    };
  }

  // ---------------- mittel / schwer ----------------

  /** Mittel: Bettungsreinigung eingleisig, Werte nach Ril aus v, Wiederverwendung. */
  private mittel(erzwingen: boolean): Pruefungsaufgabe | null {
    return this.erneuerung(erzwingen, false);
  }

  /** Schwer: zweigleisig, Gleisabstand über 4,00 m, beide oder ein Gleis. */
  private schwer(erzwingen: boolean): Pruefungsaufgabe | null {
    return this.erneuerung(erzwingen, true);
  }

  private erneuerung(erzwingen: boolean, zweigleisig: boolean): Pruefungsaufgabe | null {
    const r = this.rahmen();
    const v = randChoice(GESCHWINDIGKEITEN);
    const ob = oberbauWahl(v);
    const abstand = ob.abstand;
    const verschmutzung = randChoice(VERSCHMUTZUNG_PROZENT);
    const reuse = 100 - verschmutzung;
    const kap = randChoice(WAGEN_T);
    const { rv, ru } = dichten();
    const alsQuote = Math.random() < 0.5;
    const oberbau = ob.bezeichnung;
    const vk = vorKopfCm(v);
    const bd = bettungsdickeCm(v);
    const gleisabstand = zweigleisig ? randChoice(GLEISABSTAENDE_M) : GLEISABSTAND_REGEL_M;
    const zuschlag = zweigleisig ? gleisabstandZuschlagProzent(gleisabstand) : 0;
    const beide = zweigleisig && Math.random() < 0.65;
    const gleiseTab: Gleise = zweigleisig ? 2 : 1;
    const anteil = zweigleisig && !beide ? 0.5 : 1;

    const w = tabellenwertM3ProKm(ob.schwelle.id, abstand, vk, bd, gleiseTab);
    const grund = ((w * r.laengeM) / 1000) * anteil;
    const volumen = grund * (1 + zuschlag / 100);
    const masse = volumen * rv;
    const wieder = masse * (reuse / 100);
    const neu = masse - wieder;
    if (!erzwingen && !this.wagenOk(neu, kap)) return null;
    const lose = neu / ru;
    const wagen = Math.ceil(neu / kap - 1e-9);

    const nr = 'abcdefghijklmnop'.split('');
    let i = 0;
    const teile: TeilAufgabe[] = [
      this.laengeTeil(nr[i++], r.startM, r.endeM, r.laengeM),
      this.schwellenTeil(nr[i++], r.laengeM, abstand, oberbau, beide ? 2 : 1),
      this.vorKopfTeil(nr[i++], v),
      this.bettungTeil(nr[i++], v),
      this.tabellenTeil(nr[i++], zweigleisig ? 'Schotterbedarf je km laut Tabelle (zweigleisig)' : 'Schotterbedarf je km laut Tabelle', w, ob, vk, bd, gleiseTab),
    ];
    if (zweigleisig) {
      teile.push({
        key: 'zuschlag', nr: nr[i++], frage: 'Zuschlag für den Gleisabstand', einheit: '%',
        korrekt: zuschlag, toleranzAbs: 0, nachkommastellen: 0,
        rechenweg: `Gleisabstand ${formatDE(gleisabstand, 2)} m − ${formatDE(GLEISABSTAND_REGEL_M, 2)} m = ${formatDE((gleisabstand - GLEISABSTAND_REGEL_M) * 100, 0)} cm mehr. Je 10 cm 1 % → ${zuschlag} % Zuschlag.`,
      });
      teile.push({
        key: 'volumen', nr: nr[i++],
        frage: beide ? 'Schottervolumen beide Gleise mit Zuschlag (verdichtet)' : 'Schottervolumen für das eine Gleis mit Zuschlag (verdichtet)',
        einheit: 'm³', korrekt: volumen, toleranzAbs: volumen * REL_TOL, nachkommastellen: 1,
        folgeVon: 'tabelle', folge: (tab: number) => ((tab * r.laengeM) / 1000) * anteil * (1 + zuschlag / 100),
        rechenweg: `${formatDE(w, 0)} m³/km × ${formatDE(r.laengeM / 1000, 3)} km` + (beide ? '' : ' ÷ 2 (ein Gleis der zweigleisigen Tabelle)') +
          ` = ${formatDE(grund, 1)} m³. Mit Zuschlag: ${formatDE(grund, 1)} m³ × ${formatDE(1 + zuschlag / 100, 2)} = ${formatDE(volumen, 1)} m³`,
      });
    } else {
      teile.push(this.volumenTeil(nr[i++], w, r.laengeM, volumen));
    }
    teile.push(
      this.masseTeil(nr[i++], volumen, masse, rv),
      this.wiederTeil(nr[i++], masse, wieder, verschmutzung),
      this.neuTeil(nr[i++], masse, wieder, neu, verschmutzung),
      this.loseTeil(nr[i++], neu, lose, ru),
      this.wagenTeil(nr[i++], 'neu', neu, kap, wagen, 'Neuschotter'),
    );

    const absaetze: string[] = [];
    if (zweigleisig) {
      absaetze.push(
        `Zwischen ${r.von} und ${r.nach} wird die zweigleisige Strecke ${r.strecke} (zulässige Geschwindigkeit ${v} km/h) zwischen ${km(r.startM)} und ${km(r.endeM)} erneuert. ` +
          (beide ? 'Beide Gleise werden erneuert.' : 'Nur das Richtungsgleis wird komplett erneuert, das Gegengleis bleibt liegen.') +
          ` Oberbau im Gleis: ${oberbau}.`,
        `Der Gleisabstand liegt bei ${formatDE(gleisabstand, 2)} m. Die zweigleisige Schottertabelle gilt für ${formatDE(GLEISABSTAND_REGEL_M, 2)} m, je 10 cm darüber kommt 1 % Schotter dazu.` +
          (beide ? '' : ' Für ein Gleis rechnest du die Hälfte des zweigleisigen Tabellenwerts.'),
      );
    } else {
      absaetze.push(`Zwischen ${r.von} und ${r.nach} wird auf der eingleisigen Strecke ${r.strecke} (zulässige Geschwindigkeit ${v} km/h) zwischen ${km(r.startM)} und ${km(r.endeM)} die Bettung erneuert. Oberbau im Gleis: ${oberbau}.`);
    }
    absaetze.push(
      'Schotter vor Kopf und Bettungsdicke bestimmst du nach Ril 820.2010 aus der Geschwindigkeit, den Schotterbedarf je km liest du in der Schottertabelle ab.',
      `${reinigungsSatz(verschmutzung, alsQuote)} Was fehlt, wird mit Neuschotter ergänzt, angeliefert in Selbstentladewagen zu je ${kap} t.`,
      `Der Schotter ist verdichtet mit ${formatDE(rv, 2)} t/m³ und unverdichtet (lose) mit ${formatDE(ru, 2)} t/m³ zu berechnen.`,
    );

    const gegeben = [
      { label: 'Bereich', wert: `${km(r.startM)} – ${km(r.endeM)}` },
      { label: 'v zul', wert: `${v} km/h` },
      { label: 'Oberbau', wert: oberbau },
    ];
    if (zweigleisig) {
      gegeben.push({ label: 'Gleise', wert: beide ? 'zweigleisig, beide erneuert' : 'zweigleisig, ein Gleis erneuert' });
      gegeben.push({ label: 'Gleisabstand', wert: `${formatDE(gleisabstand, 2)} m` });
    }
    gegeben.push(
      alsQuote
        ? { label: 'Wiederverwendung', wert: `${reuse} %` }
        : { label: 'Verschmutzungsgrad', wert: `${verschmutzung} %` },
      { label: 'ρ verd. / unverd.', wert: `${formatDE(rv, 2)} / ${formatDE(ru, 2)} t/m³` },
      { label: 'Wagen', wert: `${kap} t` },
    );

    return {
      id: nextId('pa'), niveau: zweigleisig ? 'schwer' : 'mittel',
      titel: `${zweigleisig ? 'Streckenerneuerung zweigleisig' : 'Bettungserneuerung'} ${r.von} – ${r.nach}`,
      absaetze, gegeben, teilaufgaben: teile,
      skizze: { vorKopfCm: vk, bettungsdickeCm: bd, schwellenhoeheM: ob.schwelle.hoeheM, schwellenlaengeM: ob.schwelle.laengeM },
      tabelle: { gleise: gleiseTab, abstandCm: ob.seitenAbstand },
    };
  }

  // ---------------- Bausteine ----------------

  private laengeTeil(nr: string, startM: number, endeM: number, laengeM: number): TeilAufgabe {
    return {
      key: 'laenge', nr, frage: 'Baulänge', einheit: 'm',
      korrekt: laengeM, toleranzAbs: 0.5, nachkommastellen: 0,
      rechenweg: `L = ${km(endeM)} − ${km(startM)} = ${formatDE((endeM - startM) / 1000, 3)} km = ${formatDE(laengeM, 0)} m`,
    };
  }

  private schwellenTeil(nr: string, laengeM: number, abstandCm: number, oberbau: string, gleise: Gleise): TeilAufgabe {
    const n = laengeM / (abstandCm / 100);
    const jeGleis = Math.ceil(n - 1e-9);
    const gesamt = jeGleis * gleise;
    return {
      key: 'schwellen', nr, frage: gleise === 2 ? 'Anzahl Schwellen (beide Gleise)' : 'Anzahl Schwellen', einheit: 'Stück',
      // ganze Schwellen: abgerundet bis aufgerundet + 1 (Anfangsschwelle) gelten als richtig
      korrekt: gesamt, toleranzAbs: gleise, nachkommastellen: 0,
      rechenweg: `Schwellenabstand ${abstandCm} cm. n = ${formatDE(laengeM, 0)} m ÷ ${formatDE(abstandCm / 100, 2)} m = ${formatDE(n, 2)} → ${jeGleis} Schwellen je Gleis (aufrunden)` +
        (gleise === 2 ? `, × 2 Gleise = ${gesamt} Schwellen` : ''),
    };
  }

  private vorKopfTeil(nr: string, v: number): TeilAufgabe {
    return {
      key: 'vorkopf', nr, frage: 'Schotter vor Kopf nach Ril 820.2010', einheit: 'cm',
      korrekt: vorKopfCm(v), toleranzAbs: 0, nachkommastellen: 0,
      rechenweg: v > 160
        ? `v = ${v} km/h liegt über 160 km/h → 50 cm Schotter vor Kopf.`
        : `v = ${v} km/h, bis einschließlich 160 km/h → 40 cm Schotter vor Kopf (ab 161 km/h wären es 50 cm).`,
    };
  }

  private bettungTeil(nr: string, v: number): TeilAufgabe {
    return {
      key: 'bettung', nr, frage: 'Bettungsdicke unter der Schwelle nach Ril 820.2010', einheit: 'cm',
      korrekt: bettungsdickeCm(v), toleranzAbs: 0, nachkommastellen: 0,
      rechenweg: v > 230
        ? `v = ${v} km/h liegt über 230 km/h → 35 cm Bettungsdicke.`
        : `v = ${v} km/h, bis einschließlich 230 km/h → 30 cm Bettungsdicke (erst darüber 35 cm).`,
    };
  }

  private tabellenTeil(nr: string, frage: string, wert: number, ob: OberbauWahl, vk: number, bd: number, gleise: Gleise): TeilAufgabe {
    const seite = `${gleise === 2 ? 'zweigleisig' : 'eingleisig'} · ${ob.schwelle.abstandFestCm ? 'beliebige Seite' : ob.seitenAbstand + ' cm'}`;
    return {
      key: 'tabelle', nr, frage, einheit: 'm³/km',
      korrekt: wert, toleranzAbs: 1, nachkommastellen: 0,
      rechenweg: `Tabelle Seite „${seite}“, Zeile ${ob.schwelle.name} mit Bettung ${bd} cm, Spalte ${vk} cm vor Kopf → ${formatDE(wert, 0)} m³/km.` +
        (ob.schwelle.abstandFestCm ? ` (Y-Schwelle liegt systembedingt mit ${ob.schwelle.abstandFestCm} cm Abstand.)` : ''),
    };
  }


  private volumenTeil(nr: string, w: number, laengeM: number, volumen: number): TeilAufgabe {
    return {
      key: 'volumen', nr, frage: 'Schottervolumen im Gleis (verdichtet)', einheit: 'm³',
      korrekt: volumen, toleranzAbs: volumen * REL_TOL, nachkommastellen: 1,
      folgeVon: 'tabelle', folge: (tab: number) => (tab * laengeM) / 1000,
      rechenweg: `V = ${formatDE(w, 0)} m³/km × ${formatDE(laengeM / 1000, 3)} km = ${formatDE(volumen, 1)} m³`,
    };
  }

  private masseTeil(nr: string, volumen: number, masse: number, rv: number): TeilAufgabe {
    return {
      key: 'masse', nr, frage: 'Schotterbedarf gesamt', einheit: 't',
      korrekt: masse, toleranzAbs: masse * REL_TOL, nachkommastellen: 1,
      rechenweg: `m = ${formatDE(volumen, 1)} m³ × ${formatDE(rv, 2)} t/m³ = ${formatDE(masse, 1)} t`,
    };
  }

  private wiederTeil(nr: string, masse: number, wieder: number, verschmutzung: number): TeilAufgabe {
    const reuse = 100 - verschmutzung;
    return {
      key: 'wieder', nr, frage: 'Wiederverwendbarer Schotter nach Reinigung', einheit: 't',
      korrekt: wieder, toleranzAbs: wieder * REL_TOL, nachkommastellen: 1,
      rechenweg: `Verschmutzung ${verschmutzung} % → ${reuse} % wiederverwendbar: ${formatDE(masse, 1)} t × ${formatDE(reuse / 100, 2)} = ${formatDE(wieder, 1)} t`,
    };
  }

  private neuTeil(nr: string, masse: number, wieder: number, neu: number, verschmutzung: number): TeilAufgabe {
    return {
      key: 'neu', nr, frage: 'Neuschotterbedarf', einheit: 't',
      korrekt: neu, toleranzAbs: neu * REL_TOL, nachkommastellen: 1,
      rechenweg: `Neuschotter = ${formatDE(masse, 1)} t − ${formatDE(wieder, 1)} t = ${formatDE(neu, 1)} t (= ${verschmutzung} % des Bedarfs)`,
    };
  }

  private loseTeil(nr: string, neu: number, lose: number, ru: number): TeilAufgabe {
    return {
      key: 'lose', nr, frage: 'Neuschotter als Bestellmenge lose (unverdichtet)', einheit: 'm³',
      korrekt: lose, toleranzAbs: lose * REL_TOL, nachkommastellen: 1,
      rechenweg: `V(lose) = ${formatDE(neu, 1)} t ÷ ${formatDE(ru, 2)} t/m³ = ${formatDE(lose, 1)} m³`,
    };
  }

  private wagenTeil(nr: string, folgeVon: string, menge: number, kap: number, wagen: number, was: string): TeilAufgabe {
    return {
      key: 'wagen', nr, frage: `Anzahl Schotterwagen für den ${was}`, einheit: 'Wagen',
      korrekt: wagen, toleranzAbs: 0, nachkommastellen: 0,
      folgeVon, folge: (vorwert: number) => Math.ceil(vorwert / kap - 1e-9),
      rechenweg: `${formatDE(menge, 1)} t ÷ ${kap} t = ${formatDE(menge / kap, 2)} → aufrunden auf ${wagen} Wagen (ein angebrochener Wagen ist ein ganzer Wagen)`,
    };
  }
}
