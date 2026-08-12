import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NIVELLIERLATTE_ROUTES } from './nivellierlatte.routes';
import { NivellierlattePage } from './pages/nivellierlatte.page';

@NgModule({
  declarations: [NivellierlattePage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(NIVELLIERLATTE_ROUTES),
  ],
})
export class NivellierlatteModule {}
