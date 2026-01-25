import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FieldDetailPageRoutingModule } from './field-detail-routing.module';
import { FieldDetailPage } from './field-detail.page';

@NgModule({
  imports: [CommonModule, IonicModule, FieldDetailPageRoutingModule],
  declarations: [FieldDetailPage],
})
export class FieldDetailPageModule {}
