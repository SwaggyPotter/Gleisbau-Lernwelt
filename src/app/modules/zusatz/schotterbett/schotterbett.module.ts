import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SCHOTTERBETT_ROUTES } from './schotterbett.routes';
import { SchotterbettPage } from './pages/schotterbett.page';
import { SchotterberechnungPage } from './pages/schotterberechnung.page';

@NgModule({
  declarations: [SchotterbettPage, SchotterberechnungPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(SCHOTTERBETT_ROUTES),
  ],
})
export class SchotterbettModule {}
