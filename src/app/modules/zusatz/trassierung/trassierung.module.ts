import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TRASSIERUNG_ROUTES } from './trassierung.routes';
import { TrassierungPage } from './pages/trassierung.page';

@NgModule({
  declarations: [TrassierungPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(TRASSIERUNG_ROUTES),
  ],
})
export class TrassierungModule {}
