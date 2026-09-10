import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SkinId, SkinInfo } from './theme.models';

const STORAGE_KEY = 'glw-skin';

/**
 * Alle Farb-Tokens werden ueberall im Code als `var(--skin-x, #hardcodierter-standard)`
 * referenziert (siehe theme-vars-Mixins/Bloecke). Ist hier nichts gesetzt, gilt exakt das
 * bisherige Aussehen -- ein Skin ueberschreibt also nur optional, bricht nie etwas.
 */
type Palette = Partial<{
  accent: string; accent2: string; bg: string; surface: string; surface2: string;
  success: string; danger: string; text: string; textMuted: string; border: string;
}>;

const PLAYFUL: Palette = {
  accent: '#ff4d8f',
  accent2: '#22d3c7',
  success: '#7ee08a',
  danger: '#ff6b6b',
};

const NEON: Palette = {
  bg: '#0a0118', surface: '#170b2e', surface2: '#231044',
  accent: '#ff2ec4', accent2: '#00f0ff', success: '#39ff6a', danger: '#ff3860',
};

const GOLD: Palette = {
  bg: '#0d0b08', surface: '#1a1611', surface2: '#241d15',
  accent: '#d4af37', accent2: '#f2d675', success: '#8fbf6e', danger: '#c9584a',
};

const WALD: Palette = {
  bg: '#0a140f', surface: '#132219', surface2: '#1c3325',
  accent: '#5fbf6e', accent2: '#8fd9a8', success: '#6fbf73', danger: '#d9714e',
};

const OZEAN: Palette = {
  bg: '#031d24', surface: '#0a2e38', surface2: '#0f3f4c',
  accent: '#22d3ee', accent2: '#0891b2', success: '#5fd9a0', danger: '#ff7a6b',
};

const FRUEHLING: Palette = { accent: '#7ed957', accent2: '#5ec8d8' };
const SOMMER: Palette = { accent: '#ffce3d', accent2: '#3fc1e0' };
const HERBST: Palette = { accent: '#e07a2f', accent2: '#b5651d' };
const WINTER: Palette = { accent: '#8fd3f4', accent2: '#b8c4d9' };

function saisonPalette(): Palette {
  const monat = new Date().getMonth(); // 0 = Januar
  if ([2, 3, 4].includes(monat)) return FRUEHLING;
  if ([5, 6, 7].includes(monat)) return SOMMER;
  if ([8, 9, 10].includes(monat)) return HERBST;
  return WINTER;
}

function saisonLabel(): string {
  const monat = new Date().getMonth();
  if ([2, 3, 4].includes(monat)) return 'Frühling';
  if ([5, 6, 7].includes(monat)) return 'Sommer';
  if ([8, 9, 10].includes(monat)) return 'Herbst';
  return 'Winter';
}

const PALETTEN: Partial<Record<SkinId, Palette>> = {
  playful: PLAYFUL,
  neon: NEON,
  gold: GOLD,
  wald: WALD,
  ozean: OZEAN,
};

export function SKINS_AKTUELL(): SkinInfo[] {
  const saison = saisonPalette();
  return [
    { id: 'standard', label: 'Standard', beschreibung: 'Das gewohnte Blaupausen-Design.', vorschauAccent: '#ff8a3d', vorschauAccent2: '#6fa8dc', vorschauBg: '#0f1b24' },
    { id: 'playful', label: 'Verspielt', beschreibung: 'Kräftigere, bunte Akzentfarben.', vorschauAccent: PLAYFUL.accent!, vorschauAccent2: PLAYFUL.accent2!, vorschauBg: '#0f1b24' },
    { id: 'season', label: `Jahreszeit (${saisonLabel()})`, beschreibung: 'Ändert sich automatisch mit der Jahreszeit.', vorschauAccent: saison.accent!, vorschauAccent2: saison.accent2!, vorschauBg: '#0f1b24' },
    { id: 'neon', label: 'Neon', beschreibung: 'Knalliges Cyberpunk-Lila mit Neon-Pink und -Cyan.', vorschauAccent: NEON.accent!, vorschauAccent2: NEON.accent2!, vorschauBg: NEON.bg!, freischaltungAchievement: 'streak-25', freischaltungLabel: 'Serientäter (25er-Serie)' },
    { id: 'gold', label: 'Gold', beschreibung: 'Edles Schwarz-Gold, für die Vitrine.', vorschauAccent: GOLD.accent!, vorschauAccent2: GOLD.accent2!, vorschauBg: GOLD.bg!, freischaltungAchievement: 'hundert-richtig', freischaltungLabel: 'Hundertschaft (100 richtig)' },
    { id: 'wald', label: 'Wald', beschreibung: 'Tiefes Waldgrün, ruhig und erdig.', vorschauAccent: WALD.accent!, vorschauAccent2: WALD.accent2!, vorschauBg: WALD.bg!, freischaltungAchievement: 'alle-rechentrainer', freischaltungLabel: 'Allrounder (alle Rechentrainer)' },
    { id: 'ozean', label: 'Ozean', beschreibung: 'Tiefes Blaugrün wie im offenen Meer.', vorschauAccent: OZEAN.accent!, vorschauAccent2: OZEAN.accent2!, vorschauBg: OZEAN.bg!, freischaltungAchievement: 'pruefung-bestanden', freischaltungLabel: 'Bestanden (Prüfungssimulation)' },
  ];
}

/** @deprecated Verwende SKINS_AKTUELL() -- als Konstante gehalten, damit bestehende Importe nicht brechen. */
export const SKINS: SkinInfo[] = SKINS_AKTUELL();

const TOKEN_MAP: Record<keyof Palette, string> = {
  accent: '--skin-accent',
  accent2: '--skin-accent-2',
  bg: '--skin-bg',
  surface: '--skin-surface',
  surface2: '--skin-surface-2',
  success: '--skin-success',
  danger: '--skin-danger',
  text: '--skin-text',
  textMuted: '--skin-text-muted',
  border: '--skin-border',
};
const ALLE_TOKENS = Object.values(TOKEN_MAP);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly skinSubject = new BehaviorSubject<SkinId>(this.geladenerSkin());
  readonly skin$ = this.skinSubject.asObservable();

  init(): void {
    this.anwenden(this.skinSubject.value);
  }

  get aktuellerSkin(): SkinId {
    return this.skinSubject.value;
  }

  waehle(skin: SkinId): void {
    this.skinSubject.next(skin);
    this.anwenden(skin);
    try {
      localStorage.setItem(STORAGE_KEY, skin);
    } catch {
      // localStorage nicht verfuegbar -- Wahl gilt dann nur fuer diese Sitzung
    }
  }

  private anwenden(skin: SkinId): void {
    const root = document.documentElement.style;
    for (const token of ALLE_TOKENS) root.removeProperty(token);

    const palette = skin === 'season' ? saisonPalette() : PALETTEN[skin] ?? {};
    for (const [key, wert] of Object.entries(palette)) {
      if (wert) root.setProperty(TOKEN_MAP[key as keyof Palette], wert);
    }
  }

  private geladenerSkin(): SkinId {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const gueltig: SkinId[] = ['standard', 'playful', 'season', 'neon', 'gold', 'wald', 'ozean'];
      if (gueltig.includes(raw as SkinId)) return raw as SkinId;
    } catch {
      // ignorieren
    }
    return 'standard';
  }
}
