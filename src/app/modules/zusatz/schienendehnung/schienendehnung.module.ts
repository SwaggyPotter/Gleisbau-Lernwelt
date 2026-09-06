import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SCHIENENDEHNUNG_ROUTES } from './schienendehnung.routes';
import { SchienendehnungPage } from './pages/schienendehnung.page';

@NgModule({
  declarations: [SchienendehnungPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(SCHIENENDEHNUNG_ROUTES),
  ],
})
export class SchienendehnungModule {}
