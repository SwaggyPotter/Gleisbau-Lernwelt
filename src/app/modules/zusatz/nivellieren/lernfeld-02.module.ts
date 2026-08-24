import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NIVELLIEREN_ROUTES } from './lernfeld-02.routes';
import { NivellierenPage } from './pages/lernfeld-02.page';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    NivellierenPage,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(NIVELLIEREN_ROUTES),
  ],
})
export class NivellierenModule {}
