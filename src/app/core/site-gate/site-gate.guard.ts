import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { hasStoredSiteAuth } from './site-gate.component';

/**
 * Laesst nur Routen mit `data: { oeffentlich: true }` ohne Login durch.
 * Alles andere geht bei fehlendem Login auf die oeffentliche Uebersicht
 * zurueck -- so kann im "oeffentlich"-Modus nicht per URL in den
 * loginpflichtigen Teil der App gewechselt werden.
 */
export const siteGateGuard: CanActivateChildFn = (childRoute) => {
  if (childRoute.data?.['oeffentlich'] === true || hasStoredSiteAuth()) {
    return true;
  }
  return inject(Router).createUrlTree(['/oeffentlich']);
};
