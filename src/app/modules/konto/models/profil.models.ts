import { SkinId } from '../../../core/theme/theme.models';

export interface ModulStat {
  moduleKey: string;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  updatedAt: string;
}

export interface StatsUebersicht {
  module: ModulStat[];
  summe: {
    beantwortet: number;
    richtig: number;
    quote: number;
    bestStreakOverall: number;
  };
}

export interface Errungenschaft {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export interface ErrungenschaftFreigeschaltet {
  key: string;
  freigeschaltetAm: string;
}

export interface Einstellungen {
  bevorzugtesLehrjahr: number | null;
  errungenschaftenHinweise: boolean;
  skin: SkinId;
}

export interface RegistrierungsKey {
  key: string;
  year: number;
  fullName: string;
  createdAt: string;
  uses: number;
  maxUses: number;
  issuedBy: string;
}
