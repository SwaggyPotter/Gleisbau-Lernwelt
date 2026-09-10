import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';
import { SkinPickerModule } from '../shared/skin-picker/skin-picker.module';

@NgModule({
  imports: [CommonModule, IonicModule, DashboardPageRoutingModule, SkinPickerModule],
  declarations: [DashboardPage],
})
export class DashboardPageModule {}
