import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SCHIENENRATEN_ROUTES } from './schienenraten.routes';
import { SchienenratenPage } from './pages/schienenraten.page';

@NgModule({
  declarations: [SchienenratenPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(SCHIENENRATEN_ROUTES),
  ],
})
export class SchienenratenModule {}