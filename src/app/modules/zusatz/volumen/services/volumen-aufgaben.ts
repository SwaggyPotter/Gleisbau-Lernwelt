/**
 * Aufgaben-Generator für die Volumenberechnung (Tim, 2026-11-06).
 * Schwerpunkt Trapez-Prisma mit Gleisschotter (Schotterbett, Schottermiete) – Gewicht in t oder kg.
 * Daneben „Alle Körper“ mit Gleisbau-Beispielen. Drei Stufen:
 *   leicht: alle Maße in m, Dichte in t/m³
 *   mittel: gemischte Einheiten (cm, mm, km), Dichte auch in kg/m³, Gewicht in t oder kg
 *   schwer: Maße erst herleiten (Böschung 1 : n, Kilometrierung, Schwellenlänge + Einschotterung) und Stückzahl/Fahrzeuge
 */
import { KoerperId, koerper } from '../data/koerper';
import { stoff } from '../data/stoffe';

export type AufgabenArt = 'trapez' | 'alle';
export type Stufe = 'leicht' | 'mittel' | 'schwer';
type Einheit = 'm' | 'cm' | 'mm' | 'km';

export interface Feld { key: string; label: string; einheit: string; exakt?: boolean; }
export interface Aufgabe {
  nr: string;
  art: AufgabenArt;
  stufe: Stufe;
  koerper: KoerperId;
  /** Maße in m (für Modell und Rechnung) */
  masse: Record<string, number>;
  /** Beschriftung im Modell, z. B. { a: 'a = 3,40 m', c: 'c = ?' } */
  beschriftung: Record<string, string>;
  stoffName: string;
  stoffKey: string;
  titel: string;
  /** Aufgabentext (HTML) */
  text: string;
  /** Kurzform „Nur Werte“ */
  werte: { name: string; wert: string }[];
  felder: Feld[];
  loesung: Record<string, number>;
  /** Lösungsweg, ein Schritt je Eintrag (HTML) */
  weg: string[];
}

export const f = (n: number, d = 2) => n.toLocaleString('de-DE', { maximumFractionDigits: d });
const rnd = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
/** Zufallszahl von a bis b im Raster `schritt` */
const zw = (a: number, b: number, schritt: number) => {
  const n = Math.round((b - a) / schritt);
  return +(a + Math.floor(Math.random() * (n + 1)) * schritt).toFixed(6);
};

