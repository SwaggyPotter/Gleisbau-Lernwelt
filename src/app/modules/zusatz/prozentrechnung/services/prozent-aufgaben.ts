/**
 * Aufgaben-Generator Prozentrechnung (Tim, 2026-11-06) – gleiches Prinzip wie Volumen-/Schotterberechnung.
 *   leicht: eine Größe gesucht (Prozentwert, Grundwert oder Prozentsatz), glatte Zahlen
 *   mittel: Erhöhen/Vermindern (MwSt, Rabatt, Zuschlag, Preiserhöhung), Toleranzen, Einheiten, Neigung in ‰
 *   schwer: Rückrechnung (brutto → netto, vorher/nachher), mehrere Schritte (Rabatt, Skonto, MwSt),
 *           Veränderung in %, Gradiente mit Kilometrierung, Verschnitt mit Stückzahl
 * Mehrwertsteuer: Regelsteuersatz 19 % (§ 12 Abs. 1 UStG). Preise sind Übungswerte.
 */
export type Stufe = 'leicht' | 'mittel' | 'schwer';
export type FormelArt = 'grund' | 'aendern' | 'mwst' | 'kette' | 'neigung' | 'toleranz';

export interface Feld { key: string; label: string; einheit: string; exakt?: boolean; }

/** Bild zur Aufgabe: Prozentstreifen, Kette mehrerer Schritte oder Neigungsdreieck */
export type Bild =
  | { art: 'streifen'; modus: 'anteil' | 'plus' | 'minus'; p: number; G: string; W: string; P: string; E?: string }
  | { art: 'kette'; zeilen: { name: string; wert: number; text: string; schritt?: string }[] }
  | { art: 'neigung'; promille: number; l: string; dh: string; n: string; steigt: boolean };

export interface Aufgabe {
  nr: string;
  stufe: Stufe;
  titel: string;
  text: string;
  werte: { name: string; wert: string }[];
  felder: Feld[];
  loesung: Record<string, number>;
  weg: string[];
  bild: Bild;
  formel: FormelArt;
}

export const FORMELN: Record<FormelArt, { name: string; html: string }> = {
  grund: { name: 'Grundformeln', html: 'W = G × p ÷ 100<br>G = W × 100 ÷ p<br>p = W × 100 ÷ G<br><small>G Grundwert (100 %) · W Prozentwert · p Prozentsatz</small>' },
  aendern: { name: 'Erhöhen / Vermindern', html: 'Erhöhung: neu = G × (100 + p) ÷ 100<br>Minderung: neu = G × (100 − p) ÷ 100<br>Rückrechnung: G = neu × 100 ÷ (100 ± p)' },
  mwst: { name: 'Mehrwertsteuer 19 %', html: 'MwSt = netto × 19 ÷ 100<br>brutto = netto × 1,19 (≙ 119 %)<br>netto = brutto ÷ 1,19' },
  kette: { name: 'Mehrere Schritte', html: 'Jeder Schritt rechnet vom <b>neuen</b> Wert weiter:<br>− Rabatt: × (100 − p) ÷ 100<br>− Skonto: × (100 − p) ÷ 100<br>+ MwSt: × 1,19' },
  neigung: { name: 'Neigung', html: 'Neigung in ‰ = Δh ÷ l × 1000<br>Neigung in % = Δh ÷ l × 100<br>Δh = l × ‰ ÷ 1000<br><small>10 ‰ = 1 % · 1 ‰ = 1 mm je m</small>' },
  toleranz: { name: 'Toleranz', html: 'Abweichung = Sollmaß × p ÷ 100<br>Größtmaß = Sollmaß + Abweichung<br>Kleinstmaß = Sollmaß − Abweichung' },
};

