import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SkinId, SkinInfo } from './theme.models';

const STORAGE_KEY = 'glw-skin';
const STORAGE_BG_KEY = 'glw-skin-bg';
const STORAGE_TEXT_KEY = 'glw-skin-text';

/** Ur-Standardwerte des Streckenplan-Systems (src/theme/variables.scss), falls ein Skin sie nicht ueberschreibt. */
const BASIS_BG = '#0f1b24';
const BASIS_TEXT = '#eaf2f5';

/**
 * Alle Farb-/Schrift-/Form-Tokens werden ueberall im Code als
 * `var(--skin-x, #hardcodierter-standard)` referenziert (siehe theme-vars-Mixins/Bloecke).
 * Ist hier nichts gesetzt, gilt exakt das bisherige Aussehen -- ein Skin ueberschreibt also
 * nur optional, bricht nie etwas.
 */
type Palette = Partial<{
  accent: string; accent2: string; bg: string; surface: string; surface2: string;
  success: string; danger: string; text: string; textMuted: string; border: string;
  borderStrong: string; onPrimary: string; radius: string; shadow: string;
  fontDisplay: string; fontBody: string; fontMono: string;
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

/**
 * Die 10 "grossen" Designs aus der Referenzvorlage
 * (design-reference/gleisbau-designvorschau.html, 2026-09-23). Hex-Werte, Radien,
 * Schatten und Schriftfamilien 1:1 aus der Referenz uebernommen (dort --bg/--surface/
 * --primary/--accent/--ok/--bad/--border/--radius/--shadow/--fh/--fb/--fm je Theme-Block).
 * Wo die Referenz keinen zweiten Oberflaechen-Ton (surface2) vorgibt, ist er als
 * naheliegende Zwischenstufe zwischen bg und surface abgeleitet -- das ist reine
 * Gestaltung, keine aus der Referenz uebernommene Angabe.
 */
const SIGNALWERK: Palette = {
  bg: '#14171A', surface: '#1E2328', surface2: '#262c31',
  text: '#E8ECEF', textMuted: '#9AA4AD', border: '#343B42', borderStrong: '#4a545e',
  accent: '#22C55E', accent2: '#FACC15', success: '#22C55E', danger: '#EF4444',
  onPrimary: '#06180c', radius: '10px', shadow: 'none',
  fontDisplay: '"Barlow Condensed"', fontBody: '"Inter"', fontMono: '"JetBrains Mono"',
};

const BAUSTELLE: Palette = {
  bg: '#F4F1EA', surface: '#FFFFFF', surface2: '#EFEAE0',
  text: '#1A1A1A', textMuted: '#55554f', border: '#1A1A1A', borderStrong: '#1A1A1A',
  accent: '#FF6A13', accent2: '#1A1A1A', success: '#1f9d55', danger: '#d62828',
  onPrimary: '#1A1A1A', radius: '3px', shadow: '5px 5px 0 #1A1A1A',
  fontDisplay: '"Oswald"', fontBody: '"Source Sans 3"', fontMono: '"JetBrains Mono"',
};

const BLAUPAUSE: Palette = {
  bg: '#0B3A66', surface: 'rgba(15,76,129,.85)', surface2: '#0F4C81',
  text: '#E6F0FA', textMuted: '#a9c6e3', border: 'rgba(230,240,250,.45)', borderStrong: 'rgba(230,240,250,.8)',
  accent: '#FDE68A', accent2: '#7DD3FC', success: '#86efac', danger: '#fca5a5',
  onPrimary: '#0B3A66', radius: '0px', shadow: 'none',
  fontDisplay: '"IBM Plex Sans"', fontBody: '"IBM Plex Sans"', fontMono: '"IBM Plex Mono"',
};

const BAHN_CLEAN: Palette = {
  bg: '#FFFFFF', surface: '#F0F3F5', surface2: '#E4E8EB',
  text: '#282D37', textMuted: '#646973', border: '#D7DCE1', borderStrong: '#282D37',
  accent: '#D4001A', accent2: '#1455C0', success: '#408335', danger: '#D4001A',
  onPrimary: '#ffffff', radius: '8px', shadow: 'none',
  fontDisplay: '"Source Sans 3"', fontBody: '"Source Sans 3"', fontMono: '"Roboto Mono"',
};

const NACHTSCHICHT: Palette = {
  bg: '#0A0C10', surface: '#151922', surface2: '#1c212c',
  text: '#FFF4D6', textMuted: '#8b93a1', border: '#262c38', borderStrong: '#3a4152',
  accent: '#FF7A1A', accent2: '#C7D2DA', success: '#7ee08a', danger: '#ff5a5a',
  onPrimary: '#0A0C10', radius: '6px', shadow: 'none',
  fontDisplay: '"Barlow"', fontBody: '"Barlow"', fontMono: '"Space Mono"',
};

const MESSING: Palette = {
  bg: '#2B2B2B', surface: '#3A3A3A', surface2: '#454545',
  text: '#EDE6D6', textMuted: '#b3ab9a', border: '#555555', borderStrong: '#9CA3AF',
  accent: '#B8893B', accent2: '#D9B36C', success: '#6aa84f', danger: '#B91C1C',
  onPrimary: '#2b2112', radius: '4px', shadow: 'none',
  fontDisplay: '"Roboto Condensed"', fontBody: '"Roboto Condensed"', fontMono: '"Roboto Mono"',
};

const BAHNSTEIG: Palette = {
  bg: '#0E1B3D', surface: '#13265A', surface2: '#1a3170',
  text: '#FFFFFF', textMuted: '#b7c3e6', border: '#2a3f7a', borderStrong: '#4a5f9a',
  accent: '#FFD43B', accent2: '#1D4ED8', success: '#4ade80', danger: '#f87171',
  onPrimary: '#0E1B3D', radius: '4px', shadow: 'none',
  fontDisplay: '"VT323"', fontBody: '"Inter"', fontMono: '"VT323"',
};

const STRECKENNETZ: Palette = {
  bg: '#FAFAF7', surface: '#FFFFFF', surface2: '#F0F0EC',
  text: '#111827', textMuted: '#6b7280', border: '#e5e7eb', borderStrong: '#111827',
  accent: '#16A34A', accent2: '#2563EB', success: '#16A34A', danger: '#E11D48',
  onPrimary: '#ffffff', radius: '16px', shadow: '0 1px 2px rgba(17,24,39,.06)',
  fontDisplay: '"DM Sans"', fontBody: '"DM Sans"', fontMono: '"DM Sans"',
};

const STELLWERK: Palette = {
  bg: '#1F3A2E', surface: '#2A4A3B', surface2: '#345a48',
  text: '#E5E7EB', textMuted: '#a9bfb3', border: '#3d6150', borderStrong: '#D1D5DB',
  accent: '#FDE047', accent2: '#6f8a7c', success: '#FDE047', danger: '#EF4444',
  onPrimary: '#1F3A2E', radius: '3px', shadow: 'none',
  fontDisplay: '"Share Tech Mono"', fontBody: '"Share Tech Mono"', fontMono: '"Share Tech Mono"',
};

const GELBE_FLOTTE: Palette = {
  bg: '#111111', surface: '#1E1E1E', surface2: '#292929',
  text: '#f5f5f5', textMuted: '#a3a3a3', border: '#333333', borderStrong: '#9CA3AF',
  accent: '#FFC400', accent2: '#22D3EE', success: '#4ADE80', danger: '#F43F5E',
  onPrimary: '#111111', radius: '0px', shadow: 'none',
  fontDisplay: '"Press Start 2P"', fontBody: '"Rubik"', fontMono: '"Press Start 2P"',
};

const PALETTEN: Partial<Record<SkinId, Palette>> = {
  playful: PLAYFUL,
  neon: NEON,
  gold: GOLD,
  wald: WALD,
  ozean: OZEAN,
  signalwerk: SIGNALWERK,
  baustelle: BAUSTELLE,
  blaupause: BLAUPAUSE,
  'bahn-clean': BAHN_CLEAN,
  nachtschicht: NACHTSCHICHT,
  messing: MESSING,
  bahnsteig: BAHNSTEIG,
  streckennetz: STRECKENNETZ,
  stellwerk: STELLWERK,
  'gelbe-flotte': GELBE_FLOTTE,
};

export function SKINS_AKTUELL(): SkinInfo[] {
  const saison = saisonPalette();
  return [
    { id: 'signalwerk', label: 'Signalwerk', beschreibung: 'Dunkles Stellwerk-Design, Standard der Lernwelt.', vorschauAccent: SIGNALWERK.accent!, vorschauAccent2: SIGNALWERK.accent2!, vorschauBg: SIGNALWERK.bg! },
    { id: 'baustelle', label: 'Baustelle', beschreibung: 'Warnorange, Signalgelb und harte Kanten.', vorschauAccent: BAUSTELLE.accent!, vorschauAccent2: BAUSTELLE.accent2!, vorschauBg: BAUSTELLE.bg! },
    { id: 'blaupause', label: 'Blaupause', beschreibung: 'Technische Zeichnung mit Raster und Bemaßung.', vorschauAccent: BLAUPAUSE.accent!, vorschauAccent2: BLAUPAUSE.accent2!, vorschauBg: BLAUPAUSE.bg! },
    { id: 'bahn-clean', label: 'Bahn-Clean', beschreibung: 'Weiß, Verkehrsrot und viel Ruhe.', vorschauAccent: BAHN_CLEAN.accent!, vorschauAccent2: BAHN_CLEAN.accent2!, vorschauBg: BAHN_CLEAN.bg! },
    { id: 'nachtschicht', label: 'Nachtschicht', beschreibung: 'Dunkler Modus mit warmem Warnwesten-Orange.', vorschauAccent: NACHTSCHICHT.accent!, vorschauAccent2: NACHTSCHICHT.accent2!, vorschauBg: NACHTSCHICHT.bg! },
    { id: 'messing', label: 'Messing & Stahl', beschreibung: 'Hochwertig und handwerklich, wie ein Messwerkzeug.', vorschauAccent: MESSING.accent!, vorschauAccent2: MESSING.accent2!, vorschauBg: MESSING.bg! },
    { id: 'bahnsteig', label: 'Bahnsteig-Anzeige', beschreibung: 'Blaue Zugzielanzeiger und Fallblatt-Tafeln.', vorschauAccent: BAHNSTEIG.accent!, vorschauAccent2: BAHNSTEIG.accent2!, vorschauBg: BAHNSTEIG.bg! },
    { id: 'streckennetz', label: 'Streckennetz', beschreibung: 'Der Lernpfad als heller Linienplan.', vorschauAccent: STRECKENNETZ.accent!, vorschauAccent2: STRECKENNETZ.accent2!, vorschauBg: STRECKENNETZ.bg! },
    { id: 'stellwerk', label: 'Gleisbildstellwerk', beschreibung: 'Retro-Stelltafel in dunklem Grün.', vorschauAccent: STELLWERK.accent!, vorschauAccent2: STELLWERK.accent2!, vorschauBg: STELLWERK.bg! },
    { id: 'gelbe-flotte', label: 'Gelbe Flotte', beschreibung: 'Arcade-Pixel-Stil für Quiz und Wettbewerbe.', vorschauAccent: GELBE_FLOTTE.accent!, vorschauAccent2: GELBE_FLOTTE.accent2!, vorschauBg: GELBE_FLOTTE.bg! },
    { id: 'standard', label: 'Standard (klassisch)', beschreibung: 'Das ursprüngliche Blaupausen-Design von vor den 10 neuen Designs.', vorschauAccent: '#ff8a3d', vorschauAccent2: '#6fa8dc', vorschauBg: '#0f1b24' },
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
  borderStrong: '--skin-border-strong',
  onPrimary: '--skin-on-primary',
  radius: '--skin-radius',
  shadow: '--skin-shadow',
  fontDisplay: '--skin-font-display',
  fontBody: '--skin-font-body',
  fontMono: '--skin-font-mono',
};
const ALLE_TOKENS = Object.values(TOKEN_MAP);
const ALLE_SKIN_IDS: SkinId[] = [
  'standard', 'playful', 'season', 'neon', 'gold', 'wald', 'ozean',
  'signalwerk', 'baustelle', 'blaupause', 'bahn-clean', 'nachtschicht',
  'messing', 'bahnsteig', 'streckennetz', 'stellwerk', 'gelbe-flotte',
];

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
    const root = document.documentElement;
    for (const token of ALLE_TOKENS) root.style.removeProperty(token);

    const palette = skin === 'season' ? saisonPalette() : PALETTEN[skin] ?? {};
    for (const [key, wert] of Object.entries(palette)) {
      if (wert) root.style.setProperty(TOKEN_MAP[key as keyof Palette], wert);
    }

    root.setAttribute('data-theme', skin);

    // Fuer die Anti-Flacker-Bootstrap in index.html: die tatsaechlich wirksame
    // Grundfarbe/Textfarbe (nach Fallback) separat merken, damit die Seite beim
    // naechsten Laden VOR Angular schon die richtige Farbe zeigen kann.
    try {
      localStorage.setItem(STORAGE_BG_KEY, palette.bg ?? BASIS_BG);
      localStorage.setItem(STORAGE_TEXT_KEY, palette.text ?? BASIS_TEXT);
    } catch {
      // localStorage nicht verfuegbar -- dann bleibt es beim naechsten Laden bei einem kurzen Aufblitzen
    }
  }

  private geladenerSkin(): SkinId {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (ALLE_SKIN_IDS.includes(raw as SkinId)) return raw as SkinId;
    } catch {
      // ignorieren
    }
    return 'signalwerk';
  }
}
