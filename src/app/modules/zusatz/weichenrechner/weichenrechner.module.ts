import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { WEICHENRECHNER_ROUTES } from './weichenrechner.routes';
import { WeichenrechnerPage } from './pages/weichenrechner.page';

@NgModule({
  declarations: [WeichenrechnerPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(WEICHENRECHNER_ROUTES),
  ],
})
export class WeichenrechnerModule {}
