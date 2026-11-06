import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { gastZugangBis, hasStoredSiteAuth } from './site-gate.component';
import { gastFreigegebeneLinks } from '../app-status/app-status.service';

/** Bereiche, die Gäste neben den freigegebenen Apps öffnen dürfen (Startseite, Konto, Nachweise). */
const GAST_ERLAUBT = ['/dashboard', '/oeffentlich', '/konto/profil', '/konto/anmelden', '/bildnachweise', '/quellenverzeichnis', '/rechte'];

function gastDarf(url: string): boolean {
  const pfad = url.split(/[?#]/)[0];
  const erlaubt = [...GAST_ERLAUBT, ...gastFreigegebeneLinks()];
  return pfad === '/' || erlaubt.some(p => pfad === p || pfad.startsWith(p + '/'));
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
