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
  return roundTo(min + n * step, 6);
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

export function parseDE(raw: string): number {
  return parseFloat(raw.replace(',', '.').trim());
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
