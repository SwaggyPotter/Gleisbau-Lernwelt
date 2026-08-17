import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { KATEGORIE_ROUTES } from './kategorie.routes';
import { KategoriePage } from './pages/kategorie.page';

@NgModule({
  declarations: [KategoriePage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(KATEGORIE_ROUTES),
  ],
})
export class KategorieModule {}