export const f = (n: number, d = 2) => n.toLocaleString('de-DE', { maximumFractionDigits: d });
const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const rnd = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const zw = (a: number, b: number, schritt: number) => {
  const n = Math.round((b - a) / schritt);
  return +(a + Math.floor(Math.random() * (n + 1)) * schritt).toFixed(6);
};
const cent = (n: number) => Math.round(n * 100) / 100;
const nr = () => String(Math.floor(Math.random() * 900 + 100));
function kmText(m: number): string {
  const dm = Math.round(m * 10), hekto = Math.floor(dm / 1000), rest = (dm - hekto * 1000) / 10;
  return `${(hekto / 10).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} + ${rest.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

type Teil = Omit<Aufgabe, 'nr' | 'stufe'>;

/* ================================ LEICHT ================================ */
const LEICHT: (() => Teil)[] = [
  () => { // Prozentwert in Metern
    const G = zw(200, 1200, 50), p = rnd([10, 20, 25, 40, 50, 60, 75]), W = G * p / 100;
    return {
      titel: 'Gestopfte Strecke',
      text: `<p>Ein Bauabschnitt ist <b>${f(G)} m</b> lang. <b>${p} %</b> davon sind schon fertig gestopft.</p>`,
      werte: [{ name: 'Grundwert G', wert: `${f(G)} m` }, { name: 'Prozentsatz p', wert: `${p} %` }],
      felder: [{ key: 'W', label: 'fertig gestopft', einheit: 'm' }], loesung: { W },
      weg: [`Gesucht ist der Prozentwert W, gegeben sind G = ${f(G)} m und p = ${p} %.`,
        `W = G × p ÷ 100 = ${f(G)} m × ${p} ÷ 100 = <b>${f(W)} m</b>`,
        `Mit Dreisatz: 100 % ≙ ${f(G)} m → 1 % ≙ ${f(G / 100)} m → ${p} % ≙ ${f(W)} m`],
      bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${f(G)} m`, W: 'W = ?', P: `${p} %` }, formel: 'grund',
    };
  },
  () => { // Prozentwert Stück
    const G = zw(40, 400, 20), p = rnd([5, 10, 15, 20, 25, 30]), W = G * p / 100;
    return {
      titel: 'Beschädigte Schwellen',
      text: `<p>Bei der Kontrolle eines Gleises werden <b>${G} Schwellen</b> geprüft. <b>${p} %</b> davon sind beschädigt und müssen getauscht werden.</p>`,
      werte: [{ name: 'Schwellen gesamt', wert: `${G} Stück` }, { name: 'beschädigt', wert: `${p} %` }],
      felder: [{ key: 'W', label: 'zu tauschende Schwellen', einheit: 'Stück', exakt: true }], loesung: { W },
      weg: [`W = G × p ÷ 100 = ${G} × ${p} ÷ 100 = <b>${f(W)} Schwellen</b>`],
      bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${G} Stück`, W: 'W = ?', P: `${p} %` }, formel: 'grund',
    };
  },
  () => { // Prozentsatz
    const G = zw(40, 200, 10), p = rnd([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]), W = G * p / 100;
    return {
      titel: 'Verbauter Schotter',
      text: `<p>Für die Baustelle wurden <b>${f(G)} t</b> Gleisschotter geliefert. Bis Mittag sind <b>${f(W)} t</b> davon eingebaut.</p>
        <p>Wie viel Prozent des Schotters sind eingebaut?</p>`,
      werte: [{ name: 'geliefert (G)', wert: `${f(G)} t` }, { name: 'eingebaut (W)', wert: `${f(W)} t` }],
      felder: [{ key: 'p', label: 'eingebaut', einheit: '%' }], loesung: { p },
      weg: [`Gesucht ist der Prozentsatz p.`, `p = W × 100 ÷ G = ${f(W)} t × 100 ÷ ${f(G)} t = <b>${f(p)} %</b>`],
      bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${f(G)} t`, W: `W = ${f(W)} t`, P: '? %' }, formel: 'grund',
    };
  },
  () => { // Grundwert
    const p = rnd([5, 10, 20, 25, 40, 50]), G = zw(60, 600, 20), W = G * p / 100;
    return {
      titel: 'Spannklemmen im Abschnitt',
      text: `<p>Bei einer Begehung werden <b>${f(W)} lockere Spannklemmen</b> gefunden. Das sind <b>${p} %</b> aller Spannklemmen im Abschnitt.</p>
        <p>Wie viele Spannklemmen sind im Abschnitt insgesamt eingebaut?</p>`,
      werte: [{ name: 'locker (W)', wert: `${f(W)} Stück` }, { name: 'Anteil (p)', wert: `${p} %` }],
      felder: [{ key: 'G', label: 'Spannklemmen insgesamt', einheit: 'Stück', exakt: true }], loesung: { G },
      weg: [`Gesucht ist der Grundwert G (das sind 100 %).`, `G = W × 100 ÷ p = ${f(W)} × 100 ÷ ${p} = <b>${f(G)} Stück</b>`,
        `Mit Dreisatz: ${p} % ≙ ${f(W)} → 1 % ≙ ${f(W / p, 3)} → 100 % ≙ ${f(G)}`],
      bild: { art: 'streifen', modus: 'anteil', p, G: 'G = ?', W: `W = ${f(W)} Stück`, P: `${p} %` }, formel: 'grund',
    };
  },
  () => { // Prozentsatz Zeit
    const G = rnd([4, 8, 12, 20, 24]), p = rnd([25, 50, 75]), W = G * p / 100;
    return {
      titel: 'Sperrpause',
      text: `<p>Eine Sperrpause dauert <b>${G} Stunden</b>. Nach <b>${f(W)} Stunden</b> ist die alte Weiche ausgebaut.</p>
        <p>Wie viel Prozent der Sperrpause sind dann schon vergangen?</p>`,
      werte: [{ name: 'Sperrpause (G)', wert: `${G} h` }, { name: 'vergangen (W)', wert: `${f(W)} h` }],
      felder: [{ key: 'p', label: 'vergangen', einheit: '%' }], loesung: { p },
      weg: [`p = W × 100 ÷ G = ${f(W)} h × 100 ÷ ${G} h = <b>${p} %</b>`],
      bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${G} h`, W: `W = ${f(W)} h`, P: '? %' }, formel: 'grund',
    };
  },
];

/* ================================ MITTEL ================================ */
const MITTEL: (() => Teil)[] = [
  () => { // MwSt aufschlagen
    const N = zw(500, 20000, 0.5), M = N * 0.19, B = N * 1.19;
    return {
      titel: 'Rechnung mit Mehrwertsteuer',
      text: `<p>Für Kleineisen (Schwellenschrauben, Spannklemmen) kommt eine Rechnung über <b>${eur(N)} netto</b>. Dazu kommen <b>19 % Mehrwertsteuer</b>.</p>`,
      werte: [{ name: 'netto', wert: eur(N) }, { name: 'MwSt', wert: '19 %' }],
      felder: [{ key: 'M', label: 'Mehrwertsteuer', einheit: '€' }, { key: 'B', label: 'Rechnungsbetrag brutto', einheit: '€' }], loesung: { M, B },
      weg: [`MwSt = netto × 19 ÷ 100 = ${eur(N)} × 19 ÷ 100 = <b>${eur(M)}</b>`, `brutto = netto + MwSt = ${eur(N)} + ${eur(M)} = <b>${eur(B)}</b>`,
        `Kürzer: brutto = netto × 1,19 (netto ≙ 100 %, brutto ≙ 119 %)`],
      bild: { art: 'streifen', modus: 'plus', p: 19, G: `netto ${eur(N)}`, W: 'MwSt = ?', P: '19 %', E: 'brutto = ?' }, formel: 'mwst',
    };
  },
  () => { // Rabatt
    const G = zw(1000, 30000, 50), p = rnd([3, 5, 8, 10, 12, 15]), R = G * p / 100, E = G - R;
    return {
      titel: 'Rabatt beim Händler',
      text: `<p>Ein Händler bietet Befestigungsmaterial für <b>${eur(G)}</b> an. Weil die Firma viel bestellt, gibt er <b>${p} % Rabatt</b>.</p>`,
      werte: [{ name: 'Preis', wert: eur(G) }, { name: 'Rabatt', wert: `${p} %` }],
      felder: [{ key: 'R', label: 'Rabatt', einheit: '€' }, { key: 'E', label: 'Preis nach Rabatt', einheit: '€' }], loesung: { R, E },
      weg: [`Rabatt = ${eur(G)} × ${p} ÷ 100 = <b>${eur(R)}</b>`, `Preis = ${eur(G)} − ${eur(R)} = <b>${eur(E)}</b>`,
        `Oder direkt: ${eur(G)} × ${100 - p} ÷ 100 = ${eur(E)} (es bleiben ${100 - p} %)`],
      bild: { art: 'streifen', modus: 'minus', p, G: `G = ${eur(G)}`, W: 'Rabatt = ?', P: `${p} %`, E: 'neu = ?' }, formel: 'aendern',
    };
  },
  () => { // Zuschlag Schotter
    const G = zw(200, 2500, 10), p = rnd([5, 8, 10, 12, 15]), Z = G * p / 100, E = G + Z;
    return {
      titel: 'Zuschlag beim Schotter',
      text: `<p>Für ein Schotterbett werden rechnerisch <b>${f(G)} t</b> Schotter gebraucht. Für Verdichtung und Verluste plant der Polier einen Zuschlag von <b>${p} %</b> ein.</p>`,
      werte: [{ name: 'Bedarf', wert: `${f(G)} t` }, { name: 'Zuschlag', wert: `${p} %` }],
      felder: [{ key: 'Z', label: 'Zuschlag', einheit: 't' }, { key: 'E', label: 'Bestellmenge', einheit: 't' }], loesung: { Z, E },
      weg: [`Zuschlag = ${f(G)} t × ${p} ÷ 100 = <b>${f(Z)} t</b>`, `Bestellmenge = ${f(G)} t + ${f(Z)} t = <b>${f(E)} t</b>`,
        `Oder direkt: ${f(G)} t × ${100 + p} ÷ 100 = ${f(E)} t`],
      bild: { art: 'streifen', modus: 'plus', p, G: `G = ${f(G)} t`, W: 'Zuschlag = ?', P: `${p} %`, E: 'Bestellung = ?' }, formel: 'aendern',
    };
  },
  () => { // Preiserhöhung
    const G = zw(18, 45, 0.5), p = rnd([3, 4, 5, 6, 8, 10]), Z = G * p / 100, E = G + Z;
    return {
      titel: 'Preiserhöhung',
      text: `<p>Eine Tonne Gleisschotter kostet frei Baustelle <b>${eur(G)}</b>. Der Lieferant erhöht den Preis um <b>${p} %</b>.</p>`,
      werte: [{ name: 'alter Preis', wert: `${eur(G)} je t` }, { name: 'Erhöhung', wert: `${p} %` }],
      felder: [{ key: 'Z', label: 'Erhöhung je t', einheit: '€' }, { key: 'E', label: 'neuer Preis je t', einheit: '€' }], loesung: { Z, E },
      weg: [`Erhöhung = ${eur(G)} × ${p} ÷ 100 = <b>${eur(Z)}</b>`, `neuer Preis = ${eur(G)} + ${eur(Z)} = <b>${eur(E)}</b>`],
      bild: { art: 'streifen', modus: 'plus', p, G: `alt ${eur(G)}`, W: '+ ?', P: `${p} %`, E: 'neu = ?' }, formel: 'aendern',
    };
  },
  () => { // Prozentsatz mit km/m
    const Gkm = zw(1.2, 6, 0.1), W = zw(200, Math.floor(Gkm * 900 / 10) * 10, 10), p = W / (Gkm * 1000) * 100;
    return {
      titel: 'Gleiserneuerung',
      text: `<p>Ein Gleis wird auf <b>${f(Gkm, 1)} km</b> Länge erneuert. Bis heute sind <b>${f(W)} m</b> fertig.</p>
        <p>Wie viel Prozent sind geschafft? (auf zwei Stellen nach dem Komma)</p>`,
      werte: [{ name: 'Gesamtlänge', wert: `${f(Gkm, 1)} km` }, { name: 'fertig', wert: `${f(W)} m` }],
      felder: [{ key: 'p', label: 'geschafft', einheit: '%' }], loesung: { p },
      weg: [`Gleiche Einheit: ${f(Gkm, 1)} km = ${f(Gkm * 1000)} m`, `p = W × 100 ÷ G = ${f(W)} m × 100 ÷ ${f(Gkm * 1000)} m = <b>${f(p)} %</b>`],
      bild: { art: 'streifen', modus: 'anteil', p, G: `G = ${f(Gkm, 1)} km`, W: `W = ${f(W)} m`, P: '? %' }, formel: 'grund',
    };
  },
  () => { // Neigung aus Höhenunterschied
    const l = zw(100, 800, 10), n = zw(1, 12, 0.5), dh = l * n / 1000;
    return {
      titel: 'Längsneigung',
      text: `<p>Ein Gleis steigt auf einer Länge von <b>${f(l)} m</b> um <b>${f(dh * 100, 1)} cm</b> an.</p>
        <p>Wie groß ist die Längsneigung in Promille und in Prozent?</p>`,
      werte: [{ name: 'Länge l', wert: `${f(l)} m` }, { name: 'Höhenunterschied Δh', wert: `${f(dh * 100, 1)} cm` }],
      felder: [{ key: 'n', label: 'Neigung', einheit: '‰' }, { key: 'p', label: 'Neigung', einheit: '%' }], loesung: { n, p: n / 10 },
      weg: [`Δh in Meter: ${f(dh * 100, 1)} cm = ${f(dh, 3)} m`, `Neigung = Δh ÷ l × 1000 = ${f(dh, 3)} ÷ ${f(l)} × 1000 = <b>${f(n)} ‰</b>`,
        `In Prozent: ${f(n)} ‰ ÷ 10 = <b>${f(n / 10, 3)} %</b>`],
      bild: { art: 'neigung', promille: n, l: `l = ${f(l)} m`, dh: `Δh = ${f(dh * 100, 1)} cm`, n: '? ‰', steigt: true }, formel: 'neigung',
    };
  },
  () => { // Toleranz
    const S = rnd([60, 80, 100, 120, 150, 200, 250]), p = rnd([1, 2, 3, 5]), a = S * p / 100;
    return {
      titel: 'Toleranz',
      text: `<p>Ein Bauteil hat ein Sollmaß von <b>${S} mm</b>. Erlaubt ist eine Abweichung von <b>± ${p} %</b>.</p>
        <p>Wie groß darf das Bauteil höchstens und mindestens sein?</p>`,
      werte: [{ name: 'Sollmaß', wert: `${S} mm` }, { name: 'Toleranz', wert: `± ${p} %` }],
      felder: [{ key: 'max', label: 'Größtmaß', einheit: 'mm' }, { key: 'min', label: 'Kleinstmaß', einheit: 'mm' }], loesung: { max: S + a, min: S - a },
      weg: [`Abweichung = ${S} mm × ${p} ÷ 100 = ${f(a)} mm`, `Größtmaß = ${S} + ${f(a)} = <b>${f(S + a)} mm</b>`, `Kleinstmaß = ${S} − ${f(a)} = <b>${f(S - a)} mm</b>`],
      bild: { art: 'streifen', modus: 'plus', p, G: `Soll ${S} mm`, W: `± ${p} %`, P: `${p} %`, E: 'max = ?' }, formel: 'toleranz',
    };
  },
];

/* ================================ SCHWER ================================ */
const SCHWER: (() => Teil)[] = [
  () => { // brutto → netto
    const B = cent(zw(500, 20000, 1) * 1.19), N = B / 1.19, M = B - N;
    return {
      titel: 'Netto aus brutto',
      text: `<p>Die Mietrechnung für einen Zweiwegebagger lautet über <b>${eur(B)}</b> – darin sind <b>19 % Mehrwertsteuer</b> schon enthalten.</p>
        <p>Wie hoch sind der Nettobetrag und die Mehrwertsteuer?</p>`,
      werte: [{ name: 'brutto', wert: eur(B) }, { name: 'MwSt', wert: '19 % enthalten' }],
      felder: [{ key: 'N', label: 'netto', einheit: '€' }, { key: 'M', label: 'Mehrwertsteuer', einheit: '€' }], loesung: { N, M },
      weg: [`Brutto ist <b>nicht</b> 100 %, sondern 119 % (netto ≙ 100 %).`, `netto = ${eur(B)} × 100 ÷ 119 = <b>${eur(N)}</b>`,
        `MwSt = brutto − netto = ${eur(B)} − ${eur(N)} = <b>${eur(M)}</b>`, `Typischer Fehler: 19 % von ${eur(B)} abziehen ergibt ${eur(B * 0.81)} – das ist falsch!`],
      bild: { art: 'streifen', modus: 'plus', p: 19, G: 'netto = ?', W: 'MwSt = ?', P: '19 %', E: `brutto ${eur(B)}` }, formel: 'mwst',
    };
  },
  () => { // Rabatt, Skonto, MwSt
    const G = zw(2000, 40000, 10), r = rnd([5, 8, 10, 12, 15]), s = rnd([2, 3]);
    const A1 = G * (100 - r) / 100, A2 = A1 * (100 - s) / 100, B = A2 * 1.19;
    return {
      titel: 'Rabatt, Skonto und MwSt',
      text: `<p>Schienenbefestigungen kosten laut Liste <b>${eur(G)} netto</b>. Der Händler gewährt <b>${r} % Rabatt</b>.
        Bei Zahlung innerhalb von 10 Tagen dürfen zusätzlich <b>${s} % Skonto</b> abgezogen werden. Danach kommen <b>19 % MwSt</b> dazu.</p>
        <p>Die Firma zahlt sofort. Welcher Betrag wird überwiesen?</p>`,
      werte: [{ name: 'Listenpreis', wert: eur(G) }, { name: 'Rabatt', wert: `${r} %` }, { name: 'Skonto', wert: `${s} %` }, { name: 'MwSt', wert: '19 %' }],
      felder: [{ key: 'A1', label: 'nach Rabatt', einheit: '€' }, { key: 'A2', label: 'nach Skonto (netto)', einheit: '€' }, { key: 'B', label: 'Überweisung brutto', einheit: '€' }],
      loesung: { A1, A2, B },
      weg: [`Rabatt: ${eur(G)} × ${100 - r} ÷ 100 = <b>${eur(A1)}</b>`, `Skonto vom <b>neuen</b> Betrag: ${eur(A1)} × ${100 - s} ÷ 100 = <b>${eur(A2)}</b>`,
        `MwSt: ${eur(A2)} × 1,19 = <b>${eur(B)}</b>`, `Achtung: ${r} % + ${s} % nicht einfach zusammenzählen – jeder Schritt hat einen anderen Grundwert.`],
      bild: { art: 'kette', zeilen: [{ name: 'Listenpreis', wert: G, text: eur(G) }, { name: 'nach Rabatt', wert: A1, text: '?', schritt: `− ${r} %` },
        { name: 'nach Skonto', wert: A2, text: '?', schritt: `− ${s} %` }, { name: 'brutto', wert: B, text: '?', schritt: '+ 19 %' }] },
      formel: 'kette',
    };
  },
  () => { // Rückrechnung vorher
    const plus = Math.random() < 0.5, G = zw(18, 45, 0.5), p = rnd([4, 5, 6, 8, 10, 12]);
    const E = cent(G * (plus ? 100 + p : 100 - p) / 100), Gx = E * 100 / (plus ? 100 + p : 100 - p), D = Math.abs(E - Gx);
    const q = plus ? 100 + p : 100 - p;
    return {
      titel: plus ? 'Preis vor der Erhöhung' : 'Preis vor dem Rabatt',
      text: plus
        ? `<p>Nach einer Preiserhöhung um <b>${p} %</b> kostet eine Tonne Edelsplitt <b>${eur(E)}</b>.</p><p>Was hat sie vorher gekostet und wie viel Euro beträgt die Erhöhung?</p>`
        : `<p>Nach <b>${p} % Rabatt</b> zahlt die Firma für eine Tonne Edelsplitt nur noch <b>${eur(E)}</b>.</p><p>Wie hoch war der Preis ohne Rabatt und wie viel Euro spart die Firma?</p>`,
      werte: [{ name: plus ? 'neuer Preis' : 'Preis mit Rabatt', wert: eur(E) }, { name: plus ? 'Erhöhung' : 'Rabatt', wert: `${p} %` }],
      felder: [{ key: 'G', label: plus ? 'Preis vorher' : 'Preis ohne Rabatt', einheit: '€' }, { key: 'D', label: plus ? 'Erhöhung' : 'Ersparnis', einheit: '€' }],
      loesung: { G: Gx, D },
      weg: [`Der alte Preis ist 100 %. Der neue Preis ist ${q} %.`, `G = ${eur(E)} × 100 ÷ ${q} = <b>${eur(Gx)}</b>`,
        `${plus ? 'Erhöhung' : 'Ersparnis'} = ${eur(Math.max(E, Gx))} − ${eur(Math.min(E, Gx))} = <b>${eur(D)}</b>`,
        `Typischer Fehler: ${p} % vom neuen Preis ${plus ? 'abziehen' : 'aufschlagen'} – der Grundwert ist aber der alte Preis!`],
      bild: { art: 'streifen', modus: plus ? 'plus' : 'minus', p, G: 'alt = ?', W: plus ? '+ ?' : '− ?', P: `${p} %`, E: `neu ${eur(E)}` }, formel: 'aendern',
    };
  },
  () => { // Veränderung in %
    const a = zw(300, 900, 10), steigt = Math.random() < 0.5, q = zw(5, 40, 1);
    const b = Math.round(a * (steigt ? 1 + q / 100 : 1 - q / 100) / 5) * 5, d = Math.abs(b - a), p = d / a * 100;
    return {
      titel: 'Leistung im Vergleich',
      text: `<p>Letzte Woche hat die Kolonne <b>${f(a)} m</b> Gleis umgebaut, diese Woche <b>${f(b)} m</b>.</p>
        <p>Um wie viel Prozent ist die Leistung ${steigt ? 'gestiegen' : 'gesunken'} (bezogen auf letzte Woche)?</p>`,
      werte: [{ name: 'letzte Woche', wert: `${f(a)} m` }, { name: 'diese Woche', wert: `${f(b)} m` }],
      felder: [{ key: 'd', label: 'Unterschied', einheit: 'm' }, { key: 'p', label: steigt ? 'gestiegen um' : 'gesunken um', einheit: '%' }], loesung: { d, p },
      weg: [`Grundwert ist der <b>alte</b> Wert: G = ${f(a)} m`, `Unterschied: ${f(Math.max(a, b))} − ${f(Math.min(a, b))} = <b>${f(d)} m</b>`,
        `p = ${f(d)} × 100 ÷ ${f(a)} = <b>${f(p)} %</b>`],
      bild: { art: 'kette', zeilen: [{ name: 'letzte Woche', wert: a, text: `${f(a)} m` }, { name: 'diese Woche', wert: b, text: `${f(b)} m`, schritt: `${steigt ? '+' : '−'} ? %` }] },
      formel: 'grund',
    };
  },
  () => { // Gradiente mit Kilometrierung
    const n = zw(2, 12, 0.5), kmVon = zw(1000, 9000, 0.1), l = zw(400, 2500, 0.1), H = zw(120, 480, 0.01), steigt = Math.random() < 0.5;
    const dh = l * n / 1000, H2 = steigt ? H + dh : H - dh;
    return {
      titel: 'Gradiente',
      text: `<p>Zwischen <b>km ${kmText(kmVon)}</b> und <b>km ${kmText(kmVon + l)}</b> ${steigt ? 'steigt' : 'fällt'} das Gleis gleichmäßig mit <b>${f(n)} ‰</b>.
        Am Anfang liegt die Schienenoberkante auf <b>${f(H)} m ü. NN</b>.</p>
        <p>Wie lang ist der Abschnitt, wie groß ist der Höhenunterschied und auf welcher Höhe liegt die Schienenoberkante am Ende?</p>`,
      werte: [{ name: 'von', wert: `km ${kmText(kmVon)}` }, { name: 'bis', wert: `km ${kmText(kmVon + l)}` }, { name: 'Neigung', wert: `${f(n)} ‰ ${steigt ? 'steigend' : 'fallend'}` }, { name: 'Höhe Anfang', wert: `${f(H)} m ü. NN` }],
      felder: [{ key: 'l', label: 'Länge', einheit: 'm' }, { key: 'dh', label: 'Höhenunterschied', einheit: 'm' }, { key: 'H2', label: 'Höhe am Ende', einheit: 'm ü. NN' }],
      loesung: { l, dh, H2 },
      weg: [`Länge: km ${kmText(kmVon + l)} − km ${kmText(kmVon)} = <b>${f(l, 1)} m</b>`, `Δh = l × ‰ ÷ 1000 = ${f(l, 1)} × ${f(n)} ÷ 1000 = <b>${f(dh, 3)} m</b>`,
        `Höhe am Ende: ${f(H)} ${steigt ? '+' : '−'} ${f(dh, 3)} = <b>${f(H2, 3)} m ü. NN</b>`],
      bild: { art: 'neigung', promille: n, l: 'l = ?', dh: 'Δh = ?', n: `${f(n)} ‰`, steigt }, formel: 'neigung',
    };
  },
  () => { // Verschnitt + Stückzahl
    const L = zw(500, 3000, 10), p = rnd([2, 3, 5]), S = 2 * L * (100 + p) / 100, anz = Math.ceil(S / 120 - 1e-9);
    return {
      titel: 'Schienen mit Verschnitt',
      text: `<p>Ein Gleis wird auf <b>${f(L)} m</b> Länge neu verlegt (zwei Schienenstränge). Für Verschnitt und Schweißstöße rechnet man <b>${p} %</b> dazu.
        Die Schienen werden in Längen von <b>120 m</b> geliefert.</p><p>Wie viele Meter Schiene werden gebraucht und wie viele Schienen müssen geliefert werden?</p>`,
      werte: [{ name: 'Gleislänge', wert: `${f(L)} m` }, { name: 'Stränge', wert: '2' }, { name: 'Verschnitt', wert: `${p} %` }, { name: 'Schienenlänge', wert: '120 m' }],
      felder: [{ key: 'S', label: 'Schiene mit Verschnitt', einheit: 'm' }, { key: 'anz', label: 'Schienen à 120 m', einheit: 'Stück', exakt: true }], loesung: { S, anz },
      weg: [`Ohne Verschnitt: 2 × ${f(L)} m = ${f(2 * L)} m`, `Mit Verschnitt: ${f(2 * L)} m × ${100 + p} ÷ 100 = <b>${f(S)} m</b>`,
        `Schienen: ${f(S)} m ÷ 120 m = ${f(S / 120, 2)} → <b>${anz} Stück</b> (immer aufrunden)`],
      bild: { art: 'streifen', modus: 'plus', p, G: `G = ${f(2 * L)} m`, W: 'Verschnitt = ?', P: `${p} %`, E: 'gesamt = ?' }, formel: 'aendern',
    };
  },
];

let letzte = -1;
export function neueAufgabe(stufe: Stufe): Aufgabe {
  const liste = stufe === 'leicht' ? LEICHT : stufe === 'mittel' ? MITTEL : SCHWER;
  let i = Math.floor(Math.random() * liste.length);
  if (i === letzte && liste.length > 1) i = (i + 1) % liste.length;
  letzte = i;
  const t = liste[i]();
  const gesucht = t.felder.map(x => `${x.label} (${x.einheit})`).join(', ');
  return { ...t, text: t.text + `<p class="gesucht"><b>Gesucht:</b> ${gesucht}.</p>`, nr: nr(), stufe };
}