const FAKTOR: Record<Einheit, number> = { m: 1, cm: 0.01, mm: 0.001, km: 1000 };
/** Länge in m als Text in der gewünschten Einheit */
function laenge(m: number, e: Einheit): string {
  const v = m / FAKTOR[e];
  return `${f(v, e === 'km' ? 3 : e === 'm' ? 3 : 1)} ${e}`;
}
/** Kilometrierung „12,4 + 34,2“ aus einer Position in m (wie Schotterberechnung) */
function kmText(m: number): string {
  const dm = Math.round(m * 10), hekto = Math.floor(dm / 1000), rest = (dm - hekto * 1000) / 10;
  return `${(hekto / 10).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} + ${rest.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}
function dichteText(t: number, inKg: boolean): string {
  return inKg ? `${f(t * 1000, 0)} kg/m³` : `${f(t)} t/m³`;
}
const nr = () => String(Math.floor(Math.random() * 900 + 100));

/** Umrechnungsschritt für alle Maße, die nicht in m angegeben sind */
function umrechnen(masse: { zeichen: string; m: number; e: Einheit }[]): string | null {
  const teile = masse.filter(x => x.e !== 'm').map(x => `${x.zeichen} = ${laenge(x.m, x.e)} = ${f(x.m, 4)} m`);
  return teile.length ? `Alles in Meter umrechnen: ${teile.join('; ')}` : null;
}

/* ============================ TRAPEZ MIT SCHOTTER ============================ */
function trapezAufgabe(stufe: Stufe): Aufgabe {
  const bett = Math.random() < 0.65;
  const weg: string[] = [];
  let a: number, h: number, n: number, l: number;
  let sl = 0, vk = 0, kmVon = 0;
  const st = stoff(bett ? rnd(['schotter-verd', 'schotter-lose']) : 'schotter-lose');
  if (bett) {
    sl = rnd([2.4, 2.6]); vk = rnd([0.4, 0.5]); a = +(sl + 2 * vk).toFixed(2);
    h = rnd([0.45, 0.5, 0.55, 0.6, 0.65]); n = 1.5;
    if (stufe === 'leicht') l = zw(100, 900, 50);
    else if (stufe === 'mittel') l = zw(400, 3500, 50);
    else { kmVon = zw(500, 7500, 0.1); l = zw(600, 3200, 0.1); }
  } else {
    a = zw(1, 2, 0.1); h = zw(1.5, 3, 0.1); n = rnd([1, 1.25, 1.5]); l = zw(10, 40, 1);
  }
  const c = +(a + 2 * n * h).toFixed(4);
  const A = (a + c) / 2 * h, V = A * l, mt = V * st.dichte;

  const dichteKg = stufe !== 'leicht' && Math.random() < 0.5;
  const gewKg = stufe === 'mittel' ? Math.random() < 0.5 : false;
  const hE: Einheit = stufe === 'leicht' ? 'm' : 'cm';
  const lE: Einheit = bett && stufe === 'mittel' ? 'km' : 'm';
  const nutz = bett ? rnd([40, 50, 55, 60]) : rnd([12, 18, 24, 26]);
  const fahrzeug = bett ? 'Schotterwagen' : 'LKW';

  const felder: Feld[] = [];
  const loesung: Record<string, number> = {};
  const beschr: Record<string, string> = {
    a: `a = ${laenge(a, 'm')}`, c: `c = ${laenge(c, 'm')}`, h: `h = ${laenge(h, hE)}`, l: `l = ${laenge(l, lE)}`,
  };
  let text: string;
  const werte: { name: string; wert: string }[] = [];
  const ort = bett ? 'Schotterbett' : 'Schottermiete';

  if (stufe === 'schwer') {
    beschr['c'] = 'c = ?';
    if (bett) {
      beschr['a'] = 'a = ?'; beschr['l'] = 'l = ?';
      const kmBis = kmVon + l;
      text = `<p>Für ein neues Gleis wird das <b>Schotterbett</b> zwischen <b>km ${kmText(kmVon)}</b> und <b>km ${kmText(kmBis)}</b> geschüttet.
        Die Schwellen sind <b>${laenge(sl, 'm')}</b> lang, die Einschotterung vor Kopf beträgt je Seite <b>${laenge(vk, 'm')}</b>.
        Das Schotterbett ist <b>${laenge(h, 'cm')}</b> hoch, die Böschung hat eine Neigung von <b>1 : ${f(n)}</b>.</p>
        <p>Schüttdichte: <b>${dichteText(st.dichte, dichteKg)}</b> (${st.name}). Ein Schotterwagen lädt <b>${nutz} t</b>.
        Vereinfacht: Die Schwellen werden nicht abgezogen.</p>`;
      werte.push({ name: 'Bauabschnitt', wert: `km ${kmText(kmVon)} – ${kmText(kmBis)}` }, { name: 'Schwelle', wert: laenge(sl, 'm') },
        { name: 'Einschotterung', wert: laenge(vk, 'm') }, { name: 'Höhe h', wert: laenge(h, 'cm') }, { name: 'Böschung', wert: `1 : ${f(n)}` });
      felder.push({ key: 'a', label: 'obere Breite a', einheit: 'm' });
      loesung['a'] = a;
      weg.push(`Länge: km ${kmText(kmBis)} − km ${kmText(kmVon)} = <b>${f(l, 1)} m</b>`);
      weg.push(`Obere Breite: a = Schwellenlänge + 2 × Einschotterung = ${f(sl)} + 2 × ${f(vk)} = <b>${f(a)} m</b>`);
    } else {
      beschr['a'] = `a = ${laenge(a, 'm')}`;
      text = `<p>Im Bahnhof wird eine <b>Schottermiete</b> aufgeschüttet: Querschnitt Trapez, oben <b>${laenge(a, 'm')}</b> breit,
        <b>${laenge(h, 'cm')}</b> hoch, Böschungsneigung beidseitig <b>1 : ${f(n)}</b>, Länge <b>${laenge(l, 'm')}</b>.</p>
        <p>Schüttdichte: <b>${dichteText(st.dichte, dichteKg)}</b> (${st.name}). Abgefahren wird mit LKW, Nutzlast <b>${nutz} t</b>.</p>`;
      werte.push({ name: 'obere Breite a', wert: laenge(a, 'm') }, { name: 'Höhe h', wert: laenge(h, 'cm') },
        { name: 'Böschung', wert: `1 : ${f(n)}` }, { name: 'Länge l', wert: laenge(l, 'm') });
    }
    weg.push(`Höhe in Meter: ${laenge(h, 'cm')} = ${f(h)} m`);
    weg.push(`Untere Breite: c = a + 2 × n × h = ${f(a)} + 2 × ${f(n)} × ${f(h)} = <b>${f(c, 3)} m</b> (je Seite ${f(n * h, 3)} m Böschung)`);
    felder.push({ key: 'c', label: 'untere Breite c', einheit: 'm' }); loesung['c'] = c;
  } else {
    const aT = laenge(a, 'm'), cT = laenge(c, 'm'), hT = laenge(h, hE), lT = laenge(l, lE);
    text = bett
      ? `<p>Ein neues Gleis bekommt ein <b>Schotterbett</b> mit trapezförmigem Querschnitt: oben <b>a = ${aT}</b>, unten <b>c = ${cT}</b>,
         Höhe <b>h = ${hT}</b>. Das Gleis ist <b>l = ${lT}</b> lang.</p>
         <p>Schüttdichte: <b>${dichteText(st.dichte, dichteKg)}</b> (${st.name}). Vereinfacht: Die Schwellen werden nicht abgezogen.</p>`
      : `<p>Eine <b>Schottermiete</b> hat einen trapezförmigen Querschnitt: oben <b>a = ${aT}</b>, unten <b>c = ${cT}</b>,
         Höhe <b>h = ${hT}</b>, Länge <b>l = ${lT}</b>.</p><p>Schüttdichte: <b>${dichteText(st.dichte, dichteKg)}</b> (${st.name}).</p>`;
    werte.push({ name: 'a', wert: aT }, { name: 'c', wert: cT }, { name: 'h', wert: hT }, { name: 'l', wert: lT });
    const u = umrechnen([{ zeichen: 'h', m: h, e: hE }, { zeichen: 'l', m: l, e: lE }]);
    if (u) weg.push(u);
  }
  werte.push({ name: 'Dichte', wert: dichteText(st.dichte, dichteKg) });
  if (dichteKg) weg.push(`Dichte umrechnen: ${f(st.dichte * 1000, 0)} kg/m³ = ${f(st.dichte)} t/m³`);

  weg.push(`Querschnittsfläche: A = (a + c) ÷ 2 × h = (${f(a)} + ${f(c, 3)}) ÷ 2 × ${f(h)} = <b>${f(A, 4)} m²</b>`);
  weg.push(`Volumen: V = A × l = ${f(A, 4)} m² × ${f(l, 1)} m = <b>${f(V, 3)} m³</b>`);
  felder.push({ key: 'A', label: 'Querschnittsfläche A', einheit: 'm²' }, { key: 'V', label: 'Volumen V', einheit: 'm³' });
  loesung['A'] = A; loesung['V'] = V;
  if (gewKg) {
    weg.push(`Gewicht: m = V × Dichte = ${f(V, 3)} m³ × ${f(st.dichte * 1000, 0)} kg/m³ = <b>${f(mt * 1000, 0)} kg</b>`);
    felder.push({ key: 'm', label: 'Gewicht', einheit: 'kg' }); loesung['m'] = mt * 1000;
  } else {
    weg.push(`Gewicht: m = V × Dichte = ${f(V, 3)} m³ × ${f(st.dichte)} t/m³ = <b>${f(mt, 2)} t</b>`);
    felder.push({ key: 'm', label: 'Gewicht', einheit: 't' }); loesung['m'] = mt;
  }
  if (stufe === 'schwer') {
    const anz = Math.ceil(mt / nutz - 1e-9);
    weg.push(`${fahrzeug}: ${f(mt, 2)} t ÷ ${nutz} t = ${f(mt / nutz, 2)} → <b>${anz} ${bett ? 'Wagen' : 'Fahrten'}</b> (immer aufrunden)`);
    felder.push({ key: 'anzahl', label: bett ? 'Schotterwagen' : 'LKW-Fahrten', einheit: bett ? 'Wagen' : 'Fahrten', exakt: true });
    loesung['anzahl'] = anz;
    werte.push({ name: fahrzeug, wert: `${nutz} t` });
  }
  const gesucht = felder.map(x => `${x.label} (${x.einheit})`).join(', ');
  text += `<p class="gesucht"><b>Gesucht:</b> ${gesucht}.</p>`;

  return {
    nr: nr(), art: 'trapez', stufe, koerper: 'trapez', masse: { a, c, h, l }, beschriftung: beschr, stoffName: st.name, stoffKey: st.key,
    titel: ort, text, werte, felder, loesung, weg,
  };
}

/* ============================ ALLE KÖRPER ============================ */
interface Vorlage {
  koerper: KoerperId;
  titel: string;
  stoffe: string[];
  /** Maße in m, Anzeige-Einheit je Stufe */
  masse: (s: Stufe) => { key: string; m: number; e: Einheit }[];
  /** Satz mit den Maßen (gegeben als Texte je key) */
  satz: (t: Record<string, string>) => string;
  /** Gewicht lieber in kg (kleine Teile) */
  kg?: boolean;
  /** Volumen in dm³ statt m³ */
  dm3?: boolean;
  /** schwer: mehrere Stück */
  stueck?: [number, number, string];
  /** schwer: Abfahren mit Fahrzeugen */
  fahrzeug?: [string, number[]];
}

const VORLAGEN: Vorlage[] = [
  {
    koerper: 'quader', titel: 'Mastfundament', stoffe: ['beton'], stueck: [4, 12, 'Mastfundamente'],
    masse: s => [
      { key: 'l', m: zw(1.2, 2.5, 0.1), e: 'm' }, { key: 'b', m: zw(0.8, 1.6, 0.1), e: s === 'leicht' ? 'm' : 'cm' },
      { key: 'h', m: zw(0.6, 1.4, 0.1), e: s === 'leicht' ? 'm' : 'cm' }],
    satz: t => `Für einen Oberleitungsmast wird ein <b>Betonfundament</b> (Quader) gegossen: Länge <b>l = ${t['l']}</b>, Breite <b>b = ${t['b']}</b>, Höhe <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'quader', titel: 'Sauberkeitsschicht', stoffe: ['beton'], fahrzeug: ['Fahrmischer', [7, 8, 9, 10]],
    masse: s => [
      { key: 'l', m: zw(10, 30, 0.5), e: 'm' }, { key: 'b', m: zw(6, 14, 0.25), e: 'm' },
      { key: 'h', m: zw(0.05, 0.1, 0.01), e: s === 'leicht' ? 'm' : 'cm' }],
    satz: t => `Unter einem Technikgebäude wird eine <b>Sauberkeitsschicht</b> aus Beton eingebaut: <b>l = ${t['l']}</b>, <b>b = ${t['b']}</b>, Dicke <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'wuerfel', titel: 'Beton-Prüfwürfel', stoffe: ['beton'], kg: true, dm3: true, stueck: [3, 12, 'Prüfwürfel'],
    masse: s => [{ key: 'a', m: rnd([0.1, 0.15, 0.2]), e: s === 'leicht' ? 'm' : 'mm' }],
    satz: t => `Für die Druckfestigkeitsprüfung wird ein <b>Beton-Prüfwürfel</b> mit der Kantenlänge <b>a = ${t['a']}</b> hergestellt.`,
  },
  {
    koerper: 'zylinder', titel: 'Bohrpfahl', stoffe: ['stahlbeton'], stueck: [2, 8, 'Bohrpfähle'],
    masse: s => [{ key: 'd', m: zw(0.6, 1.2, 0.1), e: s === 'leicht' ? 'm' : 'cm' }, { key: 'h', m: zw(2.5, 6, 0.5), e: 'm' }],
    satz: t => `Für ein Brückenwiderlager wird ein <b>Bohrpfahl</b> (Zylinder) betoniert: Durchmesser <b>d = ${t['d']}</b>, Länge <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'rohr', titel: 'Schachtring', stoffe: ['stahlbeton'], kg: true, stueck: [2, 6, 'Schachtringe'],
    masse: s => {
      const [D, d] = rnd([[1.2, 1.0], [1.44, 1.2], [1.0, 0.8]]);
      const e: Einheit = s === 'leicht' ? 'm' : rnd(['cm', 'mm'] as Einheit[]);
      return [{ key: 'D', m: D, e }, { key: 'd', m: d, e }, { key: 'h', m: rnd([0.25, 0.5, 0.75, 1.0]), e: s === 'leicht' ? 'm' : 'cm' }];
    },
    satz: t => `Für einen Entwässerungsschacht werden <b>Schachtringe</b> (Hohlzylinder) gesetzt: außen <b>D = ${t['D']}</b>, innen <b>d = ${t['d']}</b>, Höhe <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'kegel', titel: 'Schüttkegel', stoffe: ['sand', 'kies', 'schotter-lose'], fahrzeug: ['LKW', [12, 18, 24, 26]],
    masse: s => [{ key: 'd', m: zw(3, 8, 0.5), e: 'm' }, { key: 'h', m: zw(1, 3, 0.1), e: s === 'leicht' ? 'm' : 'cm' }],
    satz: t => `Auf der Baustelle liegt ein <b>Schüttkegel</b>: Durchmesser unten <b>d = ${t['d']}</b>, Höhe <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'pyramide', titel: 'Schotterhaufen', stoffe: ['schotter-lose'], fahrzeug: ['LKW', [12, 18, 24, 26]],
    masse: s => [{ key: 'l', m: zw(4, 8, 0.5), e: 'm' }, { key: 'b', m: zw(3, 6, 0.5), e: 'm' }, { key: 'h', m: zw(1.5, 3, 0.1), e: s === 'leicht' ? 'm' : 'cm' }],
    satz: t => `Ein <b>Schotterhaufen</b> hat ungefähr die Form einer Pyramide mit rechteckiger Grundfläche: <b>l = ${t['l']}</b>, <b>b = ${t['b']}</b>, Höhe <b>h = ${t['h']}</b>.`,
  },
  {
    koerper: 'dreieck', titel: 'Schottermiete', stoffe: ['schotter-lose'], fahrzeug: ['Schotterwagen', [40, 50, 55, 60]],
    masse: s => [{ key: 'g', m: zw(3, 6, 0.5), e: 'm' }, { key: 'h', m: zw(1.5, 2.5, 0.1), e: s === 'leicht' ? 'm' : 'cm' }, { key: 'l', m: zw(10, 40, 1), e: 'm' }],
    satz: t => `Eine <b>Schottermiete</b> hat einen dreieckigen Querschnitt: Grundseite <b>g = ${t['g']}</b>, Höhe <b>h = ${t['h']}</b>, Länge <b>l = ${t['l']}</b>.`,
  },
  {
    koerper: 'trapez', titel: 'Entwässerungsgraben', stoffe: ['boden'], fahrzeug: ['LKW', [12, 18, 24, 26]],
    masse: s => [
      { key: 'a', m: zw(1.2, 2, 0.1), e: 'm' }, { key: 'c', m: zw(0.4, 0.6, 0.1), e: s === 'leicht' ? 'm' : 'cm' },
      { key: 'h', m: zw(0.6, 1.2, 0.1), e: s === 'leicht' ? 'm' : 'cm' }, { key: 'l', m: zw(50, 300, 10), e: s === 'leicht' ? 'm' : 'km' }],
    satz: t => `Neben dem Gleis wird ein <b>Entwässerungsgraben</b> ausgehoben (Querschnitt Trapez): oben <b>a = ${t['a']}</b>, Sohle <b>c = ${t['c']}</b>, Tiefe <b>h = ${t['h']}</b>, Länge <b>l = ${t['l']}</b>.`,
  },
];

