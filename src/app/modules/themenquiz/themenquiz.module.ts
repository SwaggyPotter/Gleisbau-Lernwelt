import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { THEMENQUIZ_ROUTES } from './themenquiz.routes';
import { ThemenquizPage } from './pages/themenquiz.page';
import { ThemenquizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [ThemenquizPage, ThemenquizEngineComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(THEMENQUIZ_ROUTES),
  ],
})
export class ThemenquizModule {}
