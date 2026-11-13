import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { THEMENQUIZ_ROUTES } from './themenquiz.routes';
import { ThemenquizPage } from './pages/themenquiz.page';
import { ThemenquizEngineModule } from './components/themenquiz-engine.module';

@NgModule({
  declarations: [ThemenquizPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ThemenquizEngineModule,
    RouterModule.forChild(THEMENQUIZ_ROUTES),
  ],
})
export class ThemenquizModule {}
