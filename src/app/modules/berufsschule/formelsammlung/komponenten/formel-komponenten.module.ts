import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormelComponent } from './formel.component';
import { SkizzeComponent } from './skizze.component';
import { AufgabeComponent } from './aufgabe.component';
import { UebenComponent } from './ueben.component';
import { RechnerComponent } from './rechner.component';
import { PruefungComponent } from './pruefung.component';
import { TaschenrechnerComponent } from './taschenrechner.component';
import { SchmierblattComponent } from './schmierblatt.component';

const KOMPONENTEN = [
  FormelComponent, SkizzeComponent, AufgabeComponent, UebenComponent, RechnerComponent,
  PruefungComponent, TaschenrechnerComponent, SchmierblattComponent,
];

/**
 * Bausteine der Formelsammlung (Skizze, Rechner, Üben, Schmierblatt, Taschenrechner …) als eigenes Modul,
 * damit auch andere Apps sie nutzen können – z. B. der Schienenausdehnungs-Rechner (2026-11-11).
 * Styles: formelsammlung.scss (ViewEncapsulation.None) muss die nutzende Seite einbinden.
 */
@NgModule({
  declarations: KOMPONENTEN,
  imports: [CommonModule, FormsModule],
  exports: KOMPONENTEN,
})
export class FormelKomponentenModule {}
