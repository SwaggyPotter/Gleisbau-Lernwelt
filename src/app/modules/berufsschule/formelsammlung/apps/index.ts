import { MiniAppDef } from '../kern/typen';
import { PFEILHOEHE_APP } from './app01-pfeilhoehe';
import { KREISBOGEN_APP } from './app02-kreisbogen';
import { UEBERGANGSBOGEN_APP } from './app03-uebergangsbogen';
import { AUSRUNDUNG_APP } from './app04-ausrundung';
import { GLEISVERZIEHUNG_APP } from './app05-gleisverziehung';
import { TEMPERATUR_APP } from './app06-temperatur';
import { ATMEND_APP } from './app07-atmend';
import { FAHRZEUGKRAEFTE_APP } from './app08-fahrzeugkraefte';
import { QUERBESCHLEUNIGUNG_APP } from './app09-querbeschleunigung';
import { WEICHEN_APP } from './app10-weichen';
import { UEBERHOEHUNG_APP } from './app11-ueberhoehung';
import { RAMPEN_APP } from './app12-rampen';
import { RAMPENVERLAUF_APP } from './app13-rampenverlauf';
import { KRUEMMUNG_APP } from './app14-kruemmung';
import { UEBERGANGSLAENGE_APP } from './app15-uebergangslaenge';
import { ZWEIGGLEIS_APP } from './app16-zweiggleis';
import { RAMPENVOLUMEN_APP } from './app17-rampenvolumen';

/**
 * Alle Mini-Apps der Formelsammlung (Reihenfolge = Nummer in formelsammlung.json).
 * Seit 2026-11-09 sind alle 17 Apps gebaut (Tim: „alles als einzelne App rein“).
 * Formeln mit status "unklar" erscheinen nur im Erklären-Modus, nie in Aufgaben.
 */
export const MINI_APPS: MiniAppDef[] = [
  PFEILHOEHE_APP, KREISBOGEN_APP, UEBERGANGSBOGEN_APP, AUSRUNDUNG_APP, GLEISVERZIEHUNG_APP, TEMPERATUR_APP,
  ATMEND_APP, FAHRZEUGKRAEFTE_APP, QUERBESCHLEUNIGUNG_APP, WEICHEN_APP, UEBERHOEHUNG_APP, RAMPEN_APP,
  RAMPENVERLAUF_APP, KRUEMMUNG_APP, UEBERGANGSLAENGE_APP, ZWEIGGLEIS_APP, RAMPENVOLUMEN_APP,
];

export function miniApp(id: string): MiniAppDef | undefined {
  return MINI_APPS.find(a => a.id === id);
}

/** Skizzen-Varianten einer App mit Beschriftung (Erklären-Modus und Formel-Leiste am Schmierblatt). */
export function skizzenVarianten(app: MiniAppDef): { variante: string; titel: string }[] {
  if (app.skizze === 'pfeilhoehe') return [{ variante: 'mitte', titel: 'Messpunkt in der Mitte' }, { variante: 'ab', titel: 'Messpunkt beliebig (a, b)' }];
  if (app.skizze === 'schienendehnung') return [{ variante: 'dehnung', titel: 'Längenänderung' }, { variante: 'luecke', titel: 'Lückenschluss' }];
  if (app.skizze === 'ausrundung') return [{ variante: 'kuppe', titel: 'Kuppe' }, { variante: 'wanne', titel: 'Wanne' }];
  return [{ variante: '', titel: 'Skizze' }];
}
