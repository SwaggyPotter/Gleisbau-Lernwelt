import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { RechtePageRoutingModule } from './rechte-routing.module';
import { RechtePage } from './rechte.page';

@NgModule({
  imports: [CommonModule, IonicModule, RechtePageRoutingModule],
  declarations: [RechtePage],
})
export class RechtePageModule {}
