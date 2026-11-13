import { auswahl, geg, s, zahl } from '../kern/bauer';
import { abszisseKubisch, laengeAusKubisch, ordinateKubisch, radiusAusKubisch } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

const APP = 'uebergangsbogen';
const TIPP = 'x hoch drei durch (6 · r · lü). x wird vom Übergangsbogenanfang (UA) gemessen, alles in m.';

/** Zufallswerte mit einer Ordinate von mindestens 10 mm (sonst sind die Aufgaben sinnlos klein). */
function werte(rFest?: number): { r: number; lue: number; x: number } {
  for (;;) {
    const r = rFest ?? randStep(300, 2500, 50);
    const lue = randStep(40, 200, 10);
    const x = randStep(10, lue, 10);
    if (ordinateKubisch(x, r, lue) >= 0.01) return { r, lue, x };
  }
}

function rechnung(x: number, r: number, lue: number, y: number): string {
  return `y = \\frac{${zl(x, 0)}^3}{6 \\cdot ${zl(r, 0)} \\cdot ${zl(lue, 0)}} = \\frac{${zl(x * x * x, 0)}}{${zl(6 * r * lue, 0)}} = ${zl(y, 4)}\\,\\text{m}`;
}

// ---------- Üben ----------

function uebenY(stufe: Stufe): Aufgabe {
  const { r, lue, x } = werte();
  const y = ordinateKubisch(x, r, lue);
  const mm = stufe >= 2;
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Ihr steckt einen Übergangsbogen (lü = ${lue} m) vor einem Kreisbogen mit r = ${fmt(r, 0)} m ab. Bei x = ${x} m ab UA misst du rechtwinklig von der Tangente ab.`,
          `Der Vermesser fehlt heute. Du sollst die Absteckwerte für den Übergangsbogen selbst ausrechnen: r = ${fmt(r, 0)} m, lü = ${lue} m. Nächster Punkt: x = ${x} m.`,
        ])
      : undefined,
    gegeben: [geg('x', 'Abstand ab UA', x, 'm', 0), geg('r', 'Radius des Kreisbogens', r, 'm', 0), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: mm ? 'Wie groß ist die Ordinate y in mm?' : 'Berechne die Ordinate y in m.',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: mm ? 'mm' : 'm' },
    loesung: mm ? roundTo(y * 1000, 0) : roundTo(y, 3), nk: mm ? 0 : 3,
    tipp: TIPP,
    schritte: [
      s('Formel der kubischen Parabel:', 'y = \\frac{x^3}{6 \\cdot r \\cdot l_\\text{ü}}'),
      s('Einsetzen (alles in m):', rechnung(x, r, lue, y)),
      ...(mm ? [s('In mm (× 1000):', `y = ${zl(y * 1000, 0)}\\,\\text{mm}`)] : []),
    ],
  });
}

function uebenEnde(stufe: Stufe): Aufgabe {
  const r = randStep(300, 2500, 50);
  const lue = randStep(40, 200, 10);
  const y = ordinateKubisch(lue, r, lue);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'ueben', stufe,
    text: `Am Ende des Übergangsbogens (UE, also bei x = lü) soll die Ordinate kontrolliert werden. r = ${fmt(r, 0)} m, lü = ${lue} m.`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: 'Wie groß ist die Ordinate am UE in mm?',
    gesucht: { sym: 'y_E', name: 'Ordinate am Übergangsbogenende', einheit: 'mm' },
    loesung: roundTo(y * 1000, 0), nk: 0,
    tipp: 'Am Ende ist x = lü. Einsetzen – ein lü kürzt sich weg: y = lü² / (6r).',
    schritte: [
      s('Bei UE gilt x = lü:', `y = \\frac{l_\\text{ü}^3}{6 \\cdot r \\cdot l_\\text{ü}} = \\frac{l_\\text{ü}^2}{6 \\cdot r}`),
      s('Einsetzen:', `y = \\frac{${zl(lue, 0)}^2}{6 \\cdot ${zl(r, 0)}} = ${zl(y, 4)}\\,\\text{m} = ${zl(y * 1000, 0)}\\,\\text{mm}`),
    ],
  });
}

function frageVerdopplung(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'y-kubisch', modus: 'ueben', stufe,
    text: 'Du verdoppelst den Abstand x vom Übergangsbogenanfang (r und lü bleiben gleich).',
    gegeben: [],
    frage: 'Wie ändert sich die Ordinate y?',
    optionen: ['Sie wird 8-mal so groß', 'Sie wird doppelt so groß', 'Sie wird 4-mal so groß', 'Sie bleibt gleich'],
    tipp: 'Schau auf den Exponenten von x in der Formel.',
    schritte: [s('x steht hoch 3 in der Formel: (2x)³ = 8 · x³. Also wird y 8-mal so groß.', 'y = \\frac{x^3}{6 \\cdot r \\cdot l_\\text{ü}}')],
  });
}

// ---------- Umstellen ----------

function umstellenR(stufe: Stufe): Aufgabe {
  const { r: rWahr, lue, x } = werte();
  const yMm = Math.max(1, roundTo(ordinateKubisch(x, rWahr, lue) * 1000, 0));
  const y = yMm / 1000;
  const r = radiusAusKubisch(x, y, lue);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Bei x = ${x} m ab UA misst du eine Ordinate von ${yMm} mm. Der Übergangsbogen ist ${lue} m lang. Welcher Radius schließt an?` : undefined,
    gegeben: [geg('x', 'Abstand ab UA', x, 'm', 0), geg('y', 'Ordinate', yMm, 'mm', 0), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: 'Berechne den Radius r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'r und y tauschen die Plätze. y vorher in m umrechnen.',
    formelLatex: 'r = \\frac{x^3}{6 \\cdot y \\cdot l_\\text{ü}}',
    schritte: [
      s('Nach r umstellen:', 'r = \\frac{x^3}{6 \\cdot y \\cdot l_\\text{ü}}'),
      s('y in m:', `y = ${zl(yMm, 0)}\\,\\text{mm} = ${zl(y, 3)}\\,\\text{m}`),
      s('Einsetzen:', `r = \\frac{${zl(x, 0)}^3}{6 \\cdot ${zl(y, 3)} \\cdot ${zl(lue, 0)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenLue(stufe: Stufe): Aufgabe {
  const { r, lue: lWahr, x } = werte();
  const yMm = Math.max(1, roundTo(ordinateKubisch(x, r, lWahr) * 1000, 0));
  const y = yMm / 1000;
  const lue = laengeAusKubisch(x, r, y);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Länge des Übergangsbogens ist im Plan unleserlich. Bekannt: r = ${fmt(r, 0)} m, bei x = ${x} m beträgt y = ${yMm} mm.` : undefined,
    gegeben: [geg('x', 'Abstand ab UA', x, 'm', 0), geg('r', 'Radius', r, 'm', 0), geg('y', 'Ordinate', yMm, 'mm', 0)],
    frage: 'Berechne die Länge lü in m.',
    gesucht: { sym: 'l_\\text{ü}', name: 'Länge Übergangsbogen', einheit: 'm' },
    loesung: roundTo(lue, 1), nk: 1,
    tipp: 'lü steht im Nenner – mit y tauschen. y in m!',
    formelLatex: 'l_\\text{ü} = \\frac{x^3}{6 \\cdot r \\cdot y}',
    schritte: [
      s('Nach lü umstellen:', 'l_\\text{ü} = \\frac{x^3}{6 \\cdot r \\cdot y}'),
      s('Einsetzen (y in m):', `l_\\text{ü} = \\frac{${zl(x, 0)}^3}{6 \\cdot ${zl(r, 0)} \\cdot ${zl(y, 3)}} = ${zl(lue, 1)}\\,\\text{m}`),
    ],
  });
}

function umstellenX(stufe: Stufe): Aufgabe {
  const r = randStep(300, 2500, 50);
  const lue = randStep(60, 200, 10);
  const yCm = randStep(1, Math.max(2, Math.floor(ordinateKubisch(lue, r, lue) * 100)), 1);
  const y = yCm / 100;
  const x = abszisseKubisch(r, lue, y);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `An welcher Stelle x (ab UA) hat der Übergangsbogen genau ${yCm} cm Abstand von der Tangente? r = ${fmt(r, 0)} m, lü = ${lue} m.` : undefined,
    gegeben: [geg('y', 'Ordinate', yCm, 'cm', 0), geg('r', 'Radius', r, 'm', 0), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: 'Berechne x in m.',
    gesucht: { sym: 'x', name: 'Abstand ab UA', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'Mal (6 · r · lü) rechnen, dann die dritte Wurzel ziehen (Taste x^(1/3) bzw. ∛).',
    formelLatex: 'x = \\sqrt[3]{6 \\cdot r \\cdot l_\\text{ü} \\cdot y}',
    schritte: [
      s('Umstellen:', 'x = \\sqrt[3]{6 \\cdot r \\cdot l_\\text{ü} \\cdot y}'),
      s('y in m:', `y = ${zl(yCm, 0)}\\,\\text{cm} = ${zl(y, 2)}\\,\\text{m}`),
      s('Einsetzen:', `x = \\sqrt[3]{6 \\cdot ${zl(r, 0)} \\cdot ${zl(lue, 0)} \\cdot ${zl(y, 2)}} = \\sqrt[3]{${zl(6 * r * lue * y, 1)}} = ${zl(x, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKm(stufe: Stufe): Aufgabe {
  const rKm = randStep(0.4, 2.5, 0.05);
  const r = roundTo(rKm * 1000, 0);
  const { lue, x } = werte(r);
  const y = ordinateKubisch(x, r, lue);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'einheiten', stufe,
    text: `Im Lageplan: r = ${fmt(rKm, 2)} km, lü = ${lue} m. Absteckpunkt bei x = ${x} m.`,
    gegeben: [geg('x', 'Abstand ab UA', x, 'm', 0), geg('r', 'Radius', rKm, 'km', 2), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: 'Ordinate y in mm?',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'mm' },
    loesung: roundTo(y * 1000, 0), nk: 0,
    tipp: 'Radius erst in m umrechnen (× 1000), Ergebnis am Schluss in mm.',
    schritte: [
      s('r in m:', `r = ${zl(rKm, 2)}\\,\\text{km} = ${zl(r, 0)}\\,\\text{m}`),
      s('Einsetzen:', rechnung(x, r, lue, y)),
      s('In mm:', `y = ${zl(y * 1000, 0)}\\,\\text{mm}`),
    ],
  });
}

function einheitenCm(stufe: Stufe): Aufgabe {
  const { r, lue, x } = werte();
  const xCm = x * 100;
  const y = ordinateKubisch(x, r, lue);
  return zahl({
    appId: APP, formelId: 'y-kubisch', modus: 'einheiten', stufe,
    text: `Dein Kollege hat x mit dem Maßband in Zentimetern notiert: x = ${fmt(xCm, 0)} cm. r = ${fmt(r, 0)} m, lü = ${lue} m.`,
    gegeben: [geg('x', 'Abstand ab UA', xCm, 'cm', 0), geg('r', 'Radius', r, 'm', 0), geg('l_\\text{ü}', 'Länge Übergangsbogen', lue, 'm', 0)],
    frage: 'Ordinate y in cm?',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'cm' },
    loesung: roundTo(y * 100, 1), nk: 1,
    tipp: 'x erst in m umrechnen – sonst ist das Ergebnis um den Faktor 100³ falsch!',
    schritte: [
      s('x in m:', `x = ${zl(xCm, 0)}\\,\\text{cm} = ${zl(x, 0)}\\,\\text{m}`),
      s('Einsetzen:', rechnung(x, r, lue, y)),
      s('In cm:', `y = ${zl(y * 100, 1)}\\,\\text{cm}`),
    ],
  });
}

// ---------- Rechner ----------

function rechnerY(w: Record<string, number>): RechnerAusgabe {
  const { x, r, lue } = w as { x: number; r: number; lue: number };
  if (!(r > 0) || !(lue > 0) || !(x >= 0)) return { ergebnisse: [], warnungen: ['r und lü müssen größer als 0 sein, x mindestens 0.'], schritte: [] };
  const y = ordinateKubisch(x, r, lue);
  const warnungen = x > lue ? ['x liegt hinter dem Übergangsbogenende (x > lü) – dort gilt schon der Kreisbogen.'] : [];
  const zeilen: string[][] = [];
  const schritt = lue > 100 ? 20 : 10;
  for (let xi = 0; xi <= lue + 1e-9; xi += schritt) zeilen.push([fmt(xi, 0), fmt(ordinateKubisch(xi, r, lue) * 1000, 1)]);
  if (Math.abs((zeilen.length - 1) * schritt - lue) > 1e-9) zeilen.push([fmt(lue, 1), fmt(ordinateKubisch(lue, r, lue) * 1000, 1)]);
  return {
    ergebnisse: [
      { sym: 'y', name: 'Ordinate', wert: y * 1000, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'y_E', name: 'Ordinate am UE (x = lü)', wert: ordinateKubisch(lue, r, lue) * 1000, einheit: 'mm', nk: 1 },
    ],
    warnungen,
    schritte: [s('', rechnung(x, r, lue, y))],
    tabelle: { titel: 'Absteckliste', kopf: ['x [m]', 'y [mm]'], zeilen },
  };
}

function rechnerR(w: Record<string, number>): RechnerAusgabe {
  const { x, y, lue } = w as { x: number; y: number; lue: number };
  if (!(x > 0) || !(y > 0) || !(lue > 0)) return { ergebnisse: [], warnungen: ['Alle Werte müssen größer als 0 sein.'], schritte: [] };
  const r = radiusAusKubisch(x, y, lue);
  return {
    ergebnisse: [{ sym: 'r', name: 'Radius', wert: r, einheit: 'm', nk: 0, hervorheben: true }],
    warnungen: [],
    schritte: [s('', `r = \\frac{${zl(x, 2)}^3}{6 \\cdot ${zl(y, 4)} \\cdot ${zl(lue, 1)}} = ${zl(r, 0)}\\,\\text{m}`)],
  };
}

export const UEBERGANGSBOGEN_APP: MiniAppDef = {
  id: APP,
  skizze: 'uebergangsbogen',
  formelIds: ['y-kubisch'],
  merkhilfen: [
    'Der Übergangsbogen (UA → UE) baut die Krümmung von 0 (Gerade) gleichmäßig bis 1/r (Kreisbogen) auf.',
    'Die Tangente am UA ist die x-Achse. y misst du rechtwinklig von der Tangente aus.',
    'x hoch 3: doppeltes x → achtfaches y. Am Ende (x = lü) gilt y = lü² / (6r).',
  ],
  verweise: [{ label: 'Pfeilhöhen im Übergangsbogen im Trassenplan rechnen', link: '/zusatz/trassenplan' }],
  rechner: [
    {
      id: 'y', label: 'Ordinate y',
      felder: [
        { key: 'x', sym: 'x', name: 'Abstand ab UA', einheit: 'm', einheiten: ['m', 'cm'], standard: 40 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 800 },
        { key: 'lue', sym: 'l_\\text{ü}', name: 'Länge Übergangsbogen', einheit: 'm', einheiten: ['m'], standard: 100 },
      ],
      berechne: rechnerY,
    },
    {
      id: 'r', label: 'Radius aus y',
      felder: [
        { key: 'x', sym: 'x', name: 'Abstand ab UA', einheit: 'm', einheiten: ['m', 'cm'], standard: 40 },
        { key: 'y', sym: 'y', name: 'Ordinate', einheit: 'm', einheiten: ['mm', 'cm', 'm'], standard: 133 },
        { key: 'lue', sym: 'l_\\text{ü}', name: 'Länge Übergangsbogen', einheit: 'm', einheiten: ['m'], standard: 100 },
      ],
      berechne: rechnerR,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenR : randChoice([umstellenR, umstellenLue, umstellenX]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenKm, einheitenCm])(stufe);
    if (stufe === 1) return uebenY(1);
    if (stufe === 2) return chance(0.15) ? frageVerdopplung(2) : uebenY(2);
    return chance(0.4) ? uebenEnde(3) : uebenY(3);
  },
};
