import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { BAUMASCHINEN_ROUTES } from './baumaschinen.routes';
import { BaumaschinenPage } from './pages/baumaschinen.page';

@NgModule({
  declarations: [BaumaschinenPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(BAUMASCHINEN_ROUTES),
  ],
})
export class BaumaschinenModule {}
