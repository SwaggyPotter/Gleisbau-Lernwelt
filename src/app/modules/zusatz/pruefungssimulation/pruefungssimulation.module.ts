import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PRUEFUNGSSIMULATION_ROUTES } from './pruefungssimulation.routes';
import { PruefungssimulationPage } from './pages/pruefungssimulation.page';

@NgModule({
  declarations: [PruefungssimulationPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(PRUEFUNGSSIMULATION_ROUTES),
  ],
})
export class PruefungssimulationModule {}
