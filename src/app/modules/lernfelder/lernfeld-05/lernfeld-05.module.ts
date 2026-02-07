import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD05_ROUTES } from './lernfeld-05.routes';
import { Lernfeld05Page } from './pages/lernfeld-05.page';
import { Lf05NavComponent } from './components/lf05-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    Lernfeld05Page,
    Lf05NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD05_ROUTES),
  ],
})
export class Lernfeld05Module {}
