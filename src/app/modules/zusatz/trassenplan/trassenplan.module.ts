import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TRASSENPLAN_ROUTES } from './trassenplan.routes';
import { TrassenplanPage } from './pages/trassenplan.page';
import { TrassenplanZuordnenComponent } from './components/zuordnen.component';
import { ThemenquizEngineModule } from '../../themenquiz/components/themenquiz-engine.module';

@NgModule({
  declarations: [TrassenplanPage, TrassenplanZuordnenComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ThemenquizEngineModule,
    RouterModule.forChild(TRASSENPLAN_ROUTES),
  ],
})
export class TrassenplanModule {}
