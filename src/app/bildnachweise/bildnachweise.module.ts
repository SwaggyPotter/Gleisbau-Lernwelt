import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { BildnachweisePageRoutingModule } from './bildnachweise-routing.module';
import { BildnachweisePage } from './bildnachweise.page';

@NgModule({
  imports: [CommonModule, IonicModule, BildnachweisePageRoutingModule],
  declarations: [BildnachweisePage],
})
export class BildnachweisePageModule {}
