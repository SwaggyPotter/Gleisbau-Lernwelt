export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randChoice<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/** Zufallszahl zwischen min und max (inklusive), gerundet auf ein Vielfaches von step. */
export function randStep(min: number, max: number, step: number): number {
  const steps = Math.round((max - min) / step);
  const n = randInt(0, steps);
  return roundTo(min + n * step, 4);
}

export function roundTo(value: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Formatiert eine Zahl im deutschen Format (Komma statt Punkt), feste Nachkommastellen. */
export function formatDE(value: number, decimals: number): string {
  return roundTo(value, decimals)
    .toFixed(decimals)
    .replace('.', ',');
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Baut 4 Antwortoptionen (1 korrekt + 3 Distraktoren) aus Kandidatenwerten.
 * Dedupliziert gegen die korrekte Antwort und untereinander (nach Rundung),
 * mischt die Reihenfolge und weist IDs A-D zu.
 */
export function buildChoices(
  correct: number,
  distractorCandidates: number[],
  decimals: number,
  unit: string,
): { choices: { id: string; text: string; value: number }[]; correctChoiceId: string } {
  const correctRounded = roundTo(correct, decimals);
  const seen = new Set<string>([correctRounded.toFixed(decimals)]);
  const distractors: number[] = [];

  for (const cand of distractorCandidates) {
    if (distractors.length >= 3) break;
    const r = roundTo(cand, decimals);
    if (r <= 0) continue;
    const key = r.toFixed(decimals);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(r);
  }

  // Falls zu wenige eindeutige Distraktoren entstanden sind: mit additiven
  // Schritten auffüllen (±1×step, ±2×step, …). Additive Schritte sind bei
  // kleinen/ganzzahligen Ergebnissen (z. B. "Fahrten": 1, 2, 3 …)
  // zuverlässiger als prozentuale Abweichungen, die dort oft auf denselben
  // Wert zurückrunden. `guard` treibt die Iteration unabhängig von der
  // (evtl. stagnierenden) Trefferzahl voran, damit die Schleife bei
  // wiederholten Kollisionen nicht hängen bleibt.
  const step = decimals === 0 ? 1 : Math.pow(10, -decimals);
  let k = 1;
  let guard = 0;
  while (distractors.length < 3 && guard < 60) {
    guard += 1;
    const trial = guard % 2 === 1 ? correctRounded + k * step : correctRounded - k * step;
    const r = roundTo(trial, decimals);
    const key = r.toFixed(decimals);
    if (r > 0 && !seen.has(key)) {
      seen.add(key);
      distractors.push(r);
    }
    if (guard % 2 === 0) k += 1;
  }

  const all = [
    { value: correctRounded, isCorrect: true },
    ...distractors.map(v => ({ value: v, isCorrect: false })),
  ];
  const shuffled = all
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(entry => entry.item);

  const letters = ['A', 'B', 'C', 'D'];
  let correctChoiceId = 'A';
  const choices = shuffled.map((entry, i) => {
    const id = letters[i];
    if (entry.isCorrect) correctChoiceId = id;
    return { id, text: `${formatDE(entry.value, decimals)} ${unit}`, value: entry.value };
  });

  return { choices, correctChoiceId };
}
