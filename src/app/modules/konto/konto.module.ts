import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ChartModule } from '../../shared/chart/chart.module';
import { KONTO_ROUTES } from './konto.routes';
import { AnmeldenPage } from './pages/anmelden/anmelden.page';
import { RegistrierenPage } from './pages/registrieren/registrieren.page';
import { ProfilPage } from './pages/profil/profil.page';
import { SchluesselPage } from './pages/schluessel/schluessel.page';

@NgModule({
  declarations: [AnmeldenPage, RegistrierenPage, ProfilPage, SchluesselPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChartModule,
    RouterModule.forChild(KONTO_ROUTES),
  ],
})
export class KontoModule {}
