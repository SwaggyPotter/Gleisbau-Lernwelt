import { AufgabenModus } from './typen';

/**
 * Fortschritt der Formelsammlung-Apps im localStorage (pro Gerät).
 * Jeder Zugriff ist in try/catch, damit die Seite auch ohne Speicher funktioniert
 * (privates Fenster, gesperrte Website-Daten).
 */

const KEY = 'glw-formelsammlung-v1';

export interface ModusZaehler { richtig: number; gesamt: number }

export interface AppFortschritt {
  modi: Record<AufgabenModus, ModusZaehler>;
  serie: number;
  bestSerie: number;
  /** Bestes Prüfungsergebnis in Prozent (−1 = noch keine Prüfung). */
  pruefungBest: number;
}

export interface Fortschritt {
  apps: Record<string, AppFortschritt>;
  finder: ModusZaehler;
  gemischtBest: number;
}

function leerApp(): AppFortschritt {
  return {
    modi: { ueben: { richtig: 0, gesamt: 0 }, umstellen: { richtig: 0, gesamt: 0 }, einheiten: { richtig: 0, gesamt: 0 } },
    serie: 0,
    bestSerie: 0,
    pruefungBest: -1,
  };
}

function leer(): Fortschritt {
  return { apps: {}, finder: { richtig: 0, gesamt: 0 }, gemischtBest: -1 };
}

/** Speicher-Schnittstelle (im Browser localStorage, in Tests ein Objekt). */
export interface Speicher {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function standardSpeicher(): Speicher | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export class FortschrittSpeicher {
  private daten: Fortschritt;

  constructor(private readonly speicher: Speicher | null = standardSpeicher()) {
    this.daten = this.laden();
  }

  private laden(): Fortschritt {
    try {
      const raw = this.speicher?.getItem(KEY);
      if (!raw) return leer();
      const d = JSON.parse(raw) as Partial<Fortschritt>;
      const f = leer();
      f.finder = d.finder ?? f.finder;
      f.gemischtBest = typeof d.gemischtBest === 'number' ? d.gemischtBest : -1;
      for (const [id, a] of Object.entries(d.apps ?? {})) {
        const basis = leerApp();
        f.apps[id] = { ...basis, ...a, modi: { ...basis.modi, ...(a?.modi ?? {}) } };
      }
      return f;
    } catch {
      return leer();
    }
  }

  private speichern(): void {
    try {
      this.speicher?.setItem(KEY, JSON.stringify(this.daten));
    } catch {
      /* Speicher voll/gesperrt – Fortschritt gilt dann nur für diese Sitzung. */
    }
  }

  app(id: string): AppFortschritt {
    return this.daten.apps[id] ?? leerApp();
  }

  get finder(): ModusZaehler {
    return this.daten.finder;
  }

  get gemischtBest(): number {
    return this.daten.gemischtBest;
  }

  ergebnis(appId: string, modus: AufgabenModus, richtig: boolean): AppFortschritt {
    const a = this.daten.apps[appId] ?? leerApp();
    a.modi[modus].gesamt += 1;
    if (richtig) {
      a.modi[modus].richtig += 1;
      a.serie += 1;
      a.bestSerie = Math.max(a.bestSerie, a.serie);
    } else {
      a.serie = 0;
    }
    this.daten.apps[appId] = a;
    this.speichern();
    return a;
  }

  pruefung(appId: string, prozent: number): void {
    const a = this.daten.apps[appId] ?? leerApp();
    a.pruefungBest = Math.max(a.pruefungBest, prozent);
    this.daten.apps[appId] = a;
    this.speichern();
  }

  finderErgebnis(richtig: boolean): void {
    this.daten.finder.gesamt += 1;
    if (richtig) this.daten.finder.richtig += 1;
    this.speichern();
  }

  gemischt(prozent: number): void {
    this.daten.gemischtBest = Math.max(this.daten.gemischtBest, prozent);
    this.speichern();
  }
}

/**
 * Sterne einer App (0–3):
 * ★ 5 richtige Aufgaben im Üben-Modus
 * ★★ zusätzlich je 3 richtige in „Umstellen“ und „Einheiten-Falle“
 * ★★★ zusätzlich Prüfungsmodus mit mindestens 80 %
 */
export function sterne(a: AppFortschritt): number {
  if (a.modi.ueben.richtig < 5) return 0;
  if (a.modi.umstellen.richtig < 3 || a.modi.einheiten.richtig < 3) return 1;
  if (a.pruefungBest < 80) return 2;
  return 3;
}

/** Fortschritt 0–1 für den Balken auf der Kachel (gleitend bis zu den Sterne-Schwellen). */
export function fortschrittAnteil(a: AppFortschritt): number {
  const teile = [
    Math.min(a.modi.ueben.richtig / 5, 1),
    Math.min(a.modi.umstellen.richtig / 3, 1),
    Math.min(a.modi.einheiten.richtig / 3, 1),
    a.pruefungBest >= 80 ? 1 : Math.max(a.pruefungBest, 0) / 80 * 0.9,
  ];
  return teile.reduce((s, t) => s + t, 0) / teile.length;
}
