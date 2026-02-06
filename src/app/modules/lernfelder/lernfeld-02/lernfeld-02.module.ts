import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD02_ROUTES } from './lernfeld-02.routes';
import { Lernfeld02Page } from './pages/lernfeld-02.page';
import { Lf02NavComponent } from './components/lf02-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    Lernfeld02Page,
    Lf02NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD02_ROUTES),
  ],
})
export class Lernfeld02Module {}
