import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { ModellePage } from './modelle.page';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild([{ path: '', component: ModellePage }])],
  declarations: [ModellePage],
})
export class ModellePageModule {}
