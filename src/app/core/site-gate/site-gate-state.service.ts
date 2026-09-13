import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Haelt fest, ob der Besucher gerade den oeffentlichen Bereich ansieht (ohne
 * Login). Getrennt vom eigentlichen Login-Status (hasStoredSiteAuth), damit
 * AppComponent und SiteGateComponent nicht direkt voneinander wissen muessen.
 */
@Injectable({ providedIn: 'root' })
export class SiteGateStateService {
  private readonly _publicMode = new BehaviorSubject<boolean>(false);
  readonly publicMode$ = this._publicMode.asObservable();

  enablePublicMode(): void {
    this._publicMode.next(true);
  }

  disablePublicMode(): void {
    this._publicMode.next(false);
  }
}
