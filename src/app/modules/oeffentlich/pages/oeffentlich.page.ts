import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  QuizTile,
  RECHENTRAINER_TILES,
  SPIELE_TILES,
  WISSENSTEST_TILES,
  GLEISBAU_LERNFELD_TILES,
  BAUBERUFE_TILES,
} from '../../../shared/katalog';
import { hasStoredSiteAuth } from '../../../core/site-gate/site-gate.component';
import { SiteGateStateService } from '../../../core/site-gate/site-gate-state.service';

/**
 * IDs der Inhalte, die offiziell fuer den Zugriff ohne Login freigegeben
 * sind. Neuen Inhalt oeffentlich machen: id hier eintragen UND in
 * app-routing.module.ts die zugehoerige Route mit `data: { oeffentlich: true }`
 * versehen (sonst wirft der SiteGateGuard nicht eingeloggte Besucher zurueck).
 */
const OEFFENTLICH_FREIGEGEBENE_IDS: readonly string[] = ['spiel-nivellierlatte'];

@Component({
  selector: 'app-oeffentlich',
  templateUrl: './oeffentlich.page.html',
  styleUrls: ['./oeffentlich.page.scss'],
  standalone: false,
})
export class OeffentlichPage {
  readonly istAngemeldet = hasStoredSiteAuth();

  readonly inhalte: QuizTile[] = [
    ...RECHENTRAINER_TILES,
    ...SPIELE_TILES,
    ...WISSENSTEST_TILES,
    ...GLEISBAU_LERNFELD_TILES,
    ...BAUBERUFE_TILES,
  ].filter(tile => OEFFENTLICH_FREIGEGEBENE_IDS.includes(tile.id));

  constructor(
    private readonly router: Router,
    private readonly siteGateState: SiteGateStateService,
  ) {}

  zumLogin(): void {
    this.siteGateState.disablePublicMode();
    this.router.navigateByUrl('/');
  }
}
