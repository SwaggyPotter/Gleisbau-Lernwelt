import { Injectable } from '@angular/core';
import { AufgabenTyp, Difficulty, GeneratedQuestion } from '../models/materialrechner.models';
import { MATERIALIEN, findMaterial } from '../data/schuettdichten';
import { buildChoices, formatDE, nextId, randChoice, randInt, randStep, roundTo } from './rechnen-utils';

const TYPEN: AufgabenTyp[] = ['schicht-volumen', 'trapez-volumen', 'material-gewicht', 'gleisabschnitt'];

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(difficulty: Difficulty, typ?: AufgabenTyp): GeneratedQuestion {
    const gewaehlterTyp = typ ?? randChoice(TYPEN);
    switch (gewaehlterTyp) {
      case 'schicht-volumen':
        return this.schichtVolumen(difficulty);
      case 'trapez-volumen':
        return this.trapezVolumen(difficulty);
      case 'material-gewicht':
        return this.materialGewicht(difficulty);
      case 'gleisabschnitt':
        return this.gleisabschnitt(difficulty);
      default:
        return this.schichtVolumen(difficulty);
    }
  }

  // --- Typ 1: Materialschicht (Quader), optional mit Aussparung ---
  private schichtVolumen(difficulty: Difficulty): GeneratedQuestion {
    const l = difficulty === 'leicht' ? randInt(3, 15) : randStep(3, 20, 0.5);
    const b = difficulty === 'leicht' ? randInt(2, 8) : randStep(2, 10, 0.5);
    const dCm = randChoice(difficulty === 'leicht' ? [10, 15, 20, 25, 30] : [8, 10, 12, 15, 18, 20, 25, 30, 35]);
    const d = dCm / 100;
    const grundVolumen = l * b * d;

    let prompt = `Eine Materialschicht ist ${formatDE(l, l % 1 === 0 ? 0 : 1)} m lang, ${formatDE(b, b % 1 === 0 ? 0 : 1)} m breit und ${dCm} cm dick. Wie groß ist das Volumen?`;
    let correct = grundVolumen;
    let explanation = `${dCm} cm = ${formatDE(d, 2)} m. V = ${formatDE(l, l % 1 === 0 ? 0 : 1)} m × ${formatDE(b, b % 1 === 0 ? 0 : 1)} m × ${formatDE(d, 2)} m = ${formatDE(correct, 2)} m³.`;

    if (difficulty === 'schwer') {
      const ausL = roundTo(l * 0.2 + randStep(0.3, 1.2, 0.1), 2);
      const ausB = roundTo(b * 0.3 + randStep(0.2, 0.8, 0.1), 2);
      const ausparung = ausL * ausB * d;
      correct = grundVolumen - ausparung;
      prompt = `Eine Materialschicht ist ${formatDE(l, l % 1 === 0 ? 0 : 1)} m lang, ${formatDE(b, b % 1 === 0 ? 0 : 1)} m breit und ${dCm} cm dick. Eine rechteckige Aussparung (Kabelkanal) von ${formatDE(ausL, 2)} m × ${formatDE(ausB, 2)} m durchzieht die Schicht in voller Tiefe. Wie viel Material wird tatsächlich benötigt?`;
      explanation = `Grundvolumen = ${formatDE(l, l % 1 === 0 ? 0 : 1)} × ${formatDE(b, b % 1 === 0 ? 0 : 1)} × ${formatDE(d, 2)} = ${formatDE(grundVolumen, 2)} m³. Aussparung = ${formatDE(ausL, 2)} × ${formatDE(ausB, 2)} × ${formatDE(d, 2)} = ${formatDE(ausparung, 2)} m³. Ergebnis = ${formatDE(grundVolumen, 2)} − ${formatDE(ausparung, 2)} = ${formatDE(correct, 2)} m³.`;
    }

    const distractors = [
      grundVolumen, // Aussparung vergessen (nur bei schwer relevant)
      l * b * dCm, // cm nicht umgerechnet
      l * b * d * 2, // Faktor-2-Fehler
      (l + b) * d, // Formel-Verwechslung (Addition statt Multiplikation)
    ];

    const { choices, correctChoiceId } = buildChoices(correct, distractors, 2, 'm³');
    return {
      id: nextId('sv'),
      typ: 'schicht-volumen',
      difficulty,
      prompt,
      unit: 'm³',
      choices,
      correctChoiceId,
      explanation,
    };
  }

  // --- Typ 2: Trapezprofil (Gleisbett-/Damm-Querschnitt) ---
  private trapezVolumen(difficulty: Difficulty): GeneratedQuestion {
    const laenge = difficulty === 'leicht' ? randInt(10, 60) : randStep(10, 100, 5);
    const h = randStep(0.3, 1.2, 0.1);
    const a = randStep(2, 4, 0.1);

    let b: number;
    let prompt: string;
    let explanation: string;

    if (difficulty === 'leicht') {
      b = randStep(3, 6, 0.1);
      const flaeche = ((a + b) / 2) * h;
      const volumen = flaeche * laenge;
      prompt = `Ein Gleisbett hat im Querschnitt die Form eines Trapezes: obere Breite ${formatDE(a, 1)} m, untere Breite ${formatDE(b, 1)} m, Höhe ${formatDE(h, 1)} m. Der Abschnitt ist ${formatDE(laenge, 0)} m lang. Wie groß ist das Volumen?`;
      explanation = `Querschnittsfläche = ((${formatDE(a, 1)} + ${formatDE(b, 1)}) / 2) × ${formatDE(h, 1)} = ${formatDE(flaeche, 2)} m². Volumen = ${formatDE(flaeche, 2)} m² × ${formatDE(laenge, 0)} m = ${formatDE(volumen, 2)} m³.`;
      const distractors = [a * b * h * laenge, (a + b) * h * laenge, flaeche * laenge * 2, a * laenge];
      const { choices, correctChoiceId } = buildChoices(volumen, distractors, 2, 'm³');
      return { id: nextId('tv'), typ: 'trapez-volumen', difficulty, prompt, unit: 'm³', choices, correctChoiceId, explanation };
    }

    // mittel/schwer: Böschungsneigung 1:n statt direkter unterer Breite
    const n = randChoice([1, 1.5, 2]);
    b = roundTo(a + 2 * n * h, 2);
    const flaeche = ((a + b) / 2) * h;
    const volumen = flaeche * laenge;
    prompt = `Ein Gleisbett hat oben eine Breite von ${formatDE(a, 1)} m und eine Höhe von ${formatDE(h, 1)} m. Die Böschung hat eine Neigung von 1:${n}. Der Abschnitt ist ${formatDE(laenge, 0)} m lang. Wie groß ist das Volumen?`;
    explanation = `Untere Breite b = a + 2·n·h = ${formatDE(a, 1)} + 2 × ${n} × ${formatDE(h, 1)} = ${formatDE(b, 2)} m. Fläche = ((${formatDE(a, 1)} + ${formatDE(b, 2)}) / 2) × ${formatDE(h, 1)} = ${formatDE(flaeche, 2)} m². Volumen = ${formatDE(flaeche, 2)} × ${formatDE(laenge, 0)} = ${formatDE(volumen, 2)} m³.`;

    const distractors = [
      ((a + a) / 2) * h * laenge, // Böschung ignoriert (b = a)
      a * b * h * laenge,
      flaeche * laenge * 1.5,
      ((a + b) / 2) * h * laenge * 0.5,
    ];
    const { choices, correctChoiceId } = buildChoices(volumen, distractors, 2, 'm³');
    return { id: nextId('tv'), typ: 'trapez-volumen', difficulty, prompt, unit: 'm³', choices, correctChoiceId, explanation };
  }

  // --- Typ 3: Materialgewicht (Volumen × Schüttdichte) ---
  private materialGewicht(difficulty: Difficulty): GeneratedQuestion {
    const material = randChoice(MATERIALIEN);

    if (difficulty === 'leicht') {
      const v = randStep(5, 40, 1);
      const gewicht = v * material.schuettdichteTPerM3;
      const prompt = `Für eine Baustelle werden ${formatDE(v, 0)} m³ ${material.name} benötigt. Die Schüttdichte beträgt ${formatDE(material.schuettdichteTPerM3, 2)} t/m³. Wie viel wiegt das Material?`;
      const explanation = `Masse = Volumen × Schüttdichte = ${formatDE(v, 0)} m³ × ${formatDE(material.schuettdichteTPerM3, 2)} t/m³ = ${formatDE(gewicht, 2)} t.`;
      const distractors = [v / material.schuettdichteTPerM3, v * material.schuettdichteTPerM3 * 10, v + material.schuettdichteTPerM3, v * (material.schuettdichteTPerM3 + 0.3)];
      const { choices, correctChoiceId } = buildChoices(gewicht, distractors, 2, 't');
      return { id: nextId('mg'), typ: 'material-gewicht', difficulty, prompt, unit: 't', choices, correctChoiceId, explanation };
    }

    const l = randStep(4, 15, 0.5);
    const b = randStep(2, 6, 0.5);
    const dCm = randChoice([15, 20, 25, 30, 40]);
    const d = dCm / 100;
    const v = l * b * d;
    const gewicht = v * material.schuettdichteTPerM3;

    if (difficulty === 'mittel') {
      const prompt = `Für eine Schicht ${material.name} (${formatDE(l, l % 1 === 0 ? 0 : 1)} m × ${formatDE(b, b % 1 === 0 ? 0 : 1)} m, ${dCm} cm dick) wird das Gewicht benötigt. Die Schüttdichte beträgt ${formatDE(material.schuettdichteTPerM3, 2)} t/m³. Wie viel wiegt das Material?`;
      const explanation = `Volumen = ${formatDE(l, l % 1 === 0 ? 0 : 1)} × ${formatDE(b, b % 1 === 0 ? 0 : 1)} × ${formatDE(d, 2)} = ${formatDE(v, 2)} m³. Masse = ${formatDE(v, 2)} m³ × ${formatDE(material.schuettdichteTPerM3, 2)} t/m³ = ${formatDE(gewicht, 2)} t.`;
      const distractors = [v * material.schuettdichteTPerM3 * 10, l * b * dCm * material.schuettdichteTPerM3, v / material.schuettdichteTPerM3, gewicht * 0.5];
      const { choices, correctChoiceId } = buildChoices(gewicht, distractors, 2, 't');
      return { id: nextId('mg'), typ: 'material-gewicht', difficulty, prompt, unit: 't', choices, correctChoiceId, explanation };
    }

    // schwer: zusätzlich LKW-Fahrten berechnen (aufrunden!)
    const lkwKapazitaet = randChoice([18, 20, 24]);
    const fahrten = Math.ceil(gewicht / lkwKapazitaet);
    const prompt = `Für eine Schicht ${material.name} (${formatDE(l, l % 1 === 0 ? 0 : 1)} m × ${formatDE(b, b % 1 === 0 ? 0 : 1)} m, ${dCm} cm dick, Schüttdichte ${formatDE(material.schuettdichteTPerM3, 2)} t/m³) soll das Material angeliefert werden. Ein LKW fasst ${lkwKapazitaet} t. Wie viele LKW-Fahrten werden mindestens benötigt?`;
    const explanation = `Volumen = ${formatDE(l, l % 1 === 0 ? 0 : 1)} × ${formatDE(b, b % 1 === 0 ? 0 : 1)} × ${formatDE(d, 2)} = ${formatDE(v, 2)} m³. Masse = ${formatDE(v, 2)} × ${formatDE(material.schuettdichteTPerM3, 2)} = ${formatDE(gewicht, 2)} t. Fahrten = ${formatDE(gewicht, 2)} ÷ ${lkwKapazitaet} = ${formatDE(gewicht / lkwKapazitaet, 2)}, aufgerundet auf ${fahrten} Fahrten (eine angefangene Fahrt zählt voll).`;
    const distractors = [Math.floor(gewicht / lkwKapazitaet), fahrten - 1, fahrten + 1, fahrten + 2];
    const { choices, correctChoiceId } = buildChoices(fahrten, distractors, 0, 'Fahrten');
    return { id: nextId('mg'), typ: 'material-gewicht', difficulty, prompt, unit: 'Fahrten', choices, correctChoiceId, explanation };
  }

  // --- Typ 4: Gleisabschnitt komplett (Trapez-Querschnitt -> Volumen -> Gewicht) ---
  private gleisabschnitt(difficulty: Difficulty): GeneratedQuestion {
    const material = findMaterial('gleisschotter');
    const laenge = randStep(20, 150, 5);
    const h = randStep(0.3, 0.6, 0.05);
    const a = randStep(3.0, 3.6, 0.1);

    if (difficulty !== 'schwer') {
      const b = randStep(3.6, 4.4, 0.1);
      const flaeche = ((a + b) / 2) * h;
      const volumen = flaeche * laenge;
      const gewicht = volumen * material.schuettdichteTPerM3;
      const prompt = `Ein Gleisabschnitt von ${formatDE(laenge, 0)} m Länge hat ein Schotterbett mit Trapez-Querschnitt: oben ${formatDE(a, 1)} m, unten ${formatDE(b, 1)} m, Höhe ${formatDE(h, 2)} m. Wie viel Tonnen Gleisschotter (Schüttdichte ${formatDE(material.schuettdichteTPerM3, 2)} t/m³) werden benötigt?`;
      const explanation = `Fläche = ((${formatDE(a, 1)} + ${formatDE(b, 1)}) / 2) × ${formatDE(h, 2)} = ${formatDE(flaeche, 2)} m². Volumen = ${formatDE(flaeche, 2)} × ${formatDE(laenge, 0)} = ${formatDE(volumen, 2)} m³. Masse = ${formatDE(volumen, 2)} × ${formatDE(material.schuettdichteTPerM3, 2)} = ${formatDE(gewicht, 2)} t.`;
      const distractors = [volumen, gewicht * 10, gewicht / 2, flaeche * laenge * material.schuettdichteTPerM3 * 2];
      const { choices, correctChoiceId } = buildChoices(gewicht, distractors, 1, 't');
      return { id: nextId('ga'), typ: 'gleisabschnitt', difficulty, prompt, unit: 't', choices, correctChoiceId, explanation };
    }

    // schwer: Böschungsneigung ableiten + Volumen + Gewicht + LKW-Fahrten
    const n = randChoice([1, 1.5, 2]);
    const b = roundTo(a + 2 * n * h, 2);
    const flaeche = ((a + b) / 2) * h;
    const volumen = flaeche * laenge;
    const gewicht = volumen * material.schuettdichteTPerM3;
    const lkwKapazitaet = randChoice([20, 24]);
    const fahrten = Math.ceil(gewicht / lkwKapazitaet);

    const prompt = `Ein Gleisabschnitt von ${formatDE(laenge, 0)} m Länge erhält ein neues Schotterbett: obere Breite ${formatDE(a, 1)} m, Höhe ${formatDE(h, 2)} m, Böschungsneigung 1:${n}. Schüttdichte Gleisschotter: ${formatDE(material.schuettdichteTPerM3, 2)} t/m³, LKW-Kapazität: ${lkwKapazitaet} t. Wie viele LKW-Fahrten werden mindestens benötigt?`;
    const explanation = `b = a + 2·n·h = ${formatDE(a, 1)} + 2 × ${n} × ${formatDE(h, 2)} = ${formatDE(b, 2)} m. Fläche = ((${formatDE(a, 1)} + ${formatDE(b, 2)}) / 2) × ${formatDE(h, 2)} = ${formatDE(flaeche, 2)} m². Volumen = ${formatDE(flaeche, 2)} × ${formatDE(laenge, 0)} = ${formatDE(volumen, 2)} m³. Masse = ${formatDE(volumen, 2)} × ${formatDE(material.schuettdichteTPerM3, 2)} = ${formatDE(gewicht, 2)} t. Fahrten = ${formatDE(gewicht, 2)} ÷ ${lkwKapazitaet}, aufgerundet auf ${fahrten}.`;
    const distractors = [Math.floor(gewicht / lkwKapazitaet), fahrten - 1, fahrten + 1, fahrten + 2];
    const { choices, correctChoiceId } = buildChoices(fahrten, distractors, 0, 'Fahrten');
    return { id: nextId('ga'), typ: 'gleisabschnitt', difficulty, prompt, unit: 'Fahrten', choices, correctChoiceId, explanation };
  }
}
