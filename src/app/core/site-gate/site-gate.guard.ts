import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { gastZugangBis, hasStoredSiteAuth } from './site-gate.component';
import { gastFreigegebeneLinks } from '../app-status/app-status.service';
import { alleAppTiles } from '../../shared/katalog';

/** Bereiche, die Gäste neben den freigegebenen Apps öffnen dürfen (Startseite, Konto, Postfach, Nachweise). */
const GAST_ERLAUBT = ['/dashboard', '/oeffentlich', '/konto/profil', '/konto/anmelden', '/postfach', '/bildnachweise', '/quellenverzeichnis', '/rechte'];

function passt(pfad: string, p: string): boolean {
  return pfad === p || pfad.startsWith(p + '/');
}

function gastDarf(url: string): boolean {
  const pfad = url.split(/[?#]/)[0];
  if (pfad === '/' || GAST_ERLAUBT.some(p => passt(pfad, p))) return true;
  // Die genaueste passende Kachel entscheidet: Ist der Formelsammlung-Hub frei, eine Themen-App
  // darunter aber nicht, bleibt die Themen-App gesperrt (einzeln freigebbar seit 2026-11-11).
  const frei = new Set(gastFreigegebeneLinks());
  const treffer = alleAppTiles().map(t => t.link).filter(l => passt(pfad, l)).sort((a, b) => b.length - a.length)[0];
  return !!treffer && frei.has(treffer);
}

/**
 * Laesst nur Routen mit `data: { oeffentlich: true }` ohne Login durch.
 * Alles andere geht bei fehlendem Login auf die oeffentliche Uebersicht
 * zurueck -- so kann im "oeffentlich"-Modus nicht per URL in den
 * loginpflichtigen Teil der App gewechselt werden.
 */
export const siteGateGuard: CanActivateChildFn = (childRoute, state) => {
  if (childRoute.data?.['oeffentlich'] === true) return true;
  if (hasStoredSiteAuth()) {
    // Gäste dürfen nur die freigegebenen Apps öffnen (Tim, 2026-11-06)
    if (gastZugangBis() && !gastDarf(state.url)) return inject(Router).createUrlTree(['/dashboard']);
    return true;
  }
  return inject(Router).createUrlTree(['/oeffentlich']);
};
