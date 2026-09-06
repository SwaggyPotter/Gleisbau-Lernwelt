import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFORTSCHRITT_ROUTES } from './lernfortschritt.routes';
import { LernfortschrittPage } from './pages/lernfortschritt.page';

@NgModule({
  declarations: [LernfortschrittPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFORTSCHRITT_ROUTES),
  ],
})
export class LernfortschrittModule {}
