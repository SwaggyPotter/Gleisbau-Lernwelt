import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { GESAMTQUIZ_ROUTES } from './gesamtquiz.routes';
import { ZusatzGesamtquizPage } from './pages/gesamtquiz.page';
import { GesamtquizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    ZusatzGesamtquizPage,
    GesamtquizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(GESAMTQUIZ_ROUTES),
  ],
})
export class GesamtquizModule {}