function koerperAufgabe(stufe: Stufe): Aufgabe {
  const vl = rnd(VORLAGEN);
  const def = koerper(vl.koerper);
  const st = stoff(rnd(vl.stoffe));
  const liste = vl.masse(stufe);
  const masse: Record<string, number> = {}, gegeben: Record<string, string> = {}, beschr: Record<string, string> = {};
  liste.forEach(x => {
    masse[x.key] = x.m; gegeben[x.key] = laenge(x.m, x.e);
    beschr[x.key] = `${def.masse.find(d => d.key === x.key)!.zeichen} = ${gegeben[x.key]}`;
  });
  const dichteKg = stufe !== 'leicht' && Math.random() < 0.5;
  const gewKg = vl.kg ? true : stufe === 'leicht' ? false : Math.random() < 0.4;
  const V = def.volumen(masse), mt = V * st.dichte;
  const weg: string[] = [];
  const felder: Feld[] = [];
  const loesung: Record<string, number> = {};

  const u = umrechnen(liste.map(x => ({ zeichen: def.masse.find(d => d.key === x.key)!.zeichen, m: x.m, e: x.e })));
  if (u) weg.push(u);
  if (dichteKg) weg.push(`Dichte umrechnen: ${f(st.dichte * 1000, 0)} kg/m³ = ${f(st.dichte)} t/m³`);
  const vText = vl.dm3 ? `${f(V, 6)} m³ = <b>${f(V * 1000, 3)} dm³</b> (Liter)` : `<b>${f(V, 3)} m³</b>`;
  weg.push(`Formel: ${def.formel.replace('<br>', '; ')}`);
  weg.push(`${def.eingesetzt(masse, f)} = ${vText}`);
  if (def.flaeche) { felder.push({ key: 'A', label: 'Grundfläche / Querschnitt A', einheit: 'm²' }); loesung['A'] = def.flaeche(masse); }
  felder.push({ key: 'V', label: 'Volumen V', einheit: vl.dm3 ? 'dm³' : 'm³' }); loesung['V'] = vl.dm3 ? V * 1000 : V;
  const gew = (t: number) => gewKg ? `${f(t * 1000, 1)} kg` : `${f(t, 3)} t`;
  weg.push(gewKg
    ? `Gewicht: m = V × Dichte = ${f(V, 6)} m³ × ${f(st.dichte * 1000, 0)} kg/m³ = <b>${f(mt * 1000, 1)} kg</b>`
    : `Gewicht: m = V × Dichte = ${f(V, 4)} m³ × ${f(st.dichte)} t/m³ = <b>${f(mt, 3)} t</b>`);
  felder.push({ key: 'm', label: 'Gewicht', einheit: gewKg ? 'kg' : 't' }); loesung['m'] = gewKg ? mt * 1000 : mt;

  let extra = '';
  const werte = liste.map(x => ({ name: def.masse.find(d => d.key === x.key)!.zeichen, wert: gegeben[x.key] }));
  werte.push({ name: 'Dichte', wert: dichteText(st.dichte, dichteKg) });
  if (stufe === 'schwer' && vl.stueck) {
    const n = Math.floor(Math.random() * (vl.stueck[1] - vl.stueck[0] + 1)) + vl.stueck[0];
    extra = ` Es werden <b>${n} ${vl.stueck[2]}</b> gleicher Größe gebraucht.`;
    weg.push(`Gesamtgewicht: ${n} × ${gew(mt)} = <b>${gew(mt * n)}</b>`);
    felder.push({ key: 'mGes', label: `Gewicht aller ${n} ${vl.stueck[2]}`, einheit: gewKg ? 'kg' : 't' }); loesung['mGes'] = (gewKg ? mt * 1000 : mt) * n;
    werte.push({ name: 'Anzahl', wert: `${n} Stück` });
  } else if (stufe === 'schwer' && vl.fahrzeug) {
    const nutz = rnd(vl.fahrzeug[1]);
    const istMischer = vl.fahrzeug[0].startsWith('Fahrmischer');
    // Fahrmischer laden Volumen (m³), alle anderen Gewicht (t)
    const anz = Math.ceil((istMischer ? V : mt) / nutz - 1e-9);
    extra = istMischer ? ` Ein Fahrmischer bringt <b>${nutz} m³</b> Beton.` : ` Abgefahren wird mit ${vl.fahrzeug[0]}, Nutzlast <b>${nutz} t</b>.`;
    weg.push(istMischer
      ? `Fahrmischer: ${f(V, 3)} m³ ÷ ${nutz} m³ = ${f(V / nutz, 2)} → <b>${anz} ${anz === 1 ? 'Ladung' : 'Ladungen'}</b> (aufrunden)`
      : `${vl.fahrzeug[0]}: ${f(mt, 3)} t ÷ ${nutz} t = ${f(mt / nutz, 2)} → <b>${anz} ${anz === 1 ? 'Fahrt' : 'Fahrten'}</b> (aufrunden)`);
    felder.push({ key: 'anzahl', label: istMischer ? 'Fahrmischer-Ladungen' : `${vl.fahrzeug[0]}-Fahrten`, einheit: istMischer ? 'Ladungen' : 'Fahrten', exakt: true });
    loesung['anzahl'] = anz;
    werte.push({ name: istMischer ? 'Fahrmischer' : vl.fahrzeug[0], wert: istMischer ? `${nutz} m³` : `${nutz} t` });
  }
  const text = `<p>${vl.satz(gegeben)}${extra}</p><p>Material: ${st.name}, Dichte <b>${dichteText(st.dichte, dichteKg)}</b>.</p>`
    + `<p class="gesucht"><b>Gesucht:</b> ${felder.map(x => `${x.label} (${x.einheit})`).join(', ')}.</p>`;

  return {
    nr: nr(), art: 'alle', stufe, koerper: vl.koerper, masse, beschriftung: beschr, stoffName: st.name, stoffKey: st.key,
    titel: vl.titel, text, werte, felder, loesung, weg,
  };
}

export function neueAufgabe(art: AufgabenArt, stufe: Stufe): Aufgabe {
  return art === 'trapez' ? trapezAufgabe(stufe) : koerperAufgabe(stufe);
}
