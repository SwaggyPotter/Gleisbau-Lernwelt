import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MATERIALRECHNER_ROUTES } from './materialrechner.routes';
import { MaterialrechnerPage } from './pages/materialrechner.page';

@NgModule({
  declarations: [MaterialrechnerPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(MATERIALRECHNER_ROUTES),
  ],
})
export class MaterialrechnerModule {}
