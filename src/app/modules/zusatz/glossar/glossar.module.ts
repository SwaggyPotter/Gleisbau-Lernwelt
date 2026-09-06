import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { GLOSSAR_ROUTES } from './glossar.routes';
import { GlossarPage } from './pages/glossar.page';

@NgModule({
  declarations: [GlossarPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(GLOSSAR_ROUTES),
  ],
})
export class GlossarModule {}
