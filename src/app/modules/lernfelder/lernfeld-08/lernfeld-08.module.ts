import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD08_ROUTES } from './lernfeld-08.routes';
import { Lernfeld08Page } from './pages/lernfeld-08.page';
import { Lf08NavComponent } from './components/lf08-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    Lernfeld08Page,
    Lf08NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD08_ROUTES),
  ],
})
export class Lernfeld08Module {}


