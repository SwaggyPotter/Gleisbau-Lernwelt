import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OEFFENTLICH_ROUTES } from './oeffentlich.routes';
import { OeffentlichPage } from './pages/oeffentlich.page';

@NgModule({
  declarations: [OeffentlichPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(OEFFENTLICH_ROUTES),
  ],
})
export class OeffentlichModule {}
