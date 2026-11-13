import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { HubPage } from './pages/hub.page';
import { MiniAppPage } from './pages/mini-app.page';
import { FormelKomponentenModule } from './komponenten/formel-komponenten.module';

const ROUTES: Routes = [
  { path: '', component: HubPage, data: { ansicht: 'start' } },
  { path: 'formelquiz', component: HubPage, data: { ansicht: 'finder' } },
  { path: 'formelfinder', redirectTo: 'formelquiz', pathMatch: 'full' }, // alter Name (bis 2026-11-12)
  { path: 'pruefung', component: HubPage, data: { ansicht: 'pruefung' } },
  { path: 'nachschlagen', component: HubPage, data: { ansicht: 'nachschlagen' } },
  { path: ':appId', component: MiniAppPage },
];

/** Berufsschule – Formelsammlung lernen: Hub + eine Übungs-App pro Themengebiet. */
@NgModule({
  declarations: [HubPage, MiniAppPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(ROUTES), FormelKomponentenModule],
})
export class FormelsammlungModule {}
