import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SCHIENENMESSER_ROUTES } from './schienenmesser.routes';
import { SchienenmesserPage } from './pages/schienenmesser.page';

@NgModule({
  declarations: [SchienenmesserPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(SCHIENENMESSER_ROUTES),
  ],
})
export class SchienenmesserModule {}
