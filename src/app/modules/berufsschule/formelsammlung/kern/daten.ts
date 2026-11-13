import roh from '../data/formelsammlung.json';

export interface FormelVariable {
  symbol: string;
  name: string;
  einheit: string;
  bereich: number[];
}

export interface Formel {
  id: string;
  app: string;
  kapitel: string;
  titel: string;
  latex: string;
  variablen: FormelVariable[];
  grenzen: string[];
  hinweis: string;
  status?: string;
  unklar?: string;
}

export interface AppMeta {
  id: string;
  nr: number;
  titel: string;
  kapitel: string;
  kurz: string;
  icon: string;
}

export interface Kapitel {
  id: string;
  titel: string;
}

interface Daten {
  version: number;
  stand: string;
  quelle: string;
  kapitel: Kapitel[];
  apps: AppMeta[];
  formeln: Formel[];
  profile: { name: string; flaeche: number; fProKelvin?: number; status?: string }[];
  unklar: { app: string; text: string }[];
}

export const FORMELSAMMLUNG = roh as Daten;

const FORMEL_INDEX = new Map(FORMELSAMMLUNG.formeln.map(f => [f.id, f]));

export function formel(id: string): Formel {
  const f = FORMEL_INDEX.get(id);
  if (!f) throw new Error(`Formel ${id} fehlt in formelsammlung.json`);
  return f;
}

export function appMeta(id: string): AppMeta | undefined {
  return FORMELSAMMLUNG.apps.find(a => a.id === id);
}

export function kapitelTitel(id: string): string {
  return FORMELSAMMLUNG.kapitel.find(k => k.id === id)?.titel ?? id;
}
