import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { BahnspielAssetsPage } from './bahnspiel-assets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: BahnspielAssetsPage }]),
  ],
  declarations: [BahnspielAssetsPage],
})
export class BahnspielAssetsPageModule {}
