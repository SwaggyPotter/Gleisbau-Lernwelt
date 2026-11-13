import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuswahlAufgabe } from '../../../berufsschule/formelsammlung/kern/typen';
import { FORMEL_TEX, LEGENDE, SCHIENENDEHNUNG_APP } from '../services/dehnung-app';
import { SchienendehnungDataService } from '../services/schienendehnung-data.service';

type Ansicht = 'rechnen' | 'quiz';
type Variante = 'dehnung' | 'luecke';

/** Leere „Aufgabe“ für die Rechenfläche im Rechnen-Modus (keine festen Werte oben auf dem Blatt). */
const LEERES_BLATT: AuswahlAufgabe = {
  id: 'schienendehnung-rechnen', appId: SCHIENENDEHNUNG_APP.id, formelId: 'dl-temperatur', modus: 'ueben', stufe: 1,
  gegeben: [], frage: '', tipp: '', formelLatex: '', schritte: [], art: 'auswahl', optionen: [], richtig: 0,
};

/**
 * Schienenausdehnungs-Rechner (Umbau 2026-11-11):
 *  - Rechnen: Skizze mit Legende (was ist was), Formel, Rechner mit Rechenweg – daneben die Rechenfläche
 *  - Quiz:    Aufgaben in 3 Stufen, Lösung eingeben, Schmierblatt und Taschenrechner zum Aufklappen
 * Bausteine und Styles kommen aus der Formelsammlung (FormelKomponentenModule, formelsammlung.scss).
 */
@Component({
  selector: 'app-schienendehnung',
  templateUrl: './schienendehnung.page.html',
  styleUrls: ['../../../berufsschule/formelsammlung/formelsammlung.scss', './schienendehnung.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SchienendehnungPage {
  readonly app = SCHIENENDEHNUNG_APP;
  readonly leeresBlatt = LEERES_BLATT;
  ansicht: Ansicht = 'rechnen';
  variante: Variante = SCHIENENDEHNUNG_APP.rechner[0].id as Variante;

  constructor(
    route: ActivatedRoute,
    private readonly router: Router,
    private readonly data: SchienendehnungDataService,
  ) {
    route.queryParamMap.subscribe(q => { this.ansicht = q.get('modus') === 'quiz' ? 'quiz' : 'rechnen'; });
  }

  get legende() { return LEGENDE[this.variante]; }
  get formelTex(): string { return FORMEL_TEX[this.variante]; }
  get varianteTitel(): string {
    return this.variante === 'luecke' ? 'Lückenschluss am Schienenstoß' : 'Längenänderung durch Temperatur';
  }

  ansichtSetzen(a: Ansicht): void {
    this.router.navigate([], { queryParams: { modus: a === 'quiz' ? 'quiz' : null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  varianteGewechselt(id: string): void {
    this.variante = id === 'luecke' ? 'luecke' : 'dehnung';
  }

  /** Quiz-Ergebnis zusätzlich in die bisherige Statistik (Lernfortschritt „zusatz:schienendehnung“). */
  ergebnis(richtig: boolean): void {
    this.data.recordResult(richtig);
  }
}
