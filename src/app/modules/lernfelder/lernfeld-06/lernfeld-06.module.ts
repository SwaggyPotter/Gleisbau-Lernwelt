import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD06_ROUTES } from './lernfeld-06.routes';
import { Lernfeld06Page } from './pages/lernfeld-06.page';
import { Lf06NavComponent } from './components/lf06-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    Lernfeld06Page,
    Lf06NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD06_ROUTES),
  ],
})
export class Lernfeld06Module {}
