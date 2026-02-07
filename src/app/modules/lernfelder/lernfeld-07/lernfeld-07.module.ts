import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD07_ROUTES } from './lernfeld-07.routes';
import { Lernfeld07Page } from './pages/lernfeld-07.page';
import { Lf07NavComponent } from './components/lf07-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    Lernfeld07Page,
    Lf07NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD07_ROUTES),
  ],
})
export class Lernfeld07Module {}

